import { createWalletClient, http, publicActions, parseAbiItem, namehash, parseEther } from 'viem'
import type { Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import dotenv from 'dotenv'

dotenv.config()

// --- Configuration ---
const BOND_CONTRACT = '0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF'

// Flexible env var support
const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hash

if (!RPC_URL) {
  console.error("❌ Missing RPC_URL (or SEPOLIA_URL) in .env")
  process.exit(1)
}
if (!PRIVATE_KEY) {
  console.error("❌ Missing PRIVATE_KEY in .env")
  process.exit(1)
}

// --- ABI ---
const BOND_ABI = [
  parseAbiItem('function deposit(bytes32 node) external payable')
]

// --- Setup ---
const account = privateKeyToAccount(PRIVATE_KEY)
const client = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL)
}).extend(publicActions)

// --- Helper ---
async function depositBond(domain: string, amountEth: string) {
  const node = namehash(domain)
  const value = parseEther(amountEth)
  
  console.log(`\n💰 Bonding ${amountEth} ETH for ${domain}...`)
  console.log(`   Node Hash: ${node}`)

  try {
    const hash = await client.writeContract({
      address: BOND_CONTRACT,
      abi: BOND_ABI,
      functionName: 'deposit',
      args: [node],
      value: value
    })

    console.log(`   Hash: ${hash}`)
    console.log(`   ⏳ Waiting for confirmation...`)
    
    // Wait for confirmation
    const receipt = await client.waitForTransactionReceipt({ hash })
    console.log(`   ✅ Sent! Block: ${receipt.blockNumber}`)

  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message || error}`)
  }
}

// --- Main Script ---
async function main() {
  console.log(`\n🚀 Starting Bond Seeding Script`)
  console.log(`   Signer: ${account.address}`)
  console.log(`   Contract: ${BOND_CONTRACT}`)

  // 1. High Trust Deposit (0.05 ETH)
  await depositBond('fast-finance-agent.eth', '0.05')

  // 2. Low Trust Deposit (0.01 ETH)
  // This demonstrates the "Sort by Capital" logic in the d4-syn dashboard
  await depositBond('cheap-finance-agent.eth', '0.01')

  console.log(`\n🎉 Bonding Complete! The Trust Scores should now reflect these stakes.`)
  process.exit(0)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
