// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/Solienne/FixedPriceManifestoMinterV3.sol";

/**
 * @title DeploySolienneMinterV3
 * @notice Foundry deployment script for Fixed Price Manifesto Minter V3 contract (ERC-1155 + Flexible Distribution)
 * @dev Deploys FixedPriceManifestoMinterV3 for subscription-based minting with USDC payments
 *
 * V3 FEATURES:
 * - Flexible distribution: distributeToSubscribersBatch() no longer checks subscription status
 * - Admin has full control over recipient list
 * - Can distribute to any addresses (subscribers, non-subscribers, partners, etc.)
 * - All V2 functionality preserved (subscribeFor, mint, etc.)
 *
 * Usage:
 *   forge script script/DeploySolienneMinterV3.s.sol:DeploySolienneMinterV3 \
 *     --rpc-url <network> \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment Variables:
 *   PRIVATE_KEY         - Deployer private key (required)
 *   MANIFESTO_CONTRACT  - Address of SolienneManifesto contract (REQUIRED)
 *   USDC_TOKEN          - Address of USDC token contract (REQUIRED)
 *   MINTER_OWNER        - Owner address (default: deployer)
 *   PAYOUT_ADDRESS      - Address to receive sale proceeds (default: owner)
 *
 * USDC Addresses:
 *   Base Mainnet:  0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
 *   Base Sepolia:  0x036cbd53842c5426634e7929541ec2318f3dcf7e
 */
contract DeploySolienneMinterV3 is Script {
    // USDC addresses
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

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

        // Required parameters
        address manifestoContract = vm.envAddress("MANIFESTO_CONTRACT");
        address usdcToken = vm.envAddress("USDC_TOKEN");

        // Optional parameters
        address owner = vm.envOr("MINTER_OWNER", deployer);
        address payoutAddress = vm.envOr("PAYOUT_ADDRESS", owner);

        // Network info
        string memory networkName;
        if (block.chainid == 8453) {
            networkName = "Base Mainnet";
        } else if (block.chainid == 84532) {
            networkName = "Base Sepolia";
        } else if (block.chainid == 1) {
            networkName = "Ethereum Mainnet";
        } else if (block.chainid == 11155111) {
            networkName = "Sepolia Testnet";
        } else {
            networkName = "Unknown Network";
        }

        console.log("\n========================================");
        console.log("Solienne Minter V3 Deployment");
        console.log("========================================\n");
        console.log("Network:           ", networkName);
        console.log("Chain ID:          ", block.chainid);
        console.log("Deployer:          ", deployer);
        console.log("Owner:             ", owner);
        console.log("Payout Address:    ", payoutAddress);
        console.log("\nContract References:");
        console.log("  Manifesto:       ", manifestoContract);
        console.log("  USDC Token:      ", usdcToken);
        console.log("\nV3 Features:");
        console.log("  - Flexible batch distribution (no subscription check)");
        console.log("  - Admin full control over recipient lists");
        console.log("  - Gift subscriptions via subscribeFor()");
        console.log("  - USDC payment integration");
        console.log("  - Automatic NFT distribution\n");

        // Start broadcast with appropriate authentication method
        if (usePrivateKey) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast(); // Uses --account and --sender from command line
        }

        // Deploy FixedPriceManifestoMinterV3
        console.log("Deploying FixedPriceManifestoMinterV3...");
        FixedPriceManifestoMinterV3 minterV3 = new FixedPriceManifestoMinterV3(
            manifestoContract,
            owner,
            payoutAddress,
            usdcToken
        );
        console.log("FixedPriceManifestoMinterV3 deployed at:", address(minterV3));

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("Deployment Complete!");
        console.log("========================================\n");
        console.log("Contract Address: ", address(minterV3));
        console.log("\nNext Steps:");
        console.log("1. Authorize V3 minter on NFT contract:");
        console.log("   cast send", manifestoContract, "\\");
        console.log("     'updateMinter(address)' \\");
        console.log("     ", address(minterV3), "\\");
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n2. Set subscription price (in USDC, 6 decimals):");
        console.log("   cast send", address(minterV3), "\\");
        console.log("     'updateSubscriptionPrice(uint256)' \\");
        console.log("     5000000 \\"); // $5 USDC
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n3. Enable auto-distribution (optional):");
        console.log("   cast send", address(minterV3), "\\");
        console.log("     'updateAutoDistribute(bool)' \\");
        console.log("     true \\");
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n4. Test subscription:");
        console.log("   # First approve USDC spending:");
        console.log("   cast send", usdcToken, "\\");
        console.log("     'approve(address,uint256)' \\");
        console.log("     ", address(minterV3), "\\");
        console.log("     5000000 \\");
        console.log("     --private-key $USER_PRIVATE_KEY");
        console.log("\n   # Then subscribe:");
        console.log("   cast send", address(minterV3), "\\");
        console.log("     'subscribe(uint256)' \\");
        console.log("     1 \\"); // Manifesto ID
        console.log("     --private-key $USER_PRIVATE_KEY");
        console.log("\n5. Flexible batch distribution to any addresses:");
        console.log("   cast send", address(minterV3), "\\");
        console.log("     'distributeToSubscribersBatch(address[],uint256)' \\");
        console.log("     '[0xAddr1,0xAddr2,0xAddr3]' \\");
        console.log("     1 \\");
        console.log("     --private-key $PRIVATE_KEY\n");
    }
}
