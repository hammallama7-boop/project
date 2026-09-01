// Uploads the generated NFT metadata folder to Pinata for a single baseURI.
// Uses the legacy Pinata v1 API with API key + secret (matches the project's
// existing Pinata setup), via pinFileToIPFS on the metadata/generated directory,
// producing one CID usable directly as the contract baseURI.
//
// Usage:
//   $env:PINATA_API_KEY="..."; $env:PINATA_SECRET_API_KEY="..."
//   node scripts/uploadToPinata.js
//
// Contract tokenURI() builds: <baseURI>/metadata/<id>.json
// We pin the folder so it is served at <CID>/metadata/<id>.json, hence:
//   setBaseURI("ipfs://<CID>/")

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const API_KEY = process.env.PINATA_API_KEY;
const SECRET_KEY = process.env.PINATA_SECRET_API_KEY;

if (!API_KEY || !SECRET_KEY) {
  console.error(
    "Missing credentials. Set PINATA_API_KEY and PINATA_SECRET_API_KEY."
  );
  process.exit(1);
}

const PINATA_URL = "https://api.pinata.cloud";
const authHeaders = {
  pinata_api_key: API_KEY,
  pinata_secret_api_key: SECRET_KEY,
};

async function main() {
  const genDir = path.join(__dirname, "..", "metadata", "generated");
  if (!fs.existsSync(genDir)) {
    console.error(
      "metadata/generated not found. Run scripts/generateMetadata.js first."
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(genDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => Number(a.split(".")[0]) - Number(b.split(".")[0]));

  console.log(`Uploading directory with ${files.length} metadata files…`);

  const form = new FormData();
  // For legacy key/secret auth, pass the directory as an absolute path so
  // Pinata preserves the folder hierarchy.
  form.append("file", fs.createReadStream(genDir), {
    filepath: path.resolve(genDir),
  });
  form.append("pinataMetadata", JSON.stringify({ name: "pixelcatworks-metadata" }));

  try {
    const res = await axios.post(`${PINATA_URL}/pinning/pinFileToIPFS`, form, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        ...authHeaders,
        ...form.getHeaders(),
      },
    });

    const cid = res.data.IpfsHash;
    console.log("\n=== Upload complete ===");
    console.log(`Files: ${files.length}`);
    console.log(`Directory CID: ${cid}`);
    console.log("\nSet baseURI on your contract to:");
    console.log(`ipfs://${cid}/`);
    console.log(`\nso tokenURI(n) resolves to:\nipfs://${cid}/metadata/${files.length > 0 ? "" : ""}n.json`);
  } catch (err) {
    console.error("Upload failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
