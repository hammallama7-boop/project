const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("deployer:", deployer.address);
  console.log("chainId:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("balance:", hre.ethers.formatEther(bal), "ETH");
}

main().catch((e) => { console.error(e.shortMessage || e.message); process.exitCode = 1; });