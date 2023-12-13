require("dotenv").config();

import '@nomiclabs/hardhat-ethers'


module.exports = {
  solidity: "0.8.20",
  paths: {
    tests: "./src/tests",
    artifacts: "./src/tests/artifacts",
    sources: "./src/tests", // Point to the common parent directory
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL,
      },
      accounts: [
        {
          privateKey: process.env.PRIVATE_KEY,
          balance: "10000000000000000000000", // 10000 ETH
        },
      ],
    },
  },
};
