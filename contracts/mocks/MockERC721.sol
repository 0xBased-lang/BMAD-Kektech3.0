// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockERC721
 * @notice Simple ERC721 NFT for testing purposes
 * @dev Allows minting NFTs with specific token IDs for deterministic rarity testing
 */
contract MockERC721 is ERC721 {
    uint256 private _totalSupply;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    /**
     * @notice Mint an NFT to a specific address with a specific token ID
     * @param to Address to mint to
     * @param tokenId Token ID to mint
     */
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
        _totalSupply++;
    }

    /**
     * @notice Batch mint multiple NFTs
     * @param to Address to mint to
     * @param tokenIds Array of token IDs to mint
     */
    function batchMint(address to, uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _mint(to, tokenIds[i]);
            _totalSupply++;
        }
    }

    /**
     * @notice Get total supply of minted NFTs
     * @return Total number of NFTs minted
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
}
