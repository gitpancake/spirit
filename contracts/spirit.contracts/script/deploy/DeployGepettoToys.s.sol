// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {GepettoToys} from "../../contracts/Gepetto/GepettoToys.sol";
import {GepettoMinter} from "../../contracts/Gepetto/GepettoMinter.sol";

contract DeployGepettoToys is Script {
    function run() external {
        // Load configuration
        string memory name = "Gepetto Toys";
        string memory symbol = "GTOY";
        string memory toyName = "Gepetto AI Toy Collection";
        string memory description = "A collection of AI-generated toy designs";

        address owner = vm.envOr("TOY_OWNER", address(0));
        if (owner == address(0)) owner = msg.sender;

        address payoutAddress = vm.envOr("PAYOUT_ADDRESS", address(0));
        if (payoutAddress == address(0)) payoutAddress = 0x34Ce568C936f03b5c416df0ce3b54d3CD5f4904e;

        address royaltyReceiver = vm.envOr("ROYALTY_RECEIVER", address(0));
        if (royaltyReceiver == address(0)) royaltyReceiver = payoutAddress;

        string memory baseURI = "";
        try vm.envString("BASE_URI") returns (string memory uri) {
            baseURI = uri;
        } catch {}

        console2.log("Deploying Gepetto Toys NFT");
        console2.log("Network:", block.chainid);
        console2.log("Owner:", owner);
        console2.log("Payout:", payoutAddress);

        vm.startBroadcast();

        // Deploy NFT contract (initially without minter)
        GepettoToys nft = new GepettoToys(
            name,
            symbol,
            toyName,
            description,
            owner,
            address(0), // Minter will be set later
            royaltyReceiver,
            baseURI
        );

        // Deploy Minter contract
        GepettoMinter minter = new GepettoMinter(address(nft), owner, payoutAddress);

        // Note: The owner will need to call setMinter on the NFT contract
        // after deployment to authorize the minter

        vm.stopBroadcast();

        console2.log(unicode"✅ Gepetto Toys NFT deployed at:", address(nft));
        console2.log(unicode"✅ Gepetto Minter deployed at:", address(minter));
        console2.log(unicode"⚠️  Remember to call setMinter on NFT contract to authorize minter");
    }
}
