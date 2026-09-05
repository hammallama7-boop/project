import { ethers } from 'ethers'
import { CHAIN, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'

let provider = null
let signer = null
let contract = null

function getProvider() {
  if (!window.ethereum) throw new Error('No wallet detected (MetaMask or Robinhood Wallet required)')
  return new ethers.BrowserProvider(window.ethereum)
}

export async function ensureChain() {
  if (!window.ethereum) throw new Error('No wallet detected (MetaMask or Robinhood Wallet required)')
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN.chainIdHex }],
    })
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [CHAIN] })
    } else {
      throw err
    }
  }
}

export async function connect() {
  await ensureChain()
  provider = getProvider()
  signer = await provider.getSigner()
  const network = await provider.getNetwork()
  if (Number(network.chainId) !== CHAIN.chainId) {
    throw new Error(`Wrong network: please switch to ${CHAIN.chainName}`)
  }
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  return {
    address: await signer.getAddress(),
    contract,
  }
}

// Read-only contract instance (works without signing).
export async function readContract() {
  provider = provider || getProvider()
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

export function getSigner() {
  return signer
}

export async function getState() {
  const c = await readContract()
  const [supply, max, price, paused, balance] = await Promise.all([
    c.totalSupply(),
    c.MAX_SUPPLY(),
    c.price(),
    c.paused(),
    signer ? c.balanceOf(await signer.getAddress()) : Promise.resolve(0n),
  ])
  return {
    supply: Number(supply),
    max: Number(max),
    priceEth: ethers.formatEther(price),
    paused,
    balance: Number(balance),
  }
}

// Purchase one token for `price` wei. Resolves with the minted tokenId.
export async function purchase() {
  if (!contract) throw new Error('Wallet not connected')
  const priceWei = await contract.price()
  const tx = await contract.paidMint({ value: priceWei })
  const receipt = await tx.wait()
  const event = receipt.logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l)
      } catch {
        return null
      }
    })
    .find((p) => p && p.name === 'Claimed')
  const tokenId = event ? Number(event.args.tokenId) : Number(await contract.totalSupply()) - 1
  return tokenId
}

// Convert ipfs://CID/path to an https gateway URL for browser display.
export function ipfsHttp(uri) {
  if (!uri) return ''
  if (/^https?:\/\//.test(uri)) return uri
  if (uri.startsWith('ipfs://')) {
    const rest = uri.slice('ipfs://'.length)
    const slash = rest.indexOf('/')
    const cid = slash === -1 ? rest : rest.slice(0, slash)
    const path = slash === -1 ? '' : rest.slice(slash)
    return `https://gateway.pinata.cloud/ipfs/${cid}${path}`
  }
  return uri
}

// Fetch token metadata from its on-chain tokenURI (GitHub Pages JSON).
export async function fetchTokenMetadata(tokenId, c) {
  const contractInstance = c || (await readContract())
  const uri = await contractInstance.tokenURI(tokenId)
  const res = await fetch(uri)
  if (!res.ok) throw new Error(`Metadata fetch failed for token ${tokenId}: ${res.status}`)
  const json = await res.json()
  return {
    tokenId,
    name: json.name || `Pixel Cat #${tokenId + 1}`,
    image: ipfsHttp(json.image),
    attributes: json.attributes || [],
  }
}