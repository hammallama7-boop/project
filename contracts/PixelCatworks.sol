// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PixelCatworks
/// @notice ERC-721 NFT collection deployable on Robinhood Chain
///         (chain ID 4663 mainnet / 46630 testnet, an Arbitrum Orbit EVM L2).
///         No chain-specific contract changes required to deploy here.
contract PixelCatworks is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIds;

    uint256 public constant MAX_SUPPLY = 777;
    uint256 public constant PUBLIC_MINT_LIMIT = 3;
    string private baseURI;

    mapping(address => uint256) private _publicMinted;

    constructor() ERC721("PixelCatworks", "PCW") {}

    /// @notice Total number of tokens minted so far.
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    /// @notice Mint a new Pixel Cat. Only the contract owner can mint.
    function mint(address to) public onlyOwner returns (uint256) {
        require(_tokenIds.current() < MAX_SUPPLY, "All tokens have been minted");

        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        _tokenIds.increment();

        return newTokenId;
    }

    /// @notice Public free mint available to anyone. Each address may mint up
    ///         to PUBLIC_MINT_LIMIT cats to try the collection.
    function publicMint() public returns (uint256) {
        require(_publicMinted[msg.sender] < PUBLIC_MINT_LIMIT, "Mint limit reached for this address");
        require(_tokenIds.current() < MAX_SUPPLY, "All tokens have been minted");

        _publicMinted[msg.sender] += 1;

        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        _tokenIds.increment();

        return newTokenId;
    }

    /// @notice How many public-mint cats an address has claimed.
    function publicMintedOf(address who) public view returns (uint256) {
        return _publicMinted[who];
    }

    /// @notice Set the base URI used as a fallback when no per-token URI is set.
    function setBaseURI(string memory _baseURIString) public onlyOwner {
        baseURI = _baseURIString;
    }

    /// @notice Set an explicit metadata URI for one token. Per-token URIs take
    ///         precedence over the base URI (see ERC721URIStorage).
    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, uri);
    }

    /// @notice Returns the metadata URI for a given token id.
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
