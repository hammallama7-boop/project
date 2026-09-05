// Contract + network config for the deployed PixelCatworks sale contract.
export const CONTRACT_ADDRESS = '0x001d50Fc09F34691C1EE71FF8ED411a81d2d70ba'

export const CHAIN = {
  chainId: 4663,
  chainIdHex: '0x1237',
  chainName: 'Robinhood Chain Mainnet',
  rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
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