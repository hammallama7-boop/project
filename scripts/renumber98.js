// Renumbers the 98 kept pieces to new IDs 1..98 (sorted by original tokenId),
// updates names/descriptions, rewrites token-traits.json, and sets traits.js MAX_SUPPLY=98.
// Keeps metadata files aligned: contract tokenId = fileId - 1 (0-indexed).
//
// Usage: node scripts/renumber98.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const keep = JSON.parse(fs.readFileSync(path.join(ROOT, "metadata", "keep-98.json"), "utf8"));
keep.sort((a, b) => a.tokenId - b.tokenId);

const metaDir = path.join(ROOT, "metadata", "generated");
const imgDir = path.join(ROOT, "images", "generated");

const traitsIndex = [];
let moved = 0;

keep.forEach(({ tokenId: oldId, combo }, idx) => {
  const newId = idx + 1;

  // Metadata: read old, renumber, write new file
  const oldMeta = path.join(metaDir, `${oldId}.json`);
  const newMeta = path.join(metaDir, `${newId}.json`);
  if (fs.existsSync(oldMeta) && newId !== oldId) {
    const json = JSON.parse(fs.readFileSync(oldMeta, "utf8"));
    json.name = `Pixel Cat #${newId}`;
    json.description =
      "Pixelated Catworks — a curated collection of 98 pixel-art cats on Robinhood Chain.";
    // Keep image field as-is (will be re-pointed by pinImages in a later step).
    fs.writeFileSync(newMeta, JSON.stringify(json, null, 2));
    fs.unlinkSync(oldMeta);
    moved++;
  } else if (newId === oldId) {
    // Same id: just update name/desc in place.
    const json = JSON.parse(fs.readFileSync(oldMeta, "utf8"));
    json.name = `Pixel Cat #${newId}`;
    json.description =
      "Pixelated Catworks — a curated collection of 98 pixel-art cats on Robinhood Chain.";
    fs.writeFileSync(oldMeta, JSON.stringify(json, null, 2));
  } else {
    throw new Error(`Old metadata missing for ${oldId}`);
  }

  // Image: rename old -> new
  const oldImg = path.join(imgDir, `${oldId}.png`);
  const newImg = path.join(imgDir, `${newId}.png`);
  if (fs.existsSync(oldImg) && newId !== oldId) {
    fs.renameSync(oldImg, newImg);
  } else if (!fs.existsSync(oldImg)) {
    throw new Error(`Old image missing for ${oldId}`);
  }

  traitsIndex.push({ tokenId: newId, combo });
});

// Write token-traits with new IDs
fs.writeFileSync(
  path.join(ROOT, "metadata", "token-traits.json"),
  JSON.stringify(traitsIndex, null, 2)
);

console.log(`Renumbered/moved ${moved} metadata + images to 1..98.`);
console.log(`token-traits.json rewritten for ${traitsIndex.length} tokens.`);

// Verify
const nMeta = fs.readdirSync(metaDir).filter((f) => /^\d+\.json$/.test(f)).length;
const nImg = fs.readdirSync(imgDir).filter((f) => /^\d+\.png$/.test(f)).length;
console.log(`Remaining: ${nMeta} metadata, ${nImg} images.`);
