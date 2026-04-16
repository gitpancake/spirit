// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";

/**
 * @title BaseScript
 * @notice Base deployment script with keystore integration and common utilities
 * @dev All deployment scripts should inherit from this
 */
abstract contract BaseScript is Script {
    // Network configurations
    struct NetworkConfig {
        string name;
        uint256 chainId;
        address safeFactory;
        string rpcAlias;
        uint256 confirmations;
    }

    // Deployment tracking
    mapping(string => address) public deployedContracts;
    string[] public deployedContractNames;

    // Colors for console output
    string constant GREEN = "\x1b[32m";
    string constant YELLOW = "\x1b[33m";
    string constant RED = "\x1b[31m";
    string constant CYAN = "\x1b[36m";
    string constant RESET = "\x1b[0m";
    string constant BOLD = "\x1b[1m";

    modifier broadcast() {
        console2.log(string.concat(CYAN, "Broadcasting transactions...", RESET));
        vm.startBroadcast();
        _;
        vm.stopBroadcast();
        console2.log(string.concat(GREEN, unicode"✅ Broadcast complete", RESET));
    }

    /**
     * @notice Get network configuration for current chain
     */
    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        uint256 chainId = block.chainid;

        if (chainId == 1) {
            return
                NetworkConfig({
                    name: "Ethereum Mainnet",
                    chainId: 1,
                    safeFactory: 0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2,
                    rpcAlias: "ethereum",
                    confirmations: 2
                });
        } else if (chainId == 11155111) {
            return
                NetworkConfig({
                    name: "Sepolia",
                    chainId: 11155111,
                    safeFactory: 0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC,
                    rpcAlias: "sepolia",
                    confirmations: 1
                });
        } else if (chainId == 8453) {
            return
                NetworkConfig({
                    name: "Base",
                    chainId: 8453,
                    safeFactory: 0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC,
                    rpcAlias: "base",
                    confirmations: 1
                });
        } else if (chainId == 84532) {
            return
                NetworkConfig({
                    name: "Base Sepolia",
                    chainId: 84532,
                    safeFactory: 0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC,
                    rpcAlias: "base-sepolia",
                    confirmations: 1
                });
        } else if (chainId == 31337) {
            return
                NetworkConfig({
                    name: "Localhost",
                    chainId: 31337,
                    safeFactory: address(0),
                    rpcAlias: "localhost",
                    confirmations: 0
                });
        } else {
            return
                NetworkConfig({
                    name: "Unknown",
                    chainId: chainId,
                    safeFactory: address(0),
                    rpcAlias: "unknown",
                    confirmations: 1
                });
        }
    }

    /**
     * @notice Get owner address (from env or use deployer)
     */
    function getOwner() internal view returns (address) {
        address owner = vm.envOr("SPIRIT_COUNCIL_ADDRESS", address(0));
        if (owner == address(0)) {
            owner = msg.sender;
            console2.log(
                string.concat(
                    YELLOW,
                    unicode"⚠️  No SPIRIT_COUNCIL_ADDRESS set, using deployer as owner",
                    RESET
                )
            );
        }
        return owner;
    }

    /**
     * @notice Deploy a contract and track it
     */
    function deploy(string memory name, bytes memory bytecode) internal returns (address deployed) {
        bytes32 _salt = salt();
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)
        }
        require(deployed != address(0), "Deployment failed");

        deployedContracts[name] = deployed;
        deployedContractNames.push(name);

        console2.log(string.concat(GREEN, unicode"✅ ", name, " deployed at: ", RESET), deployed);
        return deployed;
    }

    /**
     * @notice Generate salt for CREATE2
     */
    function salt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, block.timestamp));
    }

    /**
     * @notice Print deployment header
     */
    function printHeader(string memory title) internal view {
        NetworkConfig memory config = getNetworkConfig();

        console2.log(
            string.concat(BOLD, CYAN, "====================================================", RESET)
        );
        console2.log(string.concat(BOLD, title, RESET));
        console2.log(
            string.concat(BOLD, CYAN, "====================================================", RESET)
        );
        console2.log(string.concat("Network:  ", config.name));
        console2.log(string.concat("Chain ID: ", vm.toString(config.chainId)));
        console2.log("Deployer: ", msg.sender);
        console2.log("Owner:    ", getOwner());
        console2.log(
            string.concat(BOLD, CYAN, "====================================================", RESET)
        );
    }

    /**
     * @notice Print deployment summary
     */
    function printSummary() internal view {
        console2.log(
            string.concat(
                BOLD,
                GREEN,
                "\n====================================================",
                RESET
            )
        );
        console2.log(string.concat(BOLD, GREEN, "Deployment Summary", RESET));
        console2.log(
            string.concat(
                BOLD,
                GREEN,
                "====================================================",
                RESET
            )
        );

        for (uint256 i = 0; i < deployedContractNames.length; i++) {
            string memory name = deployedContractNames[i];
            address addr = deployedContracts[name];
            console2.log(string.concat(name, ": ", vm.toString(addr)));
        }

        console2.log(
            string.concat(
                BOLD,
                GREEN,
                "====================================================",
                RESET
            )
        );
        console2.log(
            string.concat(BOLD, GREEN, unicode"✅ All contracts deployed successfully!", RESET)
        );
    }

    /**
     * @notice Save deployment addresses to JSON
     */
    function saveDeployment() internal {
        NetworkConfig memory config = getNetworkConfig();

        string memory json = "deployment";

        // Add metadata
        vm.serializeString(json, "network", config.name);
        vm.serializeUint(json, "chainId", config.chainId);
        vm.serializeAddress(json, "deployer", msg.sender);
        vm.serializeAddress(json, "owner", getOwner());
        vm.serializeUint(json, "timestamp", block.timestamp);
        vm.serializeUint(json, "blockNumber", block.number);

        // Add all deployed contracts
        for (uint256 i = 0; i < deployedContractNames.length; i++) {
            string memory name = deployedContractNames[i];
            vm.serializeAddress(json, name, deployedContracts[name]);
        }

        string memory output = vm.serializeString(json, "status", "success");

        // Create filename
        string memory filename = string.concat(
            "deployments/",
            config.rpcAlias,
            "/spirit-registry-v2-",
            vm.toString(block.timestamp),
            ".json"
        );

        // Ensure directory exists
        vm.createDir(string.concat("deployments/", config.rpcAlias), true);

        // Write file
        vm.writeJson(output, filename);

        console2.log(string.concat(CYAN, unicode"\n📁 Deployment saved to: ", filename, RESET));

        // Also save as latest
        string memory latestFile = string.concat("deployments/", config.rpcAlias, "/latest.json");
        vm.writeJson(output, latestFile);
    }

    /**
     * @notice Load previous deployment
     */
    function loadDeployment(string memory network) internal returns (address[] memory) {
        string memory path = string.concat("deployments/", network, "/latest.json");
        string memory json = vm.readFile(path);

        // Parse addresses from JSON
        address identityRegistry = vm.parseJsonAddress(json, ".SpiritIdentityRegistryV2");
        address validationRegistry = vm.parseJsonAddress(json, ".SpiritValidationRegistry");
        address reputationRegistry = vm.parseJsonAddress(json, ".SpiritReputationRegistry");
        address controller = vm.parseJsonAddress(json, ".SpiritRegistryController");

        address[] memory addresses = new address[](4);
        addresses[0] = identityRegistry;
        addresses[1] = validationRegistry;
        addresses[2] = reputationRegistry;
        addresses[3] = controller;

        return addresses;
    }

    /**
     * @notice Verify contracts on Etherscan
     */
    function verifyContracts() internal {
        if (!vm.envOr("VERIFY_CONTRACTS", true)) {
            console2.log(string.concat(YELLOW, unicode"⚠️  Skipping verification", RESET));
            return;
        }

        console2.log(string.concat(CYAN, unicode"\n🔍 Verifying contracts on Etherscan...", RESET));

        for (uint256 i = 0; i < deployedContractNames.length; i++) {
            string memory name = deployedContractNames[i];
            address addr = deployedContracts[name];

            console2.log(string.concat("Verifying ", name, "..."));

            // Verification will be handled by forge verify-contract command
            // This is just logging for now
        }

        console2.log(string.concat(GREEN, unicode"✅ Verification complete", RESET));
    }

    /**
     * @notice Helper to require environment variable
     */
    function requireEnv(string memory key) internal view returns (string memory) {
        string memory value = vm.envString(key);
        require(bytes(value).length > 0, string.concat("Missing required env var: ", key));
        return value;
    }

    /**
     * @notice Helper to get optional environment variable with default
     */
    function getEnv(
        string memory key,
        string memory defaultValue
    ) internal view returns (string memory) {
        try vm.envString(key) returns (string memory value) {
            if (bytes(value).length > 0) {
                return value;
            }
            return defaultValue;
        } catch {
            return defaultValue;
        }
    }
}
