// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/Solienne/SolienneGenesisPortraits.sol";

/**
 * @title DeploySolienneGenesisPortraits
 * @notice Foundry deployment script for Solienne Genesis Portraits NFT contract (ERC-721)
 * @dev Deploys SolienneGenesisPortraits with sequential minting and authorized minter pattern
 *
 * COLLECTION DETAILS:
 * - 5 unique artworks
 * - 3 editions per artwork
 * - 15 total NFTs (tokenIds 0-14)
 * - Sequential minting (can't skip tokenIds)
 *
 * FEATURES:
 * - Authorized minter pattern for external minting contracts
 * - Sequential token ID minting (0, 1, 2, ...)
 * - Permanent minting lock to guarantee final supply
 * - EIP-2981 royalty support (max 10%)
 * - External metadata on IPFS/Supabase
 *
 * Usage:
 *   forge script script/DeploySolienneGenesisPortraits.s.sol:DeploySolienneGenesisPortraits \
 *     --rpc-url <network> \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment Variables:
 *   PRIVATE_KEY                - Deployer private key (required)
 *   GENESIS_BASE_URI           - Base URI for token metadata (required)
 *   GENESIS_OWNER              - Contract owner (default: deployer)
 *   GENESIS_AUTHORIZED_MINTER  - Authorized minter address (default: zero address, set later)
 *   GENESIS_ROYALTY_RECEIVER   - Address to receive royalty payments (default: Solienne Multisig)
 *   GENESIS_ROYALTY_FEE        - Royalty fee in basis points (default: 500 = 5%)
 */
contract DeploySolienneGenesisPortraits is Script {
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
        string memory baseTokenURI = vm.envString("GENESIS_BASE_URI");
        address owner = vm.envOr("GENESIS_OWNER", deployer);
        address authorizedMinter = vm.envOr("GENESIS_AUTHORIZED_MINTER", address(0)); // Zero address means set later
        address royaltyReceiver = vm.envOr("GENESIS_ROYALTY_RECEIVER", SOLIENNE_MULTISIG);
        uint96 royaltyFeeNumerator = uint96(vm.envOr("GENESIS_ROYALTY_FEE", uint256(500))); // 5%

        console.log("\n========================================");
        console.log("Solienne Genesis Portraits NFT Deployment");
        console.log("========================================\n");
        console.log("Network:           ", block.chainid);
        console.log("Deployer:          ", deployer);
        console.log("Owner:             ", owner);
        console.log("Authorized Minter: ", authorizedMinter);
        console.log("Royalty Receiver:  ", royaltyReceiver);
        console.log("Royalty Fee:       ", royaltyFeeNumerator, "bps");
        console.log("\nCollection Configuration:");
        console.log("  Collection Name:   Solienne Genesis Portraits");
        console.log("  Symbol:            GENESIS");
        console.log("  Unique Artworks:   5");
        console.log("  Editions per Art:  3");
        console.log("  Total Supply:      15 tokens (tokenIds 0-14)");
        console.log("  Minting:           Sequential (0 -> 1 -> 2 -> ...)");
        console.log("  Base URI:          ", baseTokenURI);
        console.log("\nToken Mapping:");
        console.log("  TokenId 0  -> 0.json");
        console.log("  TokenId 1  -> 1.json");
        console.log("  ...");
        console.log("  TokenId 14 -> 14.json\n");

        // Start broadcast with appropriate authentication method
        if (usePrivateKey) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast(); // Uses --account and --sender from command line
        }

        // Deploy SolienneGenesisPortraits NFT
        console.log("Deploying SolienneGenesisPortraits...");
        SolienneGenesisPortraits genesisPortraits = new SolienneGenesisPortraits(
            owner,
            authorizedMinter,
            baseTokenURI,
            royaltyReceiver,
            royaltyFeeNumerator
        );
        console.log("SolienneGenesisPortraits deployed at:", address(genesisPortraits));

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("Deployment Complete!");
        console.log("========================================\n");
        console.log("Contract Address: ", address(genesisPortraits));

        if (authorizedMinter == address(0)) {
            console.log("\n[!] Authorized minter not set - You need to set it before minting:");
            console.log("    cast send", address(genesisPortraits), "\\");
            console.log("      'updateMinter(address)' \\");
            console.log("      <MINTER_CONTRACT_ADDRESS> \\");
            console.log("      --private-key $PRIVATE_KEY\n");
        }

        console.log("Next Steps:");
        console.log("1. Mint token (only authorized minter can call):");
        console.log("   cast send", address(genesisPortraits), "\\");
        console.log("     'mint(address)' \\");
        console.log("     <RECIPIENT> \\");
        console.log("     --private-key $MINTER_PRIVATE_KEY");
        console.log("\n2. Batch mint tokens (only authorized minter):");
        console.log("   cast send", address(genesisPortraits), "\\");
        console.log("     'batchMint(address[])' \\");
        console.log("     '[0xAddr1,0xAddr2,0xAddr3]' \\");
        console.log("     --private-key $MINTER_PRIVATE_KEY");
        console.log("\n3. Check minting status:");
        console.log("   cast call", address(genesisPortraits), "'nextTokenId()(uint256)'");
        console.log("   cast call", address(genesisPortraits), "'totalSupply()(uint256)'");
        console.log("   cast call", address(genesisPortraits), "'remainingSupply()(uint256)'");
        console.log("\n4. Lock minting permanently (irreversible!):");
        console.log(
            "   cast send",
            address(genesisPortraits),
            "'lockMintingPermanently()' --private-key $PRIVATE_KEY\n"
        );
    }
}
