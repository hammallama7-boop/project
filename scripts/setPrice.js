// Sets the mint price on PixelCatworks and prints contract state.
// Usage: node scripts/setPrice.js <eth-price>
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const priceArg = process.env.PRICE_ETH;
  const priceWei = priceArg ? hre.ethers.parseEther(priceArg) : 0n;
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  if (!CONTRACT_ADDRESS) throw new Error("Set CONTRACT_ADDRESS in .env");

  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("PixelCatworks", CONTRACT_ADDRESS, deployer);

  const owner = await contract.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("Signer is not contract owner");
  }

  console.log(`Setting price to ${priceArg} ETH (${priceWei} wei)…`);
  const tx = await contract.setPrice(priceWei);
  await tx.wait();
  console.log("Price set. Tx:", tx.hash);

  console.log("\nContract state:");
  console.log("  address:     ", CONTRACT_ADDRESS);
  console.log("  owner:       ", owner);
  console.log("  totalSupply: ", Number(await contract.totalSupply()), "/", Number(await contract.MAX_SUPPLY()));
  console.log("  price:       ", hre.ethers.formatEther(await contract.price()), "ETH");
  console.log("  paused:      ", await contract.paused());
  console.log("  baseURI:     ", await contract.baseURI());
  console.log("  tokenURI(0): ", await contract.tokenURI(0));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
