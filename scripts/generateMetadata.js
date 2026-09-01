// Generates exactly MAX_SUPPLY distinct NFT metadata JSON files, one per token.
// Files are written to metadata/generated/{tokenId}.json and an index map is
// written to metadata/token-traits.json (tokenId -> attribute combination).
//
// Usage: node scripts/generateMetadata.js

const fs = require("fs");
const path = require("path");
const { TRAITS, MAX_SUPPLY } = require("../metadata/traits.js");

// Build the full cartesian combination space.
function cartesian(traits) {
  return traits.reduce(
    (acc, trait) =>
      acc.flatMap((partial) =>
        trait.values.map((v) => ({ ...partial, [trait.name]: v.value }))
      ),
    [{}]
  );
}

function combinationWeight(combo, traits) {
  let w = 1;
  for (const t of traits) {
    const val = combo[t.name];
    const idx = t.values.findIndex((v) => v.value === val);
    w *= t.values[idx].weight;
  }
  return w;
}

function seedRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function main() {
  const combos = cartesian(TRAITS);
  const totalSpace = combos.length;
  if (MAX_SUPPLY > totalSpace) {
    throw new Error(
      `MAX_SUPPLY (${MAX_SUPPLY}) exceeds combination space (${totalSpace}). Add more trait values.`
    );
  }

  // Weighted selection without replacement until we have MAX_SUPPLY distinct combos.
  const rng = seedRandom(1337);
  const pool = [...combos];
  const weights = pool.map((c) => combinationWeight(c, TRAITS));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const selected = [];
  const seen = new Set();

  while (selected.length < MAX_SUPPLY && pool.length > 0) {
    // Pick an index in the pool proportional to its weight.
    let r = rng() * totalWeight;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    const combo = pool[idx];
    const key = JSON.stringify(combo);
    if (!seen.has(key)) {
      seen.add(key);
      selected.push(combo);
    }
    // Remove picked combo from pool to avoid reselect.
    pool.splice(idx, 1);
    weights.splice(idx, 1);
    // recalc total weight (slightly stale, but fine given removal)
    // eslint-disable-next-line no-constant-condition
  }

  // Shuffle selection into token order.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  const outDir = path.join(__dirname, "..", "metadata", "generated");
  fs.mkdirSync(outDir, { recursive: true });

  const traitsIndex = [];

  selected.forEach((combo, i) => {
    const tokenId = i + 1; // tokenIds are 0-indexed in contract, but metadata files 1..777
    const attributes = Object.keys(combo).map((traitName) => ({
      trait_type: traitName,
      value: combo[traitName],
    }));

    const metadata = {
      name: `Pixel Cat #${tokenId}`,
      description:
        "Pixelated Catworks — a curated collection of 777 pixel-art cats on Robinhood Chain.",
      image: `ipfs://__IMAGE_CID__/${tokenId}.png`, // replace with your generated art
      attributes,
    };

    fs.writeFileSync(
      path.join(outDir, `${tokenId}.json`),
      JSON.stringify(metadata, null, 2)
    );
    traitsIndex.push({ tokenId, combo });
  });

  fs.writeFileSync(
    path.join(__dirname, "..", "metadata", "token-traits.json"),
    JSON.stringify(traitsIndex, null, 2)
  );

  console.log(`Generated ${selected.length} unique combinations.`);
  console.log(`Combination space: ${totalSpace}`);
  console.log(`Output: ${outDir}`);
  console.log("Index: metadata/token-traits.json");

  // Rarity summary.
  const summary = {};
  for (const t of TRAITS) {
    summary[t.name] = {};
  }
  for (const { combo } of traitsIndex) {
    for (const [k, v] of Object.entries(combo)) {
      summary[k][v] = (summary[k][v] || 0) + 1;
    }
  }
  console.log("\nRarity distribution (count per value):");
  console.log(JSON.stringify(summary, null, 2));
  void totalWeight;
}

main();
