// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/ServiceBond.sol";

contract Withdraw is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address bondAddress = vm.envAddress("BOND_ADDRESS");
        uint256 label = vm.envUint("LABEL");
        uint256 amount = vm.envUint("AMOUNT");

        vm.startBroadcast(deployerPrivateKey);

        ServiceBond(bondAddress).withdraw(label, amount);
        console.log("Withdrawn", amount, "wei from label", label);

        vm.stopBroadcast();
    }
}
