// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {SpiritIdentityRegistryV2} from "../contracts/Spirit/SpiritIdentityRegistryV2.sol";
import {SpiritValidationRegistry} from "../contracts/Spirit/SpiritValidationRegistry.sol";
import {SpiritReputationRegistry} from "../contracts/Spirit/SpiritReputationRegistry.sol";
import {SpiritRegistryController} from "../contracts/Spirit/SpiritRegistryController.sol";

/**
 * @title DeploySpiritRegistryV2
 * @notice Foundry deployment script for Spirit Registry V2 system
 * @dev Uses keystore for secure key management
 *
 * Usage:
 *   forge script script/DeploySpiritRegistryV2.s.sol:DeploySpiritRegistryV2 \
 *     --rpc-url sepolia \
 *     --account deployer \
 *     --broadcast \
 *     --verify
 */
contract DeploySpiritRegistryV2 is Script {
    // Configuration struct
    struct DeploymentConfig {
        address owner;
        address safeFactory;
        bool verifyContracts;
        string outputPath;
    }

    // Deployed contracts
    SpiritIdentityRegistryV2 public identityRegistry;
    SpiritValidationRegistry public validationRegistry;
    SpiritReputationRegistry public reputationRegistry;
    SpiritRegistryController public controller;

    // Events for deployment tracking
    event ContractDeployed(string name, address addr);

    function run() external {
        // Load configuration
        DeploymentConfig memory config = loadConfig();

        console2.log("====================================================");
        console2.log("Deploying Spirit Registry V2 System");
        console2.log("====================================================");
        console2.log("Network:", getChainName());
        console2.log("Deployer:", msg.sender);
        console2.log("Owner:", config.owner);
        console2.log("Safe Factory:", config.safeFactory);
        console2.log("====================================================");

        // Start broadcast (uses keystore account)
        vm.startBroadcast();

        // Deploy contracts
        deployIdentityRegistry(config.owner);
        deployValidationRegistry(address(identityRegistry), config.owner);
        deployReputationRegistry(address(identityRegistry), config.owner);
        deployController(
            address(identityRegistry),
            address(validationRegistry),
            address(reputationRegistry),
            config.safeFactory,
            config.owner
        );

        vm.stopBroadcast();

        // Print deployment summary
        printDeploymentSummary();

        // Save deployment addresses
        saveDeploymentAddresses(config.outputPath);
    }

    function loadConfig() internal view returns (DeploymentConfig memory) {
        // Try to load from environment variables
        address owner = vm.envOr("SPIRIT_COUNCIL_ADDRESS", address(0));
        address safeFactory = vm.envOr("SAFE_FACTORY", address(0));

        // If owner not set, use deployer
        if (owner == address(0)) {
            owner = msg.sender;
            console2.log("No SPIRIT_COUNCIL_ADDRESS set, using deployer as owner");
        }

        // Get Safe factory based on chain
        if (safeFactory == address(0)) {
            safeFactory = getSafeFactoryForChain();
        }

        return
            DeploymentConfig({
                owner: owner,
                safeFactory: safeFactory,
                verifyContracts: vm.envOr("VERIFY_CONTRACTS", true),
                outputPath: "deployments/"
            });
    }

    function deployIdentityRegistry(address owner) internal {
        console2.log("\nDeploying SpiritIdentityRegistryV2...");

        identityRegistry = new SpiritIdentityRegistryV2(owner);

        console2.log(unicode"✅ SpiritIdentityRegistryV2 deployed at:", address(identityRegistry));
        emit ContractDeployed("SpiritIdentityRegistryV2", address(identityRegistry));
    }

    function deployValidationRegistry(address _identityRegistry, address owner) internal {
        console2.log("\nDeploying SpiritValidationRegistry...");

        validationRegistry = new SpiritValidationRegistry(_identityRegistry, owner);

        console2.log(
            unicode"✅ SpiritValidationRegistry deployed at:",
            address(validationRegistry)
        );
        emit ContractDeployed("SpiritValidationRegistry", address(validationRegistry));
    }

    function deployReputationRegistry(address _identityRegistry, address owner) internal {
        console2.log("\nDeploying SpiritReputationRegistry...");

        reputationRegistry = new SpiritReputationRegistry(_identityRegistry, owner);

        console2.log(
            unicode"✅ SpiritReputationRegistry deployed at:",
            address(reputationRegistry)
        );
        emit ContractDeployed("SpiritReputationRegistry", address(reputationRegistry));
    }

    function deployController(
        address _identityRegistry,
        address _validationRegistry,
        address _reputationRegistry,
        address _safeFactory,
        address owner
    ) internal {
        console2.log("\nDeploying SpiritRegistryController...");

        controller = new SpiritRegistryController(
            _identityRegistry,
            _validationRegistry,
            _reputationRegistry,
            _safeFactory,
            owner
        );

        console2.log(unicode"✅ SpiritRegistryController deployed at:", address(controller));
        emit ContractDeployed("SpiritRegistryController", address(controller));
    }

    function getSafeFactoryForChain() internal view returns (address) {
        uint256 chainId = block.chainid;

        // Mainnet
        if (chainId == 1) {
            return 0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2;
        }
        // Sepolia
        else if (chainId == 11155111) {
            return 0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC;
        }
        // Base
        else if (chainId == 8453) {
            return 0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC;
        }
        // Base Sepolia
        else if (chainId == 84532) {
            return 0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC;
        }
        // Local/Unknown
        else {
            console2.log(unicode"⚠️  Unknown chain, using zero address for Safe factory");
            return address(0);
        }
    }

    function getChainName() internal view returns (string memory) {
        uint256 chainId = block.chainid;

        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 8453) return "Base";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 31337) return "Localhost";

        return "Unknown";
    }

    function printDeploymentSummary() internal view {
        console2.log("\n====================================================");
        console2.log("Deployment Summary");
        console2.log("====================================================");
        console2.log("SpiritIdentityRegistryV2:", address(identityRegistry));
        console2.log("SpiritValidationRegistry:", address(validationRegistry));
        console2.log("SpiritReputationRegistry:", address(reputationRegistry));
        console2.log("SpiritRegistryController:", address(controller));
        console2.log("====================================================");
        console2.log(unicode"✅ All contracts deployed successfully!");
        console2.log("====================================================");
    }

    function saveDeploymentAddresses(string memory outputPath) internal {
        // Create JSON output
        string memory json = "deployment";
        vm.serializeAddress(json, "identityRegistry", address(identityRegistry));
        vm.serializeAddress(json, "validationRegistry", address(validationRegistry));
        vm.serializeAddress(json, "reputationRegistry", address(reputationRegistry));
        string memory output = vm.serializeAddress(json, "controller", address(controller));

        // Create deployments directory if it doesn't exist
        try vm.createDir(outputPath, true) {} catch {}

        // Save to file
        string memory filename = string.concat(
            outputPath,
            "spirit-registry-v2-",
            vm.toString(block.chainid),
            "-",
            vm.toString(block.timestamp),
            ".json"
        );

        vm.writeJson(output, filename);
        console2.log(unicode"\n📁 Deployment addresses saved to:", filename);
    }
}
