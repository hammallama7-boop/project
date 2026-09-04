// Lists all pinned files on Pinata v3 (optionally deletes them).
// Usage:
//   node scripts/pinataFiles.js list        -> list pinned files + count
//   node scripts/pinataFiles.js delete      -> delete ALL pinned files (DESTRUCTIVE)
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const JWT = process.env.PINATA_JWT;
const BASE = "https://api.pinata.cloud/v3";

if (!JWT) {
  console.error("Missing PINATA_JWT");
  process.exit(1);
}

async function listAll() {
  const files = [];
  let cursor = null;
  do {
    const url = `${BASE}/files?status=pinned&limit=100${cursor ? `&pageToken=${cursor}` : ""}`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${JWT}` } });
    const data = res.data.data || res.data;
    const items = data.files || [];
    files.push(...items.map((f) => ({ id: f.id, cid: f.cid, name: f.name, size: f.file_size, mime: f.mime_type })));
    cursor = data.nextPageToken || data.cursor || null;
  } while (cursor);
  return files;
}

async function deleteAll(files) {
  const ids = files.map((f) => f.id);
  // Delete in chunks of 900 to stay under API limits.
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 900) {
    const chunk = ids.slice(i, i + 900);
    const url = `${BASE}/files/delete`;
    const res = await axios.post(url, { ids: chunk }, { headers: { Authorization: `Bearer ${JWT}` } });
    console.log(`Deleted batch of ${chunk.length}: ${res.status}`);
    deleted += chunk.length;
  }
  return deleted;
}

async function main() {
  const action = process.argv[2] || "list";
  console.log("Listing all pinned files…");
  const files = await listAll();
  console.log(`Total pinned files: ${files.length}`);
  const totalBytes = files.reduce((a, b) => a + (b.size || 0), 0);
  console.log(`Total bytes: ${totalBytes}`);
  const names = {};
  for (const f of files) names[f.name] = (names[f.name] || 0) + 1;
  console.log("\nBy name:");
  for (const [k, v] of Object.entries(names)) console.log(`  ${v} x ${k}`);

  if (action === "delete") {
    console.log("\nDeleting ALL pinned files…");
    const deleted = await deleteAll(files);
    console.log(`Deleted ${deleted} files.`);
    const after = await listAll();
    console.log(`Remaining: ${after.length}`);
  }
}

main().catch((e) => {
  console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e);
  process.exit(1);
});
