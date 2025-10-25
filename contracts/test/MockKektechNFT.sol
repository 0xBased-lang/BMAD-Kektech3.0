// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockKektechNFT
 * @notice Mock NFT contract for testing EnhancedNFTStaking
 * @dev Allows minting any token ID for testing purposes
 */
contract MockKektechNFT is ERC721 {
    constructor() ERC721("Mock Kektech NFT", "MKEK") {}

    /**
     * @notice Mint a specific token ID to an address
     * @param to Recipient address
     * @param tokenId Token ID to mint
     */
    function mint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }

    /**
     * @notice Batch mint multiple token IDs
     * @param to Recipient address
     * @param tokenIds Array of token IDs to mint
     */
    function batchMint(address to, uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _safeMint(to, tokenIds[i]);
        }
    }
}
