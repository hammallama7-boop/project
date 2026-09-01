// Pins generated NFT images to Pinata and rewrites the metadata image fields
// with the real IPFS CIDs. Uses legacy key/secret auth (matches project setup).
//
// Usage:
//   $env:PINATA_API_KEY="..."
//   $env:PINATA_SECRET_API_KEY="..."
//   node scripts/pinImages.js
//
// Results:
//   - images/generated/ pinned as a folder -> one CID
//   - metadata/generated/*.json `image` field updated to ipfs://<CID>/<id>.png
//   - metadata/base-uris.json written with both image & metadata CIDs

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const API_KEY = process.env.PINATA_API_KEY;
const SECRET_KEY = process.env.PINATA_SECRET_API_KEY;

if (!API_KEY || !SECRET_KEY) {
  console.error("Missing credentials. Set PINATA_API_KEY and PINATA_SECRET_API_KEY.");
  process.exit(1);
}

const authHeaders = {
  pinata_api_key: API_KEY,
  pinata_secret_api_key: SECRET_KEY,
};

async function main() {
  const imgDir = path.join(__dirname, "..", "images", "generated");
  const metaDir = path.join(__dirname, "..", "metadata", "generated");
  if (!fs.existsSync(imgDir)) {
    console.error("images/generated not found. Run scripts/renderArt.js first.");
    process.exit(1);
  }

  const pngs = fs
    .readdirSync(imgDir)
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => Number(a.split(".")[0]) - Number(b.split(".")[0]));
  console.log(`Pinning ${pngs.length} images…`);

  const form = new FormData();
  form.append("file", fs.createReadStream(imgDir), { filepath: path.resolve(imgDir) });
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: "pixelcatworks-images" })
  );

  let cid;
  try {
    const res = await axios.post(
      `${"https://api.pinata.cloud"}/pinning/pinFileToIPFS`,
      form,
      {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: { ...authHeaders, ...form.getHeaders() },
      }
    );
    cid = res.data.IpfsHash;
    console.log(`Images folder CID: ${cid}`);
  } catch (err) {
    console.error("Image pin failed:", err.response?.data || err.message);
    process.exit(1);
  }

  // Rewrite metadata image fields.
  const metas = fs
    .readdirSync(metaDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => Number(a.split(".")[0]) - Number(b.split(".")[0]));
  for (const f of metas) {
    const fp = path.join(metaDir, f);
    const json = JSON.parse(fs.readFileSync(fp, "utf8"));
    json.image = `ipfs://${cid}/${f.replace(".json", ".png")}`;
    fs.writeFileSync(fp, JSON.stringify(json, null, 2));
  }
  console.log(`Rewrote image field in ${metas.length} metadata files.`);

  fs.writeFileSync(
    path.join(__dirname, "..", "metadata", "base-uris.json"),
    JSON.stringify({ imageCid: cid, updatedAt: new Date().toISOString() }, null, 2)
  );
  console.log("Wrote metadata/base-uris.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});