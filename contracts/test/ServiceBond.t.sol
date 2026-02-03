// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/ServiceBond.sol";

// Mock BaseRegistrar for testing
contract MockBaseRegistrar is IBaseRegistrar {
    mapping(uint256 => address) public owners;

    function setOwner(uint256 tokenId, address owner) external {
        owners[tokenId] = owner;
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        address owner = owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }
}

contract ServiceBondTest is Test {
    ServiceBond public serviceBond;
    MockBaseRegistrar public mockRegistrar;

    address public user1 = address(0x1);
    address public user2 = address(0x2);

    // "testname" -> keccak256("testname")
    uint256 public constant LABEL = uint256(keccak256("testname"));
    
    // namehash("testname.eth")
    // = keccak256(ETH_NODE_HASH + LABEL)
    bytes32 public node;

    function setUp() public {
        mockRegistrar = new MockBaseRegistrar();
        serviceBond = new ServiceBond(address(mockRegistrar));
        
        // Calculate the expected node hash
        node = keccak256(abi.encodePacked(serviceBond.ETH_NODE_HASH(), bytes32(LABEL)));

        // Setup User 1 with some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testDeposit() public {
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(node);

        assertEq(serviceBond.bonds(node), 1 ether);
    }

    function testWithdrawSuccess() public {
        // 1. Setup Bond
        vm.prank(user1);
        serviceBond.deposit{value: 2 ether}(node);

        // 2. Setup Ownership
        mockRegistrar.setOwner(LABEL, user1);

        // 3. User 1 Withdraws
        vm.startPrank(user1);
        serviceBond.withdraw(LABEL, 1 ether);
        vm.stopPrank();

        // 4. Verify
        assertEq(serviceBond.bonds(node), 1 ether);
        assertEq(user1.balance, 9 ether); // Started with 10, sent 2, got 1 back
    }

    function testWithdrawFailNotOwner() public {
        // 1. Setup Bond
        vm.prank(user1);
        serviceBond.deposit{value: 2 ether}(node);

        // 2. Setup Ownership (User 1 owns it)
        mockRegistrar.setOwner(LABEL, user1);

        // 3. User 2 tries to withdraw
        vm.prank(user2);
        vm.expectRevert("Not Name Owner");
        serviceBond.withdraw(LABEL, 1 ether);
    }

    function testWithdrawFailInsufficientBalance() public {
        // 1. Setup Bond
        vm.prank(user1);
        serviceBond.deposit{value: 1 ether}(node);

        // 2. Setup Ownership
        mockRegistrar.setOwner(LABEL, user1);

        // 3. User 1 tries to withdraw too much
        vm.prank(user1);
        vm.expectRevert("Insufficient Bond");
        serviceBond.withdraw(LABEL, 2 ether);
    }
}
