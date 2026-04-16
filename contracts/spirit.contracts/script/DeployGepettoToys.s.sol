// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/Gepetto/GepettoToys.sol";
import "../contracts/Gepetto/GepettoMinter.sol";

/**
 * @title DeployGepettoToys
 * @notice Foundry deployment script for Gepetto Toys NFT system
 * @dev Deploys both GepettoToys (NFT) and GepettoMinter (0.001 ETH fixed price)
 *      Automatically sets up minter authorization and transfers ownership
 *
 * Deployment Flow:
 *   1. Deploy GepettoToys NFT (deployer as temporary owner/minter)
 *   2. Deploy GepettoMinter contract
 *   3. Set GepettoMinter as authorized minter on NFT contract
 *   4. Transfer ownership of both contracts to OWNER (if specified)
 *
 * Usage:
 *   forge script script/DeployGepettoToys.s.sol:DeployGepettoToys \
 *     --rpc-url <network> \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment Variables:
 *   PRIVATE_KEY        - Deployer private key (required)
 *   OWNER              - Final owner address (default: deployer) - receives ownership of both contracts
 *   COLLECTION_NAME    - ERC-721 collection name (default: "Brainrot Toys Collection")
 *   COLLECTION_SYMBOL  - Collection symbol (default: "TOY")
 *   TOY_NAME           - Toy name prefix for metadata (default: "Brainrot Toy")
 *   TOY_DESCRIPTION    - Token description (default: "Generated in Geppetto's Workshop")
 *   PAYOUT_ADDRESS     - Mint revenue recipient (default: Gepetto Multisig)
 *   ROYALTY_RECEIVER   - Royalty recipient (default: payout address)
 *   BASE_URI           - Metadata base URI (default: Supabase)
 */
