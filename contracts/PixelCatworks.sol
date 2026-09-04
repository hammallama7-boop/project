// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PixelCatworks
/// @notice ERC-721 NFT collection deployable on Robinhood Chain
///         (chain ID 4663 mainnet / 46630 testnet).
///         Owner can reserve inventory via mint(); the public can buy via
///         paidMint() at a configurable price. Sale can be paused/unpaused.
contract PixelCatworks is ERC721, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIds;

    uint256 public constant MAX_SUPPLY = 98;
    uint256 public constant PUBLIC_MINT_LIMIT = 3; // per-address purchase cap
    string public baseURI;
    uint256 public price;                       // cost per token, in wei
    bool public paused;

    mapping(address => uint256) private _publicMinted;

    event Claimed(address indexed to, uint256 tokenId);
    event PriceUpdated(uint256 price);
    event Paused(bool paused);

    constructor() ERC721("PixelCatworks", "PCW") {
        // Metadata for all tokens lives under this path on GitHub Pages.
        // Files are 1-indexed (1..MAX_SUPPLY) while token ids are 0-indexed,
        // so tokenURI(tokenId) = baseURI + (tokenId+1).json
        baseURI = "https://hammallama7-boop.github.io/project/metadata/generated/";
    }

    /// @notice Total number of tokens minted so far.
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    /// @notice Reserve a token for a buyer. Only the contract owner can mint.
    ///         Use this to hand out reserved inventory without payment.
    function mint(address to) public onlyOwner returns (uint256) {
        require(_tokenIds.current() < MAX_SUPPLY, "All tokens have been minted");

        uint256 newTokenId = _tokenIds.current();
        _safeMint(to, newTokenId);
        _tokenIds.increment();

        return newTokenId;
    }

    /// @notice Purchase a Pixel Cat by sending `price` wei. Each address may buy
    ///         up to PUBLIC_MINT_LIMIT cats. Skipped while paused.
    function paidMint() public payable returns (uint256) {
        require(!paused, "Sale paused");
        require(msg.value == price, "Incorrect ETH amount");
        require(_publicMinted[msg.sender] < PUBLIC_MINT_LIMIT, "Mint limit reached for this address");
        require(_tokenIds.current() < MAX_SUPPLY, "All tokens have been minted");

        _publicMinted[msg.sender] += 1;

        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        _tokenIds.increment();

        emit Claimed(msg.sender, newTokenId);
        return newTokenId;
    }

    /// @notice Number of tokens an address has purchased via paidMint.
    function publicMintedOf(address who) public view returns (uint256) {
        return _publicMinted[who];
    }

    /// @notice Set the mint price (wei). Only owner.
    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
        emit PriceUpdated(_price);
    }

    /// @notice Pause or unpause the public sale. Only owner.
    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /// @notice Withdraw collected sale proceeds. Only owner.
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool ok, ) = payable(owner()).call{value: balance}("");
        require(ok, "Withdraw failed");
    }

    /// @notice Returns the metadata URI for a given token id.
    ///         Metadata files are 1-indexed (metadata/generated/1.json ... 98.json)
    ///         while token ids are 0-indexed, so we add 1.
    function tokenURI(uint256 tokenId) public view virtual override(ERC721) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked(baseURI, (tokenId + 1).toString(), ".json"));
    }
}
