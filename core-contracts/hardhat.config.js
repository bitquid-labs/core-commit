require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable the IR pipeline to resolve "stack too deep"
    },
  },
  networks: {
    core: {
      url: "https://rpc.test2.btcs.network",
      accounts: [PRIVATE_KEY],
    },
  },
};
