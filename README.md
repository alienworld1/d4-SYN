# d4-syn: High-Frequency Compute Exchange

## Abstract
d4-syn provides a market structure for autonomous agents to procure compute resources (LLM inference) using cryptographic rails. It specifically addresses the mismatch between blockchain block times (seconds) and inference latency requirements (milliseconds) by utilizing high-frequency state channels for realtime Quality of Service (QoS) enforcement.

## The Problem
Autonomous agents and high-performance SaaS providers encounter two specific barriers in the current infrastructure:
1.  **Financial Identity**: Agents cannot hold bank accounts or credit cards, restricting them from standard SaaS APIs.
2.  **Misaligned Economic Incentives (The "Lag Tax")**: In Web2, API providers charge the same price for a 50ms response as a 500ms response. If a provider degrades, the consumer bears the cost (user churn, bad PR, system timeouts) while the provider captures full revenue. There is no programmatic way to force providers to internalize the cost of their own latency.
3.  **Granularity**: L2 blockchains (Optimism, Base) typically operate with 2-second block times. AI text generation occurs at ~50ms per token. Agents cannot enforce a 50ms latency SLA on a 2-second ledger. This effectively makes on-chain computation "blind" to performance degradation.

## The Architecture

### Layer 1: Capital (ENS as Financial Primitive)
d4-syn treats ENS domains as **Bearer Assets for Capital**. The protocol utilizes a custom `ServiceBond` contract that locks ETH/USDC against the ENS Node Hash rather than a wallet address.

This distinction is critical for market dynamics:
*   **Transferable Reputation**: Because the bond is tied to the Name, transferring the ENS domain on a secondary market (e.g., OpenSea) automatically transfers the underlying Bond and associated Trust Score.
*   **Pre-staked Identity**: This enables a secondary market for "High-Reputation Identity," allowing new infrastructure providers to acquire established identities rather than building reputation from zero.

### Layer 2: Execution (Yellow Network)
The protocol uses Yellow Network state channels for execution. This enables the **Flash Switch** mechanism. During an active stream, the Agent polls the Provider's off-chain price and latency metrics every 500ms. If a provider violates the price/performance ratio, the Agent is architected to:
1.  Sign a final state update closing the current channel.
2.  Instantiate a new channel with a secondary provider.
3.  Resume the data stream.
This occurs with sub-second latency, treating compute as a commoditized, liquid asset.

## Core Features

### Bonded Discovery
Trust is derived from "Skin in the Game." The discovery logic filters providers based on a **Trust Score**, calculated logarithmically based on stake size and time.
*   **Logarithmic Scoring**: Prevents well-capitalized attackers from buying "instant trust." A $100,000 bond is not 100x more trusted than a $1,000 bond; it yields diminishing returns.
*   **Time-Weighting**: Trust accrues linearly over time, rewarding longevity.

### Micro-SLA Enforcement
Standard SLAs function on monthly uptime. d4-syn acts on per-packet latency.
The client acts as a local oracle, measuring the time-delta between requested chunks.
*   **<100ms**: Full payment.
*   **100-300ms**: Linear payment reduction (Penalty).
*   **>300ms**: Zero payment (Violation).
This incentivizes providers to maintain available capacity or risk instantaneous revenue loss. **It effectively transfers the financial risk of latency from the Consumer (churn) back to the Provider (slashed revenue)**.

### Unbonding Period (Rug Pull Defense)
The `ServiceBond` contract enforces a mandatory unbonding period (configured to 30s for demo, 7 days for production). If a provider initiates an exit, the protocol flags them as a "Lame Duck," and agents automatically disconnect before the capital can be withdrawn.

## Architectural Trade-offs

### Why State Channels vs. L2?
Economic viability depends on transaction density.
*   **L2 Transaction**: ~$0.01 per tx.
*   **State Channel Open**: ~$0.50 (amortized).
For a single API call, L2 is efficient. For a long-running session generating 500 tokens with individual SLA checks per token, an L2 solution would cost $5.00 and congest the network. A State Channel reduces the marginal cost of the 500th token to near-zero, making high-fidelity monitoring economically feasible.

### The Oracle Problem
We intentionally avoid external oracles (Chainlink) for latency verification. The Buyer (Agent) acts as the subjective oracle for its own session.
*   **Risk**: A malicious Buyer could claim lag to pay less.
*   **Mitigation**: Providers maintain local logs. If a Buyer consistently underpays relative to server-side metrics, the Provider adds the Buyer to a local blocklist. This creates a balanced "Tit-for-Tat" equilibrium without centralized arbitration.

## Evidence Locker

**Verified Contracts**
*   ServiceBond (Sepolia): `0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF`

**ENS Registry**
*   Registry Root: `d4-registry.eth`

## Setup & Run

### Prerequisites
*   Node.js v20+
*   Yellow Network Sandbox Account
*   Foundry (for contract interactions)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
touch .env
# Set GEMINI_API_KEY
# Set NEXT_PUBLIC_YELLOW_RPC = wss://clearnet-sandbox.yellow.com/ws

# Run development server
npm run dev
```

The Mission Control dashboard will launch at `http://localhost:3000`.
