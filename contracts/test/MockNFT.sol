// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockNFT
 * @dev Simple NFT contract for Sepolia testing
 */
contract MockNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("Mock Kektech NFT", "MKEK") {}

    /**
     * @dev Mint NFT to sender for testing
     */
    function mint() external {
        _safeMint(msg.sender, _tokenIdCounter);
        _tokenIdCounter++;
    }

    /**
     * @dev Mint specific token ID (for testing specific rarities)
     */
    function mintSpecific(uint256 tokenId) external {
        _safeMint(msg.sender, tokenId);
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
