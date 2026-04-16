// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/Solienne/SolienneOriginSeries.sol";

/**
 * @title DeploySolienneOriginSeries
 * @notice Foundry deployment script for Solienne Origin Series NFT contract (ERC-721)
 * @dev Deploys SolienneOriginSeries with specific token ID minting and edition mapping
 *
 * EDITION SYSTEM:
 * - 9 unique pieces (1.json - 9.json metadata files)
 * - 5 editions per piece (45 total tokens: tokenIds 0-44)
 * - Token mapping: 0-4→1.json, 5-9→2.json, ..., 40-44→9.json
 *
 * FEATURES:
 * - Owner-only minting (no separate minter contract)
 * - Specific token ID minting (can mint any tokenId 0-44)
 * - Permanent minting lock to guarantee final supply
 * - EIP-2981 royalty support (max 10%)
 * - Helper functions to query edition info
 *
 * Usage:
 *   forge script script/DeploySolienneOriginSeries.s.sol:DeploySolienneOriginSeries \
 *     --rpc-url <network> \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment Variables:
 *   PRIVATE_KEY           - Deployer private key (required)
 *   ORIGIN_BASE_URI       - Base URI for token metadata (required)
 *   ORIGIN_OWNER          - Contract owner (default: deployer)
 *   ORIGIN_ROYALTY_RECEIVER - Address to receive royalty payments (default: Solienne Multisig)
 *   ORIGIN_ROYALTY_FEE    - Royalty fee in basis points (default: 500 = 5%)
 */
contract DeploySolienneOriginSeries is Script {
    // Default addresses
    address constant SOLIENNE_MULTISIG = 0xeee98E09620182Be55E5eCD6D20C22aB3697D5f2;

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
        string memory baseTokenURI = vm.envString("ORIGIN_BASE_URI");
        address owner = vm.envOr("ORIGIN_OWNER", deployer);
        address royaltyReceiver = vm.envOr("ORIGIN_ROYALTY_RECEIVER", SOLIENNE_MULTISIG);
        uint96 royaltyFeeNumerator = uint96(vm.envOr("ORIGIN_ROYALTY_FEE", uint256(500))); // 5%

        console.log("\n========================================");
        console.log("Solienne Origin Series NFT Deployment");
        console.log("========================================\n");
        console.log("Network:           ", block.chainid);
        console.log("Deployer:          ", deployer);
        console.log("Owner:             ", owner);
        console.log("Royalty Receiver:  ", royaltyReceiver);
        console.log("Royalty Fee:       ", royaltyFeeNumerator, "bps");
        console.log("\nCollection Configuration:");
        console.log("  Collection Name:   Solienne Origin Series");
        console.log("  Symbol:            SOLOR");
        console.log("  Unique Pieces:     9");
        console.log("  Editions per Piece: 5");
        console.log("  Total Supply:      45 tokens (tokenIds 0-44)");
        console.log("  Base URI:          ", baseTokenURI);
        console.log("\nEdition Mapping:");
        console.log("  TokenIds 0-4   -> 1.json");
        console.log("  TokenIds 5-9   -> 2.json");
        console.log("  TokenIds 10-14 -> 3.json");
        console.log("  TokenIds 15-19 -> 4.json");
        console.log("  TokenIds 20-24 -> 5.json");
        console.log("  TokenIds 25-29 -> 6.json");
        console.log("  TokenIds 30-34 -> 7.json");
        console.log("  TokenIds 35-39 -> 8.json");
        console.log("  TokenIds 40-44 -> 9.json\n");

        // Start broadcast with appropriate authentication method
        if (usePrivateKey) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast(); // Uses --account and --sender from command line
        }

        // Deploy SolienneOriginSeries NFT
        console.log("Deploying SolienneOriginSeries...");
        SolienneOriginSeries originSeries = new SolienneOriginSeries(
            owner,
            baseTokenURI,
            royaltyReceiver,
            royaltyFeeNumerator
        );
        console.log("SolienneOriginSeries deployed at:", address(originSeries));

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("Deployment Complete!");
        console.log("========================================\n");
        console.log("Contract Address: ", address(originSeries));
        console.log("\nNext Steps:");
        console.log("1. Mint tokens (owner only):");
        console.log("   cast send", address(originSeries), "\\");
        console.log("     'mintTo(address,uint256)' \\");
        console.log("     <RECIPIENT> <TOKEN_ID> \\");
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n2. Batch mint tokens (owner only):");
        console.log("   cast send", address(originSeries), "\\");
        console.log("     'batchMintTo(address,uint256[])' \\");
        console.log("     <RECIPIENT> '[0,1,2,3,4]' \\");
        console.log("     --private-key $PRIVATE_KEY");
        console.log("\n3. Query edition info:");
        console.log("   cast call", address(originSeries), "'getPieceNumber(uint256)' <TOKEN_ID>");
        console.log(
            "   cast call",
            address(originSeries),
            "'getEditionNumber(uint256)' <TOKEN_ID>"
        );
        console.log(
            "   cast call",
            address(originSeries),
            "'getMintedEditions(uint256)' <PIECE_NUM>"
        );
        console.log("\n4. Check remaining supply:");
        console.log("   cast call", address(originSeries), "'remainingSupply()(uint256)'");
        console.log("\n5. Lock minting permanently (irreversible!):");
        console.log(
            "   cast send",
            address(originSeries),
            "'lockMintingPermanently()' --private-key $PRIVATE_KEY\n"
        );
    }
}
