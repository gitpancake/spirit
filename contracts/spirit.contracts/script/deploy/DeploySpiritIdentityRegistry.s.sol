// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {SpiritIdentityRegistryV2} from "../../contracts/Spirit/SpiritIdentityRegistryV2.sol";

contract DeploySpiritIdentityRegistry is Script {
    function run() external {
        // Get owner (defaults to deployer if not set)
        address owner = vm.envOr("SPIRIT_COUNCIL_ADDRESS", address(0));
        if (owner == address(0)) owner = msg.sender;

        console2.log("Deploying Spirit Identity Registry");
        console2.log("Network:", block.chainid);
        console2.log("Owner:", owner);

        vm.startBroadcast();

        SpiritIdentityRegistryV2 registry = new SpiritIdentityRegistryV2(owner);

        vm.stopBroadcast();

        console2.log(unicode"✅ Spirit Identity Registry deployed at:", address(registry));
    }
}
