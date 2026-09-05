import { ethers } from 'ethers'
import { CHAIN, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'

let provider = null
let signer = null
let contract = null

function assertRabbyWallet() {
  if (!window.ethereum) throw new Error('No wallet detected (Rabby Wallet required)')
  if (!window.ethereum.isRabby) throw new Error('Rabby Wallet required — please install Rabby Wallet and use it for this site')
}

function getProvider() {
  assertRabbyWallet()
  return new ethers.BrowserProvider(window.ethereum)
}

export async function ensureChain() {
  assertRabbyWallet()
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
// Uses a raw eth_sendTransaction + receipt polling path to avoid ethers
// TransactionResponse parsing, which crashes on this chain for pending txs.
export async function purchase() {
  if (!signer) throw new Error('Wallet not connected')
  const contractInstance = await readContract()
  const from = await signer.getAddress()
  const priceWei = await contractInstance.price()
  const data = contractInstance.interface.encodeFunctionData('paidMint', [])

  // Use our own read-only provider for gas estimate + fee data.
  const rp = new ethers.JsonRpcProvider(CHAIN.rpcUrls[0], CHAIN.chainId)
  const gasLimit = await rp.estimateGas({ from, to: CONTRACT_ADDRESS, data, value: priceWei })

  const [history, gpRaw] = await Promise.all([
    rp.send('eth_feeHistory', ['0x8', 'latest', []]),
    rp.send('eth_gasPrice', []),
  ])
  let maxBase = 0n
  for (const v of history.baseFeePerGas) {
    const b = BigInt(v)
    if (b > maxBase) maxBase = b
  }
  const spot = BigInt(gpRaw)
  const tip = BigInt('1000000000') // 1 gwei priority fee
  let maxFee = maxBase * 2n
  if (maxFee < spot) maxFee = spot
  if (maxFee < maxBase + tip) maxFee = maxBase + tip

  const hex = (b) => '0x' + b.toString(16)
  const hash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: CONTRACT_ADDRESS,
      data,
      value: hex(priceWei),
      gas: hex(gasLimit),
      maxFeePerGas: hex(maxFee),
      maxPriorityFeePerGas: hex(tip),
    }],
  })

  // Raw receipt polling (never constructs ethers TransactionResponse).
  let receipt = null
  const deadline = Date.now() + 90000
  while (!receipt && Date.now() < deadline) {
    receipt = await rp.send('eth_getTransactionReceipt', [hash])
    if (!receipt) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!receipt) throw new Error('Timed out waiting for confirmation')
  if (receipt.status !== '0x1') throw new Error('Transaction reverted on-chain')

  const parsed = (receipt.logs || [])
    .map((l) => {
      try {
        return contractInstance.interface.parseLog(l)
      } catch {
        return null
      }
    })
    .find((p) => p && p.name === 'Claimed')
  const tokenId = parsed ? Number(parsed.args.tokenId) : Number(await contractInstance.totalSupply()) - 1
  return { hash, tokenId }
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