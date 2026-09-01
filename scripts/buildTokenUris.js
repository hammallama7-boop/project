// Builds the per-token metadata URI map for a GitHub Pages-hosted metadata
// folder. This replaces the Pinata metadata upload (free Pinata plans cap at
// 500 total files; art already consumed the allowance).
//
// Metadata JSONs live in the repo at metadata/generated/<id>.json and are
// served from GitHub Pages as:
//   https://<owner>.github.io/<repo>/metadata/generated/<id>.json
//
// Usage:
//   node scripts/buildTokenUris.js
// Optional env: PAGES_BASE (defaults to the repo's Pages URL).
//
// Writes:
//   metadata/metadata-uris.json  { byToken: { "1": "<url>", ... } }

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const TOTAL = 777;
const PAGES_BASE =
  process.env.PAGES_BASE || "https://hammallama7-boop.github.io/project";

async function main() {
  const metaDir = path.join(__dirname, "..", "metadata", "generated");
  if (!fs.existsSync(metaDir)) {
    console.error(
      "metadata/generated not found. Run scripts/generateMetadata.js first."
    );
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
    byToken[id] = `${PAGES_BASE}/metadata/generated/${id}.json`;
  }
  if (missing > 0) console.warn(`WARNING: missing ${missing} metadata files.`);

  fs.writeFileSync(
    path.join(__dirname, "..", "metadata", "metadata-uris.json"),
    JSON.stringify({ base: PAGES_BASE, byToken, updatedAt: new Date().toISOString() }, null, 2)
  );

  console.log("Wrote metadata/metadata-uris.json");
  console.log(`Tokens mapped: ${Object.keys(byToken).length}`);
  console.log("Sample tokenURIs (stored on-chain per token):");
  console.log("  token 0:  ", byToken[1]);
  console.log("  token 130:", byToken[131]);
  console.log("  token 776:", byToken[777]);
  console.log("\nReminder: enable GitHub Pages on the repo (Settings > Pages > Deploy from branch: main / root).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});