// Rewrites all metadata/generated/*.json `image` fields to GitHub Pages URLs
// (metadata + images served together). Since Pinata quota is blocked (can't pin
// the 98 new images), we host images on GitHub Pages alongside the metadata.
//
// Images are 1-indexed (metadata/generated/1.json .. 98.json).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const metaDir = path.join(ROOT, "metadata", "generated");
const IMG_BASE = "https://hammallama7-boop.github.io/project/images/generated/";

const files = fs.readdirSync(metaDir).filter((f) => /^\d+\.json$/.test(f));
let updated = 0;
for (const f of files) {
  const id = Number(path.basename(f, ".json"));
  const fp = path.join(metaDir, f);
  const json = JSON.parse(fs.readFileSync(fp, "utf8"));
  json.image = `${IMG_BASE}${id}.png`;
  fs.writeFileSync(fp, JSON.stringify(json, null, 2));
  updated++;
}
console.log(`Updated image field in ${updated} metadata files -> ${IMG_BASE}`);
