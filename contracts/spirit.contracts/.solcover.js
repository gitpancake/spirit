module.exports = {
  skipFiles: [],

  // Configure custom path for instrumentation
  istanbulFolder: "./coverage",

  // Disable coverage for the entire external/ directory
  istanbulReporter: ["html", "text"],

  // Configure compiler settings to work with coverage
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    peephole: false,
    jumpdestRemover: false,
    orderLiterals: false,
    deduplicate: false,
    cse: false,
    constantOptimizer: false,
    yul: false,
  },

  // Temporary disable viaIR during coverage
  mocha: {
    enableTimeouts: false,
  },

  // Custom coverage directory
  providerOptions: {
    gasLimit: 0x1fffffffffffff,
    allowUnlimitedContractSize: true,
  },
};
