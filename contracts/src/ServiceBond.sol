// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title ServiceBond
 * @notice A capital vault for ENS domains. Allows bonding ETH to an ENS node.
 * @dev Intended for use on Sepolia.
 */

interface ENS {
    function owner(bytes32 node) external view returns (address);
}

contract ServiceBond {
    // -------------------------------------------------------------------------
    // Data Structures
    // -------------------------------------------------------------------------

    struct BondInfo {
        uint256 amount;            // Staked ETH (in wei)
        uint256 creationTime;      // Timestamp of first deposit (for Lindy Effect score)
        uint256 unbondRequestTime; // 0 = Active, >0 = Timestamp when exit started
    }

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------

    // Mapping of ENS Node Hash -> Bond Info
    mapping(bytes32 => BondInfo) public bonds;

    // The Sepolia ENS Registry Address (Hardcoded as per spec)
    // 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
    ENS public constant ensRegistry = ENS(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);

    // Unbonding period (Hardcoded to 30 seconds for Hackathon Demo)
    uint256 public constant UNBONDING_PERIOD = 30 seconds;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event BondIncreased(bytes32 indexed node, uint256 amount, uint256 newTotal);
    event ExitInitiated(bytes32 indexed node, uint256 timestamp);
    event BondWithdrawn(bytes32 indexed node, uint256 amount);

    // -------------------------------------------------------------------------
    // Main Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit ETH to bond a specific ENS node.
     * @dev Optionally can be called by anyone (VC funding model).
     *      Resets unbondRequestTime if an exit was pending (prevents exit fakeouts).
     * @param node The namehash of the ENS domain
     */
    function deposit(bytes32 node) external payable {
        // Validation: None strictly required on amount, but 0 value has logic implications below
        
        BondInfo storage bond = bonds[node];

        // 1. Logic: Add funds
        bond.amount += msg.value;

        // 2. Logic: Set creation time if this is the first deposit
        if (bond.creationTime == 0 && bond.amount > 0) {
            bond.creationTime = block.timestamp;
        }

        // 3. Logic: Cancel any pending exit
        // If money is added, the node is considered active again.
        if (bond.unbondRequestTime > 0) {
            bond.unbondRequestTime = 0;
        }

        emit BondIncreased(node, msg.value, bond.amount);
    }

    /**
     * @notice Signal intent to exit and withdraw funds.
     * @dev Starts the unbonding timer. Must be owner.
     * @param node The namehash of the ENS domain
     */
    function initiateExit(bytes32 node) external {
        // Validation: Must be owner of the name
        require(ensRegistry.owner(node) == msg.sender, "Not Name Owner");

        BondInfo storage bond = bonds[node];
        require(bond.amount > 0, "No bonded amount");
        require(bond.unbondRequestTime == 0, "Exit already initiated");

        // Logic: Set timer
        bond.unbondRequestTime = block.timestamp;

        emit ExitInitiated(node, bond.unbondRequestTime);
    }

    /**
     * @notice Finalize the exit and withdraw funds.
     * @dev Checks timer and ownership.
     * @param node The namehash of the ENS domain
     */
    function finalizeExit(bytes32 node) external {
        // Validation: Must be owner of the name
        // (Ownership can change during unbonding period, we always check CURRENT owner)
        require(ensRegistry.owner(node) == msg.sender, "Not Name Owner");

        BondInfo storage bond = bonds[node];

        // Validation: Exit must be initiated
        require(bond.unbondRequestTime > 0, "Exit not initiated");

        // Validation: Time must have passed
        require(block.timestamp >= bond.unbondRequestTime + UNBONDING_PERIOD, "Unbonding period not over");

        uint256 payout = bond.amount;
        require(payout > 0, "No funds to withdraw");

        // Logic: Reset state
        bond.amount = 0;
        bond.unbondRequestTime = 0;

        emit BondWithdrawn(node, payout);

        // Interaction: Send ETH
        (bool sent, ) = msg.sender.call{value: payout}("");
        require(sent, "Failed to send Ether");
    }

    /**
     * @notice Read the full bond state for a node.
     * @param node The namehash of the ENS domain
     */
    function getBond(bytes32 node) external view returns (uint256 amount, uint256 creationTime, uint256 unbondRequestTime) {
        BondInfo memory bond = bonds[node];
        return (bond.amount, bond.creationTime, bond.unbondRequestTime);
    }
}
