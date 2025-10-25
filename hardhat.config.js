require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      // Local Hardhat network for testing
      // Fork configuration (optional, use when running: npx hardhat node --fork <RPC>)
      forking: process.env.FORK_BASEDAI === "true" ? {
        url: process.env.BASED_MAINNET_RPC || "https://mainnet.basedaibridge.com/rpc/",
        enabled: true
      } : undefined
    },
    // Local fork (connects to localhost:8545)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000,
      accounts: "remote" // Uses accounts from forked network
    },
    // BasedAI mainnet via VPS node (through SSH tunnel)
    basedai: {
      url: "http://localhost:9933", // VPS node via SSH tunnel
      chainId: 32323,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000
    },
    // Sepolia Testnet (for Week 1 validation)
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    basedTestnet: {
      url: process.env.BASED_TESTNET_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    basedMainnet: {
      url: process.env.BASED_MAINNET_RPC || "https://mainnet.basedaibridge.com/rpc/",
      chainId: 32323,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
