// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/ServiceBond.sol";

contract Deposit is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bondAddress = vm.envAddress("BOND_ADDRESS");
        bytes32 node = vm.envBytes32("NODE");
        uint256 amount = vm.envUint("AMOUNT");

        vm.startBroadcast(deployerPrivateKey);

        ServiceBond(bondAddress).deposit{value: amount}(node);
        console.log("Deposited", amount, "wei to node", vm.toString(node));

        vm.stopBroadcast();
    }
}
