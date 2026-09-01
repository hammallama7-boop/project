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
    string private baseURI;

    constructor() ERC721("PixelCatworks", "PCW") {}

    /// @notice Mint a new Pixel Cat. Only the contract owner can mint.
    function mint(address to) public onlyOwner returns (uint256) {
        require(_tokenIds.current() < MAX_SUPPLY, "All tokens have been minted");

        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        _tokenIds.increment();

        return newTokenId;
    }

    /// @notice Set the base URI for all token metadata.
    function setBaseURI(string memory _baseURIString) public onlyOwner {
        baseURI = _baseURIString;
    }

    /// @notice Returns the metadata URI for a given token id.
    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked(baseURI, "/metadata/", tokenId.toString(), ".json"));
    }
}
