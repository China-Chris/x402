import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "hashkey-testnet": {
      url: process.env.HASHKEY_TESTNET_RPC || "https://testnet.hashkeychain.io",
      chainId: 133,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },
    "hashkey-mainnet": {
      url: process.env.HASHKEY_MAINNET_RPC || "https://mainnet.hashkeychain.io",
      chainId: 177,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      "hashkey-testnet": process.env.HASHKEY_API_KEY || "no-api-key",
      "hashkey-mainnet": process.env.HASHKEY_API_KEY || "no-api-key",
    },
    customChains: [
      {
        network: "hashkey-testnet",
        chainId: 133,
        urls: {
          apiURL: "https://testnet.hashkeyscan.io/api",
          browserURL: "https://testnet.hashkeyscan.io"
        }
      },
      {
        network: "hashkey-mainnet",
        chainId: 177,
        urls: {
          apiURL: "https://hashkeyscan.io/api",
          browserURL: "https://hashkeyscan.io"
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;

