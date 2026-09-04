// Selects the N rarest combs (by trait-weight product) from the 777 generated
// token-traits.json and writes the chosen subset to a keep-list.
//
// Usage: node scripts/selectRarest.js
// Output:
//   - metadata/keep-98.json        [{ tokenId, combo, rarity }] sorted by rarity (rarest first)
//   - metadata/keep-dir.txt  temp guide (deleted)

const fs = require("fs");
const path = require("path");
const { TRAITS } = require("../metadata/traits.js");

const KEEP = 98;

function rarityOf(combo) {
  // Product of trait weights; LOWER weight = RARER combo.
  let w = 1;
  for (const t of TRAITS) {
    const v = combo[t.name];
    const idx = t.values.findIndex((x) => x.value === v);
    if (idx < 0) throw new Error(`Unknown value ${v} for ${t.name}`);
    w *= t.values[idx].weight;
  }
  return w;
}

function main() {
  const indexPath = path.join(__dirname, "..", "metadata", "token-traits.json");
  const all = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (all.length !== 777) {
    console.warn(`Warning: expected 777 entries, found ${all.length}`);
  }

  const scored = all.map(({ tokenId, combo }) => ({
    tokenId,
    combo,
    rarity: rarityOf(combo),
  }));

  // Sort by rarity ascending (rarest first), tie-break by tokenId for stability.
  scored.sort((a, b) => a.rarity - b.rarity || a.tokenId - b.tokenId);

  const keep = scored.slice(0, KEEP);
  keep.sort((a, b) => a.tokenId - b.tokenId);

  const out = path.join(__dirname, "..", "metadata", `keep-${KEEP}.json`);
  fs.writeFileSync(out, JSON.stringify(keep, null, 2));

  console.log(`Selected ${keep.length} rarest from ${all.length}.`);
  console.log(`Rarity range of kept: ${keep[0].rarity} (rarest) .. ${keep[keep.length - 1].rarity}`);
  console.log(`Token IDs kept: ${keep.map((k) => k.tokenId).join(", ")}`);
  console.log(`Wrote ${out}`);

  // Rarity distribution of the kept set per trait.
  const summary = {};
  for (const t of TRAITS) summary[t.name] = {};
  for (const { combo } of keep) {
    for (const [k, v] of Object.entries(combo)) summary[k][v] = (summary[k][v] || 0) + 1;
  }
  console.log("\nKept-set rarity distribution:");
  console.log(JSON.stringify(summary, null, 2));
}

main();
