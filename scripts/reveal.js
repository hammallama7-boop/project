// Assigns on-chain per-token metadata URIs (reveal) for PixelCatworks.
//
// Requires:
//   - A deployed PixelCatworks contract (set CONTRACT_ADDRESS below or in env)
//   - PRIVATE_KEY in .env for the owner account
//   - metadata/metadata-uris.json produced by scripts/uploadToPinata.js
//
// Usage (robinhoodTestnet by default):
//   node scripts/reveal.js            # set URIs for minted tokens
//   node scripts/reveal.js --mint 777 # also mint all tokens first
//   node scripts/reveal.js --max 10   # only first 10 tokens
//
// Token ids are 0-indexed on-chain; metadata files are 1..777.

const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

async function main() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Set CONTRACT_ADDRESS in .env or the environment.");
  }
  const args = process.argv.slice(2);
  const mintAll =
    args.includes("--mint") || process.env.REVEAL_MINT === "1";
  const maxIdx = args.indexOf("--max");
  const max =
    maxIdx >= 0
      ? Number(args[maxIdx + 1])
      : process.env.REVEAL_MAX
      ? Number(process.env.REVEAL_MAX)
      : 777;

  const uris = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "metadata", "metadata-uris.json"), "utf8")
  ).byToken;

  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("PixelCatworks", CONTRACT_ADDRESS, deployer);

  const supply = Number(await contract.totalSupply());
  console.log(`Contract ${CONTRACT_ADDRESS}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Minted so far: ${supply} / 777`);

  let tokens = Array.from({ length: Math.min(Math.max(supply, 0), 777) }, (_, i) => i);
  if (mintAll) {
    const toMint = Math.max(777 - supply, 0);
    console.log(`Minting ${toMint} tokens…`);
    let tokenId = supply;
    for (let i = 0; i < toMint; i++) {
      const tx = await contract.mint(deployer.address);
      const receipt = await tx.wait();
      tokens.push(tokenId);
      tokenId++;
      if ((i + 1) % 50 === 0 || i === toMint - 1) {
        console.log(`  minted ${i + 1}/${toMint} (last ${receipt.transactionHash})`);
      }
    }
  }

  tokens = tokens.slice(0, max);
  // Resume: skip tokens that already have an explicit (http) URI set.
  const pending = [];
  for (const tokenId of tokens) {
    let existing;
    try {
      existing = await contract.tokenURI(tokenId);
    } catch (e) {
      existing = "";
    }
    if (existing && existing.startsWith("http")) continue;
    pending.push(tokenId);
  }
  if (pending.length < tokens.length) {
    console.log(`Skipping ${tokens.length - pending.length} already-revealed tokens…`);
  }
  console.log(`Setting tokenURIs for ${pending.length} tokens…`);

  let done = 0;
  for (const tokenId of pending) {
    const fileId = tokenId + 1;
    const uri = uris[fileId];
    if (!uri) throw new Error(`No metadata URI for token ${tokenId} (file ${fileId})`);
    const tx = await contract.setTokenURI(tokenId, uri);
    await tx.wait();
    done++;
    if (done % 20 === 0 || done === pending.length) {
      console.log(`  revealed ${done}/${pending.length}`);
    }
  }
  console.log("Reveal complete.");
  console.log("Verify e.g. token 0:", await contract.tokenURI(0));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});