// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/ServiceBond.sol";

contract DeployServiceBond is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address registrar = 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85;

        vm.startBroadcast(deployerPrivateKey);

        ServiceBond bond = new ServiceBond(registrar);
        console.log("ServiceBond Deployed at:", address(bond));

        vm.stopBroadcast();
    }
}
