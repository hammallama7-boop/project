// Pins generated NFT images to Pinata (v3 API, JWT) and rewrites metadata
// image fields with real per-token IPFS URLs.
//
// Free Pinata plans cap a single request at 150 files, so the 777 PNGs are
// uploaded in batches of 130. Each batch upload returns one folder CID and every
// PNG in it is addressed as ipfs://<batchCid>/<id>.png.
//
// Usage:
//   node scripts/pinImages.js
//
// Results:
//   - images/generated/*.png pinned to IPFS (!! costs Pinata pins)
//   - metadata/generated/*.json `image` set to ipfs://<cid>/<id>.png
//   - metadata/image-uris.json written (per-token image URL + batch map)

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const JWT = process.env.PINATA_JWT;
const BATCH_SIZE = 130;
const { MAX_SUPPLY } = require("../metadata/traits.js");
const TOTAL = MAX_SUPPLY;

if (!JWT) {
  console.error("Missing PINATA_JWT. Add it to .env or the environment.");
  process.exit(1);
}

async function uploadBatch(files) {
  const form = new FormData();
  for (const { filename, stream } of files) {
    form.append("file", stream, { filename });
  }
  form.append("network", "public");
  form.append("name", `pixelcatworks-images-${files[0].filename}-${files[files.length - 1].filename}`);
  const res = await axios.post("https://uploads.pinata.cloud/v3/files", form, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: { Authorization: `Bearer ${JWT}`, ...form.getHeaders() },
  });
  return res.data.data.cid;
}

function batchOf(tokenId) {
  return Math.floor((tokenId - 1) / BATCH_SIZE);
}

async function main() {
  const imgDir = path.join(__dirname, "..", "images", "generated");
  const metaDir = path.join(__dirname, "..", "metadata", "generated");
  if (!fs.existsSync(imgDir)) {
    console.error("images/generated not found. Run scripts/renderArt.js first.");
    process.exit(1);
  }

  const batches = [];
  const byToken = {};

  for (let k = 0; k * BATCH_SIZE < TOTAL; k++) {
    const start = k * BATCH_SIZE + 1;
    const end = Math.min((k + 1) * BATCH_SIZE, TOTAL);
    const files = [];
    for (let id = start; id <= end; id++) {
      const filename = `${id}.png`;
      const fp = path.join(imgDir, filename);
      if (!fs.existsSync(fp)) throw new Error(`Missing image ${fp}`);
      files.push({ filename, stream: fs.createReadStream(fp) });
    }
    console.log(`Uploading batch ${k + 1}: tokens ${start}–${end} (${files.length} files)…`);
    const cid = await uploadBatch(files);
    console.log(`  batch ${k + 1} CID: ${cid}`);
    batches.push({ start, end, cid });
    for (let id = start; id <= end; id++) {
      byToken[id] = `ipfs://${cid}/${id}.png`;
    }
  }

  // Rewrite metadata `image` fields.
  const metas = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json"));
  let rewritten = 0;
  for (const f of metas) {
    const id = Number(f.split(".")[0]);
    if (!(id in byToken)) continue;
    const fp = path.join(metaDir, f);
    const json = JSON.parse(fs.readFileSync(fp, "utf8"));
    json.image = byToken[id];
    fs.writeFileSync(fp, JSON.stringify(json, null, 2));
    rewritten++;
  }
  console.log(`Rewrote image field in ${rewritten} metadata files.`);

  fs.writeFileSync(
    path.join(__dirname, "..", "metadata", "image-uris.json"),
    JSON.stringify({ batches, byToken, updatedAt: new Date().toISOString() }, null, 2)
  );
  console.log("Wrote metadata/image-uris.json");
  console.log("\nSample image URLs:");
  console.log("  token 1:  ", byToken[1]);
  console.log("  token 777:", byToken[777]);
}

main().catch((e) => {
  console.error(e.response ? JSON.stringify(e.response.data) : e);
  process.exit(1);
});