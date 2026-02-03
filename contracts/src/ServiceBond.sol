// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title ServiceBond
 * @notice A capital vault for ENS domains. Allows bonding ETH to an ENS node.
 * @dev Intended for Hackathon MVP on Sepolia. Only supports unwrapped .eth names.
 */

// Interface for the ENS Base Registrar (ERC721)
interface IBaseRegistrar {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract ServiceBond {
    // -------------------------------------------------------------------------
    // State & Constants
    // -------------------------------------------------------------------------

    // Use a reentrancy lock for withdraw
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    // The Sepolia Base Registrar Address
    // address public constant BASE_REGISTRAR = 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85;
    IBaseRegistrar public immutable registrar;

    // namehash('eth')
    bytes32 public constant ETH_NODE_HASH =
        0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

    // Mapping of ENS Node Hash -> Bonded Amount (in wei)
    mapping(bytes32 => uint256) public bonds;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event BondIncreased(bytes32 indexed node, uint256 amount, uint256 newTotal);
    event BondWithdrawn(bytes32 indexed node, uint256 amount, uint256 newTotal);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _registrar) {
        registrar = IBaseRegistrar(_registrar);
        _status = _NOT_ENTERED;
    }

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // -------------------------------------------------------------------------
    // Main Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit ETH to bond a specific ENS node.
     * @dev Anyone can deposit to any node.
     * @param node The namehash of the ENS domain (e.g. namehash('fast-gpt.eth'))
     */
    function deposit(bytes32 node) external payable {
        require(msg.value > 0, "No value sent");

        bonds[node] += msg.value;

        emit BondIncreased(node, msg.value, bonds[node]);
    }

    /**
     * @notice Withdraw bonded ETH. Only the owner of the .eth name can withdraw.
     * @param label The keccak256 label of the name (e.g. keccak256('fast-gpt'))
     * @param amount Amount to withdraw in wei
     */
    function withdraw(uint256 label, uint256 amount) external nonReentrant {
        // 1. Check Ownership via Base Registrar
        // ownerOf will revert if token doesn't exist
        address owner = registrar.ownerOf(label);
        require(owner == msg.sender, "Not Name Owner");

        // 2. Reconstruct the Node Hash
        // node = keccak256(ETH_NODE_HASH + label_hash)
        bytes32 node = keccak256(abi.encodePacked(ETH_NODE_HASH, bytes32(label)));

        // 3. Check Balance
        require(bonds[node] >= amount, "Insufficient Bond");

        // 4. Update State
        bonds[node] -= amount;
        emit BondWithdrawn(node, amount, bonds[node]);

        // 5. Transfer Funds
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }
}
