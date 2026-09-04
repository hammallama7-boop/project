// Records the baseURI-based token metadata mapping for the 98-token collection.
// The contract stores a single baseURI (GitHub Pages) and computes each
// token's URI as: tokenURI(n) = baseURI + (n+1).json  (0-indexed ids, 1-indexed files)
//
// Usage:
//   node scripts/buildTokenUris.js
//
// Writes:
//   metadata/metadata-uris.json  { base, byToken: { "1": "<url>", ... } }

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const TOTAL = 98;
const BASE = "https://hammallama7-boop.github.io/project/metadata/generated/";

async function main() {
  const metaDir = path.join(__dirname, "..", "metadata", "generated");
  if (!fs.existsSync(metaDir)) {
    console.error("metadata/generated not found. Run scripts/generateMetadata.js first.");
    process.exit(1);
  }

  const byToken = {};
  let missing = 0;
  for (let id = 1; id <= TOTAL; id++) {
    const fp = path.join(metaDir, `${id}.json`);
    if (!fs.existsSync(fp)) {
      missing++;
      continue;
    }
    // File id === tokenURI id. On-chain tokenId = id - 1.
    byToken[id.toString()] = `${BASE}${id}.json`;
  }
  if (missing > 0) console.warn(`WARNING: missing ${missing} metadata files.`);

  fs.writeFileSync(
    path.join(__dirname, "..", "metadata", "metadata-uris.json"),
    JSON.stringify({ base: BASE, byToken, updatedAt: new Date().toISOString() }, null, 2)
  );

  console.log("Wrote metadata/metadata-uris.json");
  console.log(`Tokens mapped: ${Object.keys(byToken).length}`);
  console.log("tokenURI(0) =>", byToken[1]);
  console.log("tokenURI(97) =>", byToken[98]);
  console.log("\nContract baseURI:", BASE);
  console.log("On-chain tokenURI(n) = baseURI + (n+1).json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
