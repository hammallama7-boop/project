// Mints all remaining PixelCatworks tokens up to MAX_SUPPLY to the deployer.
// With the baseURI scheme there is no per-token reveal step — tokenURI is
// computed from baseURI on-chain.
//
// Usage:
//   node scripts/mint98.js            # mint all up to MAX_SUPPLY to deployer
//   REVEAL_MAX=10 node scripts/mint98.js   # mint only up to 10 total
const hre = require("hardhat");
require("dotenv").config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

async function main() {
  if (!CONTRACT_ADDRESS) throw new Error("Set CONTRACT_ADDRESS in .env");

  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("PixelCatworks", CONTRACT_ADDRESS, deployer);

  const MAX_SUPPLY = Number(await contract.MAX_SUPPLY());
  const supply = Number(await contract.totalSupply());
  console.log(`Contract ${CONTRACT_ADDRESS}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Supply: ${supply} / ${MAX_SUPPLY}`);

  const maxTarget = process.env.REVEAL_MAX ? Number(process.env.REVEAL_MAX) : MAX_SUPPLY;
  const toMint = Math.max(Math.min(maxTarget, MAX_SUPPLY) - supply, 0);
  console.log(`Minting ${toMint} tokens…`);

  for (let i = 0; i < toMint; i++) {
    const tx = await contract.mint(deployer.address);
    const receipt = await tx.wait();
    if ((i + 1) % 10 === 0 || i === toMint - 1) {
      console.log(`  minted ${i + 1}/${toMint} (tx ${receipt.transactionHash})`);
    }
  }

  console.log("\nDone. Verifying tokenURIs…");
  const finalSupply = Number(await contract.totalSupply());
  for (let id = 0; id < Math.min(finalSupply, 3); id++) {
    console.log(`tokenURI(${id}) = ${await contract.tokenURI(id)}`);
  }
  if (finalSupply > 0) {
    console.log(`tokenURI(${finalSupply - 1}) = ${await contract.tokenURI(finalSupply - 1)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
