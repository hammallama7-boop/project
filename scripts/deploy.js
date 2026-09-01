const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PixelCatworks with account:", deployer.address);

  const PixelCatworks = await hre.ethers.getContractFactory("PixelCatworks");
  const contract = await PixelCatworks.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("PixelCatworks deployed to:", address);
  console.log("Network chainId:", (await hre.ethers.provider.getNetwork()).chainId);

  console.log("\nNext steps:");
  console.log(`  1. export CONTRACT_ADDRESS=${address}`);
  console.log("  2. node scripts/uploadToPinata.js   # pin metadata, builds metadata-uris.json");
  console.log("  3. node scripts/reveal.js --mint 777 # mint all + set per-token URIs");
  console.log("  4. Put the address in frontend/index.html CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
