const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PixelCatworks with account:", deployer.address);

  const PixelCatworks = await hre.ethers.getContractFactory("PixelCatworks");
  const contract = await PixelCatworks.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("PixelCatworks deployed to:", address);
  console.log("Network chainId:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("Set baseURI in the UI / contract as needed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
