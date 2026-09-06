// Builds numeric-named metadata (1.json..98.json) for the Magic Internet
// Artworks contract baseURI from the descriptive per-piece JSON, rewriting
// image fields to absolute GitHub Pages URLs.
// Usage:  node scripts/buildMagicNumericMetadata.js
const fs = require("fs");
const path = require("path");

const META_DIR = path.join(__dirname, "..", "magic-internet-artworks", "metadata");
const BASE = "https://hammallama7-boop.github.io/project/magic-internet-artworks/";

const files = fs
  .readdirSync(META_DIR)
  .filter((f) => /^magic-internet-artwork-\d{4}\.json$/.test(f))
  .sort();

for (const f of files) {
  const idx = Number(f.match(/-(\d{4})\.json$/)[1]); // 1..98
  const meta = JSON.parse(fs.readFileSync(path.join(META_DIR, f), "utf8"));
  const numeric = {
    name: meta.name,
    description: meta.description,
    image: BASE + "artwork/" + meta.image,
    attributes: meta.attributes,
  };
  fs.writeFileSync(path.join(META_DIR, `${idx}.json`), JSON.stringify(numeric, null, 2));
}

console.log(`wrote ${files.length} numeric metadata files (1.json..${files.length}.json)`);