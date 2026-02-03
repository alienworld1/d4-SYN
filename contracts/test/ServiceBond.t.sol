// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/ServiceBond.sol";

// Mock ENS Registry
contract MockENS is ENS {
    mapping(bytes32 => address) public owners;

    function setOwner(bytes32 node, address _owner) external {
        owners[node] = _owner;
    }

    function owner(bytes32 node) external view override returns (address) {
        return owners[node];
    }
}

contract ServiceBondTest is Test {
    ServiceBond public serviceBond;
    MockENS public mockENS;

    address public user1 = address(0x1);
    address public user2 = address(0x2);
    
    // namehash("test.eth")
    bytes32 public constant NODE = keccak256("test.eth");

    function setUp() public {
        // Deploy Mock ENS
        mockENS = new MockENS();
        
        address ensAddress = address(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);
        vm.etch(ensAddress, address(mockENS).code);
        
        serviceBond = new ServiceBond();
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testDeposit() public {
        vm.startPrank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);
        
        (uint256 amount, uint256 creationTime, uint256 unbondRequestTime) = serviceBond.getBond(NODE);
        
        assertEq(amount, 1 ether);
        assertEq(creationTime, block.timestamp);
        assertEq(unbondRequestTime, 0);
        vm.stopPrank();
    }

    function testDepositAccumulates() public {
        vm.startPrank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);
        
        vm.warp(block.timestamp + 100);
        uint256 firstTimestamp = block.timestamp - 100;
        
        serviceBond.deposit{value: 2 ether}(NODE);
        
        (uint256 amount, uint256 creationTime, ) = serviceBond.getBond(NODE);
        
        assertEq(amount, 3 ether);
        assertEq(creationTime, firstTimestamp); // Should NOT update creation time
        vm.stopPrank();
    }

    function testInitiateExit() public {
        // Setup owner
        MockENS(address(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)).setOwner(NODE, user1);
        
        // Deposit first
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);

        // Initiate Exit
        vm.prank(user1);
        serviceBond.initiateExit(NODE);
        
        (,, uint256 unbondRequestTime) = serviceBond.getBond(NODE);
        assertEq(unbondRequestTime, block.timestamp);
    }

    function testRevertExirNotOwner() public {
        MockENS(address(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)).setOwner(NODE, user1);
        
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);

        vm.prank(user2);
        vm.expectRevert("Not Name Owner");
        serviceBond.initiateExit(NODE); 
    }

    function testFinalizeExit() public {
        // Setup owner
        MockENS(address(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)).setOwner(NODE, user1);
        
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);

        vm.prank(user1);
        serviceBond.initiateExit(NODE);

        // Advance time 30s + 1
        vm.warp(block.timestamp + 31);

        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        serviceBond.finalizeExit(NODE);
        
        uint256 balanceAfter = user1.balance;
        
        assertEq(balanceAfter - balanceBefore, 1 ether);
        
        (uint256 amount, , uint256 unbondRequestTime) = serviceBond.getBond(NODE);
        assertEq(amount, 0);
        assertEq(unbondRequestTime, 0);
    }

    function testRevertFinalizeTooEarly() public {
        MockENS(address(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)).setOwner(NODE, user1);
        
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);

        vm.prank(user1);
        serviceBond.initiateExit(NODE);

        // Advance time only 10s
        vm.warp(block.timestamp + 10);

        vm.prank(user1);
        vm.expectRevert("Unbonding period not over");
        serviceBond.finalizeExit(NODE); 
    }

    function testDepositCancelsExit() public {
        MockENS(address(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e)).setOwner(NODE, user1);
        
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(NODE);

        vm.prank(user1);
        serviceBond.initiateExit(NODE);

        // Someone deposits 0.001 ETH
        vm.prank(user2);
        serviceBond.deposit{value: 0.001 ether}(NODE);
        
        (uint256 amount, , uint256 unbondRequestTime) = serviceBond.getBond(NODE);
        assertEq(amount, 1.001 ether);
        assertEq(unbondRequestTime, 0); // Should be reset
    }
}
