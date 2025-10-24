const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

/**
 * Merkle Tree Utilities for Reward Distribution Testing
 *
 * This module provides utilities for generating Merkle trees and proofs
 * for testing the RewardDistributor contract.
 *
 * Features:
 * - Generate Merkle trees from reward data
 * - Create Merkle proofs for individual claims
 * - Validate tree construction
 * - Support for large distributions
 */

/**
 * Generate a Merkle tree from reward data
 * @param {Array} rewards - Array of {index, account, amount} objects
 * @returns {Object} - {tree, root, leaves}
 */
function generateMerkleTree(rewards) {
  // Validate inputs
  if (!Array.isArray(rewards) || rewards.length === 0) {
    throw new Error("Rewards must be a non-empty array");
  }

  // Generate leaves (hash of packed data)
  const leaves = rewards.map((reward) => {
    const { index, account, amount } = reward;

    // Validate reward data
    if (typeof index !== "number" || index < 0) {
      throw new Error(`Invalid index: ${index}`);
    }
    if (!ethers.isAddress(account)) {
      throw new Error(`Invalid address: ${account}`);
    }
    if (typeof amount !== "bigint" && typeof amount !== "string") {
      throw new Error(`Invalid amount: ${amount}`);
    }

    // Hash the packed data (matches Solidity keccak256(abi.encodePacked(...)))
    return ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256"],
      [index, account, amount]
    );
  });

  // Create Merkle tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  return {
    tree,
    root,
    leaves,
  };
}

/**
 * Get Merkle proof for a specific reward
 * @param {Object} tree - Merkle tree object
 * @param {number} index - Reward index
 * @param {string} account - Recipient address
 * @param {BigInt|string} amount - Reward amount
 * @returns {Array} - Merkle proof as array of hex strings
 */
function getMerkleProof(tree, index, account, amount) {
  // Generate leaf
  const leaf = ethers.solidityPackedKeccak256(
    ["uint256", "address", "uint256"],
    [index, account, amount]
  );

  // Get proof from tree
  const proof = tree.getHexProof(leaf);

  return proof;
}

/**
 * Verify a Merkle proof (for testing)
 * @param {Array} proof - Merkle proof
 * @param {string} root - Merkle root
 * @param {number} index - Reward index
 * @param {string} account - Recipient address
 * @param {BigInt|string} amount - Reward amount
 * @returns {boolean} - True if proof is valid
 */
function verifyProof(proof, root, index, account, amount) {
  // Generate leaf
  const leaf = ethers.solidityPackedKeccak256(
    ["uint256", "address", "uint256"],
    [index, account, amount]
  );

  // Verify using MerkleTree library
  return MerkleTree.verify(proof, leaf, root, keccak256, { sortPairs: true });
}

/**
 * Generate sample reward data for testing
 * @param {Array} accounts - Array of addresses
 * @param {string} baseAmount - Base reward amount (in wei as string)
 * @returns {Array} - Array of reward objects
 */
function generateSampleRewards(accounts, baseAmount = "1000000000000000000") {
  return accounts.map((account, index) => ({
    index,
    account,
    amount: baseAmount,
  }));
}

/**
 * Generate varied reward data (different amounts per user)
 * @param {Array} accounts - Array of addresses
 * @param {Array} amounts - Array of amounts (in wei as strings)
 * @returns {Array} - Array of reward objects
 */
function generateVariedRewards(accounts, amounts) {
  if (accounts.length !== amounts.length) {
    throw new Error("Accounts and amounts arrays must have same length");
  }

  return accounts.map((account, index) => ({
    index,
    account,
    amount: amounts[index],
  }));
}

/**
 * Generate large-scale reward distribution for gas testing
 * @param {number} count - Number of rewards to generate
 * @param {string} baseAmount - Base reward amount
 * @returns {Array} - Array of reward objects with random addresses
 */
function generateLargeDistribution(count, baseAmount = "1000000000000000000") {
  const rewards = [];

  for (let i = 0; i < count; i++) {
    // Generate random address
    const randomWallet = ethers.Wallet.createRandom();
    rewards.push({
      index: i,
      account: randomWallet.address,
      amount: baseAmount,
    });
  }

  return rewards;
}

/**
 * Create IPFS-style metadata for distribution
 * @param {Array} rewards - Reward data
 * @param {string} tokenType - "BASED" or "TECH"
 * @param {number} periodId - Distribution period ID
 * @returns {Object} - Metadata object
 */
function createDistributionMetadata(rewards, tokenType, periodId) {
  const totalAmount = rewards.reduce(
    (sum, reward) => sum + BigInt(reward.amount),
    0n
  );

  return {
    version: "1.0.0",
    periodId,
    tokenType,
    totalRecipients: rewards.length,
    totalAmount: totalAmount.toString(),
    timestamp: Math.floor(Date.now() / 1000),
    rewards: rewards.map((r) => ({
      index: r.index,
      account: r.account,
      amount: r.amount.toString(),
    })),
  };
}

/**
 * Validate Merkle tree structure
 * @param {Object} tree - Merkle tree object
 * @param {Array} rewards - Original reward data
 * @returns {boolean} - True if tree is valid
 */
function validateMerkleTree(tree, rewards) {
  try {
    // Check each reward can be proven
    for (const reward of rewards) {
      const proof = getMerkleProof(
        tree.tree,
        reward.index,
        reward.account,
        reward.amount
      );
      const isValid = verifyProof(
        proof,
        tree.root,
        reward.index,
        reward.account,
        reward.amount
      );

      if (!isValid) {
        console.error(`Invalid proof for reward ${reward.index}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Tree validation error:", error);
    return false;
  }
}

/**
 * Calculate gas savings vs traditional airdrop
 * @param {number} recipientCount - Number of recipients
 * @param {number} merkleClaimGas - Gas per Merkle claim (default: 47000)
 * @param {number} traditionalGas - Gas per traditional airdrop (default: 100000)
 * @returns {Object} - Gas savings analysis
 */
function calculateGasSavings(
  recipientCount,
  merkleClaimGas = 47000,
  traditionalGas = 100000
) {
  const merkleRootPublishGas = 20000; // One-time cost

  const traditionalTotalGas = recipientCount * traditionalGas;
  const merkleTotalGas = merkleRootPublishGas + recipientCount * merkleClaimGas;

  const gasSaved = traditionalTotalGas - merkleTotalGas;
  const percentSaved = (gasSaved / traditionalTotalGas) * 100;

  return {
    recipientCount,
    traditional: {
      perClaim: traditionalGas,
      total: traditionalTotalGas,
    },
    merkle: {
      publish: merkleRootPublishGas,
      perClaim: merkleClaimGas,
      total: merkleTotalGas,
    },
    savings: {
      gas: gasSaved,
      percent: percentSaved.toFixed(2),
    },
  };
}

module.exports = {
  generateMerkleTree,
  getMerkleProof,
  verifyProof,
  generateSampleRewards,
  generateVariedRewards,
  generateLargeDistribution,
  createDistributionMetadata,
  validateMerkleTree,
  calculateGasSavings,
};
