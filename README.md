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

## Metadata pipeline

The collection uses 5 rarity traits (`metadata/traits.js`). Because `777 = 3 × 7 × 37`, no set of 5 non-trivial trait counts multiplies to exactly 777, so metadata is curated by **weighted rarity sampling**: the script generates exactly 777 distinct trait combinations, biasing common values over rare ones.

```bash
# 1. Generate 777 metadata JSONs + 777 pixel-art PNGs (both deterministic)
npm run gen:assets

# 2. Pin the PNGs, substitute real image CIDs into metadata
$env:PINATA_API_KEY="..."
$env:PINATA_SECRET_API_KEY="..."
npm run pin:images

# 3. Upload the metadata folder, print the baseURI
npm run pin:metadata
```

The upload prints a directory CID. On your deployed contract:

```bash
npx hardhat console --network robinhoodTestnet
> const c = await ethers.getContractAt("PixelCatworks", "0xYOUR_DEPLOYED_ADDRESS")
> await c.setBaseURI("ipfs://<CID>/")
```

Then `tokenURI(n)` resolves to `ipfs://<CID>/metadata/<n>.json`.

### Generated art

`npm run render:art` draws each cat procedurally from its **own trait combination**, so the PNG always matches the metadata attributes:

| Trait | Art effect |
|-------|-----------|
| Fur Color | body silhouette + outline palette |
| Eye Color | eye fill (Heterochromia gives two different eyes) |
| Injuries | scar line / tipped ear / stitches |
| Accessories | collar+bells, bow, or glasses |
| Toes | number of claws shown at the bottom |

Rendering is seeded by `tokenId`, so images are reproducible from code alone. `images/generated/` and `metadata/generated/` are gitignored (regenerable), while `metadata/token-traits.json` is committed as the source of truth.
