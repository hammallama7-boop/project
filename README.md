# Pixelated Catworks

A pixel-art cat NFT collection living on **Robinhood Chain** (testnet, chain ID 46630).

## Stack

- **Solidity contract** (`contracts/PixelCatworks.sol`) — ERC-721 with URI storage
- **Mint page** (`frontend/index.html`) — connects a wallet and mints on Robinhood testnet
- **Hardhat** — compile, test, and deploy tooling

## Contract

- Total supply: **777** Pixel Cats
- Token: `ERC721` `"PixelCatworks"` (`PCW`)
- Minting is **owner-gated** (`onlyOwner`)
- Metadata served from a configurable `baseURI`

Since Robinhood Chain is an EVM-compatible Arbitrum Orbit L2, the contract deploys **without any chain-specific changes**.

## Getting started

```bash
npm install
npx hardhat compile
```

## Network

| Parameter | Value |
|-----------|-------|
| Network | Robinhood Chain Testnet |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Chain ID | 46630 |
| Currency | Test ETH |
| Explorer | `https://explorer.testnet.chain.robinhood.com` |

## Deploy (testnet)

Set a funded testnet private key, then run:

```bash
# Windows PowerShell
$env:PRIVATE_KEY="0xYOUR_TEST_PRIVATE_KEY"
npx hardhat run scripts/deploy.js --network robinhoodTestnet
```

After deploying, set the returned contract address as `CONTRACT_ADDRESS` in `frontend/index.html`, then serve the `frontend/` directory.

> ⚠️ Never commit a private key. Keep it in your shell environment or `.env` (which is gitignored).
