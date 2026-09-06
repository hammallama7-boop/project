// Deploys MagicInternetWorks + sets the mint price + prints state.
// Usage:  $env:PRICE_ETH="0.0007"
//         npx hardhat run scripts/deployMagic.js --network robinhoodTestnet
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const priceArg = process.env.PRICE_ETH;
  const priceWei = priceArg ? hre.ethers.parseEther(priceArg) : 0n;

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MagicInternetWorks with account:", deployer.address);

  const Magic = await hre.ethers.getContractFactory("MagicInternetWorks");
  const contract = await Magic.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("MagicInternetWorks deployed to:", address);
  console.log("chainId:", (await hre.ethers.provider.getNetwork()).chainId);

  if (priceArg) {
    console.log("Setting price:", priceArg, "ETH");
    const tx = await contract.setPrice(priceWei);
    await tx.wait();
  }

  console.log("\nContract state:");
  console.log("  address:     ", address);
  console.log("  totalSupply: ", Number(await contract.totalSupply()), "/", Number(await contract.MAX_SUPPLY()));
  console.log("  price:       ", hre.ethers.formatEther(await contract.price()), "ETH");
  console.log("  paused:      ", await contract.paused());
  console.log("  baseURI:     ", await contract.baseURI());
  console.log("  symbol:      ", await contract.symbol());
}

main().catch((e) => {
  console.error(e.shortMessage || e.message);
  process.exitCode = 1;
});