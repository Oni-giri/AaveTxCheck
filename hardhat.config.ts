/** @type import('hardhat/config').HardhatUserConfig */

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
        url: "https://eth.drpc.org",
      },
      accounts: [
        {
          // ONLY FOR TESTING
          privateKey:
            "0000000000000000000000000000000000000000000000000000000000000000",
          balance: "10000000000000000000000", // 10000 ETH
        },
      ],
    },
  },
};
