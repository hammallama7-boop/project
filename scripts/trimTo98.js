// Trims metadata/generated and images/generated down to the keep-list and
// rewrites metadata/token-traits.json + metadata/traits.js MAX_SUPPLY.
//
// Usage: node scripts/trimTo98.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const keepPath = path.join(ROOT, "metadata", "keep-98.json");
const keep = JSON.parse(fs.readFileSync(keepPath, "utf8"));
const keepIds = new Set(keep.map((k) => k.tokenId));

const metaDir = path.join(ROOT, "metadata", "generated");
const imgDir = path.join(ROOT, "images", "generated");

let removedMeta = 0;
let removedImg = 0;

// Metadata JSONs
const metas = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json") && /^\d+\.json$/.test(f));
for (const f of metas) {
  const id = Number(path.basename(f, ".json"));
  if (!keepIds.has(id)) {
    fs.unlinkSync(path.join(metaDir, f));
    removedMeta++;
  }
}

// Images
if (fs.existsSync(imgDir)) {
  const imgs = fs.readdirSync(imgDir).filter((f) => f.endsWith(".png") && /^\d+\.png$/.test(f));
  for (const f of imgs) {
    const id = Number(path.basename(f, ".png"));
    if (!keepIds.has(id)) {
      fs.unlinkSync(path.join(imgDir, f));
      removedImg++;
    }
  }
}

// Rewrite token-traits.json with only the kept combos (sorted by tokenId).
const traitsIndex = keep
  .map(({ tokenId, combo }) => ({ tokenId, combo }))
  .sort((a, b) => a.tokenId - b.tokenId);
fs.writeFileSync(
  path.join(ROOT, "metadata", "token-traits.json"),
  JSON.stringify(traitsIndex, null, 2)
);

console.log(`Removed ${removedMeta} metadata files, ${removedImg} image files.`);
console.log(`Kept ${traitsIndex.length}. token-traits.json rewritten.`);

// Verify counts
const remainingMeta = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json") && /^\d+\.json$/.test(f)).length;
const remainingImg = fs.existsSync(imgDir)
  ? fs.readdirSync(imgDir).filter((f) => f.endsWith(".png") && /^\d+\.png$/.test(f)).length
  : 0;
console.log(`Remaining: ${remainingMeta} metadata, ${remainingImg} images.`);
