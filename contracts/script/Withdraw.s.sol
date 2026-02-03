// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/ServiceBond.sol";

contract Withdraw is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bondAddress = vm.envAddress("BOND_ADDRESS");
        bytes32 node = vm.envBytes32("NODE");

        vm.startBroadcast(deployerPrivateKey);

        ServiceBond(bondAddress).finalizeExit(node);
        console.log("Finalized exit for node", vm.toString(node));

        vm.stopBroadcast();
    }
}
