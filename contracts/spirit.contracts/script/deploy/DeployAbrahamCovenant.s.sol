// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {AbrahamCovenant} from "../../contracts/NFT/AbrahamCovenant.sol";

contract DeployAbrahamCovenant is Script {
    function run() external {
        // Load configuration
        address owner = vm.envOr("ABRAHAM_OWNER", address(0));
        if (owner == address(0)) owner = msg.sender;

        address abraham = vm.envOr("ABRAHAM_ADDRESS", address(0));
        require(abraham != address(0), "ABRAHAM_ADDRESS required");

        uint256 maxSupply = vm.envOr("ABRAHAM_MAX_SUPPLY", uint256(100));
        uint256 daysOfWork = vm.envOr("ABRAHAM_DAYS_OF_WORK", uint256(6));

        string memory baseURI;
        try vm.envString("ABRAHAM_BASE_URI") returns (string memory uri) {
            baseURI = uri;
        } catch {
            baseURI = "";
        }

        console2.log("Deploying Abraham Covenant NFT");
        console2.log("Network:", block.chainid);
        console2.log("Owner:", owner);
        console2.log("Abraham Contract:", abraham);
        console2.log("Max Supply:", maxSupply);
        console2.log("Days of Work:", daysOfWork);

        vm.startBroadcast();

        AbrahamCovenant nft = new AbrahamCovenant(
            "Abraham Covenant",
            "COVENANT",
            owner,
            abraham,
            maxSupply,
            daysOfWork
        );

        vm.stopBroadcast();

        console2.log(unicode"✅ Abraham Covenant NFT deployed at:", address(nft));
    }
}