contract DeployGepettoToys is Script {
    // Default addresses
    address constant GEPETTO_MULTISIG = 0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e;

    function run() external {
        // Determine if using keystore or private key
        // If PRIVATE_KEY exists in .env, use it. Otherwise, use keystore (via --account flag)
        uint256 deployerPrivateKey;
        address deployer;
        bool usePrivateKey = false;

        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            deployerPrivateKey = pk;
            deployer = vm.addr(deployerPrivateKey);
            usePrivateKey = true;
        } catch {
            // No PRIVATE_KEY in env, using keystore mode
            // Deployer will be set by --sender flag
            deployer = msg.sender;
        }

        // Get deployment parameters from environment or use defaults
        string memory collectionName = vm.envOr("COLLECTION_NAME", string("Geppetto's Toys"));
        string memory collectionSymbol = vm.envOr("COLLECTION_SYMBOL", string("TOY"));
        string memory toyName = vm.envOr("TOY_NAME", string("Geppetto's Toy"));
        string memory toyDescription = vm.envOr(
            "TOY_DESCRIPTION",
            string("Generated in Geppetto's Workshop")
        );
        address finalOwner = vm.envOr("OWNER", deployer);
        address payoutAddress = vm.envOr("PAYOUT_ADDRESS", GEPETTO_MULTISIG);
        address royaltyReceiver = vm.envOr("ROYALTY_RECEIVER", payoutAddress);
        string memory baseURI = vm.envOr(
            "BASE_URI",
            string("https://vhswwkklyzbzvsoauisx.supabase.co/storage/v1/object/public/metadata/")
        );

        console.log("\n========================================");
        console.log("Gepetto Toys NFT System Deployment");
        console.log("========================================\n");
        console.log("Network:          ", block.chainid);
        console.log("Deployer:         ", deployer);
        console.log("Final Owner:      ", finalOwner);
        console.log("Payout Address:   ", payoutAddress);
        console.log("Royalty Receiver: ", royaltyReceiver);
        console.log("\nNFT Configuration:");
        console.log("  Collection Name:", collectionName);
        console.log("  Symbol:         ", collectionSymbol);
        console.log("  Toy Name:       ", toyName);
        console.log("  Description:    ", toyDescription);
        console.log("  Max Supply:      10,000");
        console.log("  Start Token ID:  0");
        console.log("  Royalty:         5%");
        console.log("  Base URI:       ", baseURI);
        console.log("\nMinter Configuration:");
        console.log("  Mint Price:      0.001 ETH");
        console.log("  Public Minting:  Yes");
        console.log("  Admin Batch:     Yes (free)");
        console.log("\nAuthentication:");
        if (usePrivateKey) {
            console.log("  Mode:            Private Key (.env)");
        } else {
            console.log("  Mode:            Keystore (--account flag)");
        }
        console.log("");

        // Start broadcast with appropriate authentication method
        if (usePrivateKey) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast(); // Uses --account and --sender from command line
        }

        // Step 1: Deploy GepettoToys NFT (deployer as temporary owner/minter)
        console.log("Step 1: Deploying GepettoToys NFT...");
        GepettoToys gepettoToys = new GepettoToys(
            collectionName,
            collectionSymbol,
            toyName,
            toyDescription,
            deployer, // Deployer as temporary owner
            deployer, // Deployer as temporary minter (will be updated to GepettoMinter)
            royaltyReceiver,
            baseURI
        );
        console.log("GepettoToys deployed at:", address(gepettoToys));

        // Step 2: Deploy GepettoMinter
        console.log("\nStep 2: Deploying GepettoMinter...");
        GepettoMinter gepettoMinter = new GepettoMinter(
            address(gepettoToys),
            deployer, // Deployer as temporary owner
            payoutAddress
        );
        console.log("GepettoMinter deployed at:", address(gepettoMinter));

        // Step 3: Set GepettoMinter as authorized minter on NFT contract
        console.log("\nStep 3: Setting authorized minter on NFT contract...");
        gepettoToys.updateMinter(address(gepettoMinter));
        console.log("Authorized minter set to GepettoMinter:", address(gepettoMinter));

        // Step 4: Transfer ownership to final owner (if different from deployer)
        if (finalOwner != deployer) {
            console.log("\nStep 4: Transferring ownership to final owner...");
            console.log("Transferring GepettoToys ownership to:", finalOwner);
            gepettoToys.transferOwnership(finalOwner);

            console.log("Transferring GepettoMinter ownership to:", finalOwner);
            gepettoMinter.transferOwnership(finalOwner);

            console.log("Ownership transferred successfully!");
        } else {
            console.log("\nStep 4: Skipping ownership transfer (deployer is final owner)");
        }

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("========================================\n");
        console.log("GepettoToys (NFT):   ", address(gepettoToys));
        console.log("GepettoMinter:       ", address(gepettoMinter));
        console.log("\nOwnership:");
        console.log("  GepettoToys Owner:  ", finalOwner);
        console.log("  GepettoMinter Owner:", finalOwner);
        console.log("  Authorized Minter:  ", address(gepettoMinter));
        console.log("\nConfiguration:");
        console.log("  Mint Price:         0.001 ETH");
        console.log("  Payout Address:     ", payoutAddress);
        console.log("  Royalty Receiver:   ", royaltyReceiver);
        console.log("\nNext Steps:");
        console.log("1. Upload metadata JSON files to:");
        console.log("   ", baseURI);
        console.log("   Format: {baseURI}0.json, {baseURI}1.json, etc.");
        console.log("\n2. Test public mint (anyone can call):");
        console.log("   cast send", address(gepettoMinter), "\\");
        console.log("     'mint(address)' <RECIPIENT> \\");
        console.log("     --value 0.001ether --rpc-url <network>");
        console.log("\n3. Admin batch mint (owner only):");
        console.log("   cast send", address(gepettoMinter), "\\");
        console.log("     'batchMint(address[])' '[0xAddr1,0xAddr2]' \\");
        console.log("     --rpc-url <network> --account <owner-keystore>");
        console.log("\n4. Withdraw collected ETH (owner only):");
        console.log("   cast send", address(gepettoMinter), "\\");
        console.log("     'withdraw()' --rpc-url <network> --account <owner-keystore>");
        console.log("\n========================================\n");

        // Write deployment info to file
        string memory deploymentInfo = string(
            abi.encodePacked(
                "GepettoToys NFT: ",
                vm.toString(address(gepettoToys)),
                "\n",
                "GepettoMinter: ",
                vm.toString(address(gepettoMinter)),
                "\n"
            )
        );
        vm.writeFile("deployment-gepetto-toys.txt", deploymentInfo);
        console.log("Deployment addresses saved to: deployment-gepetto-toys.txt\n");
    }
}
