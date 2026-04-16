// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/Solienne/SolienneManifesto.sol";

/**
 * @title DeploySolienneManifesto
 * @notice Foundry deployment script for Solienne Manifesto contract (ERC-1155)
 * @dev Deploys SolienneManifesto - newsletter-optimized NFT with 88% gas savings vs ERC-721
 *
 * FEATURES:
 * - ERC-1155 multi-token standard
 * - Authorized minter pattern for flexible minting control
 * - Optimized for batch operations (newsletters, content distribution)
 * - External metadata on IPFS/Supabase
 * - Pausable for emergency stops
 *
 * Usage:
 *   forge script script/DeploySolienneManifesto.s.sol:DeploySolienneManifesto \
 *     --rpc-url <network> \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment Variables:
 *   PRIVATE_KEY         - Deployer private key (required)
 *   MANIFESTO_NAME      - Collection name (default: "Solienne Manifesto")
 *   MANIFESTO_SYMBOL    - Collection symbol (default: "MANIFESTO")
 *   MANIFESTO_OWNER     - Contract owner (default: deployer)
 */
contract DeploySolienneManifesto is Script {
    function run() external {
        // Determine if using keystore or private key
        uint256 deployerPrivateKey;
        address deployer;
        bool usePrivateKey = false;

        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            deployerPrivateKey = pk;
            deployer = vm.addr(deployerPrivateKey);
            usePrivateKey = true;
        } catch {
            // No PRIVATE_KEY in env, using keystore mode
            deployer = msg.sender;
        }

        // Get deployment parameters from environment or use defaults
        string memory name = vm.envOr("MANIFESTO_NAME", string("Solienne Manifesto"));
        string memory symbol = vm.envOr("MANIFESTO_SYMBOL", string("MANIFESTO"));
        address owner = vm.envOr("MANIFESTO_OWNER", deployer);

        console.log("\n========================================");
        console.log("Solienne Manifesto NFT Deployment");
        console.log("========================================\n");
        console.log("Network:          ", block.chainid);
        console.log("Deployer:         ", deployer);
        console.log("Owner:            ", owner);
        console.log("\nCollection Configuration:");
        console.log("  Name:           ", name);
        console.log("  Symbol:         ", symbol);
        console.log("  Token Standard:  ERC-1155");
        console.log("  Optimization:    Newsletter distribution (88% gas savings vs ERC-721)");
        console.log("\nFeatures:");
        console.log("  - Authorized minter pattern");
        console.log("  - Batch minting support");
        console.log("  - Pausable emergency control");
        console.log("  - External metadata (IPFS/Supabase)\n");

        // Start broadcast with appropriate authentication method
        if (usePrivateKey) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast(); // Uses --account and --sender from command line
        }

        // Deploy SolienneManifesto
        console.log("Deploying SolienneManifesto...");
        SolienneManifesto manifesto = new SolienneManifesto(name, symbol, owner);
        console.log("SolienneManifesto deployed at:", address(manifesto));

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("Deployment Complete!");
        console.log("========================================\n");
        console.log("Contract Address: ", address(manifesto));
        console.log("\nNext Steps:");
        console.log("1. Deploy a minter contract (FixedPriceManifestoMinterV3):");
        console.log("   MANIFESTO_CONTRACT=", address(manifesto));
        console.log("   forge script script/DeploySolienneMinterV3.s.sol --broadcast");
        console.log("\n2. Authorize the minter on the NFT contract:");
        console.log("   cast send", address(manifesto), "\\");
        console.log("     'updateMinter(address)' \\");
        console.log("     <MINTER_ADDRESS> \\");
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n3. Set base URI for metadata:");
        console.log("   cast send", address(manifesto), "\\");
        console.log("     'setURI(string)' \\");
        console.log("     'https://your-metadata-server.com/metadata/{id}.json' \\");
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n4. Check configuration:");
        console.log("   cast call", address(manifesto), "'owner()(address)'");
        console.log("   cast call", address(manifesto), "'authorizedMinter()(address)'");
        console.log("   cast call", address(manifesto), "'paused()(bool)'\n");
    }
}
