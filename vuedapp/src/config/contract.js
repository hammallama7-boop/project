// Contract + network config for the deployed PixelCatworks sale contract.
export const CONTRACT_ADDRESS = '0x1Cce598eF0EC4bB014C0B08DB95515833c8e10D2'

export const CHAIN = {
  chainId: 46630,
  chainIdHex: '0xB626',
  chainName: 'Robinhood Chain Testnet',
  rpcUrls: ['https://rpc.testnet.chain.robinhood.com'],
  nativeCurrency: { name: 'Test ETH', symbol: 'ETH', decimals: 18 },
}

export const CONTRACT_ABI = [
  'function mint(address to) public returns (uint256)',
  'function paidMint() public payable returns (uint256)',
  'function publicMintedOf(address) public view returns (uint256)',
  'function MAX_SUPPLY() public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function owner() public view returns (address)',
  'function price() public view returns (uint256)',
  'function paused() public view returns (bool)',
  'function setPrice(uint256) public',
  'function setPaused(bool) public',
  'function withdraw() public',
  'function balanceOf(address) public view returns (uint256)',
  'function ownerOf(uint256) public view returns (address)',
  'function tokenURI(uint256) public view returns (string)',
  'event Claimed(address indexed to, uint256 tokenId)',
]