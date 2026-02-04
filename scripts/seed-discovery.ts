import { createWalletClient, http, publicActions, parseAbiItem, namehash } from 'viem'
import type { Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import dotenv from 'dotenv'

dotenv.config()

// --- Configuration ---
const RESOLVER_ADDRESS = '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5'
const BOND_CONTRACT = '0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF'

const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hash

if (!RPC_URL) {
  console.error("❌ Missing RPC_URL or SEPOLIA_URL in .env")
  process.exit(1)
}
if (!PRIVATE_KEY) {
  console.error("❌ Missing PRIVATE_KEY in .env")
  process.exit(1)
}

// --- ABI ---
const RESOLVER_ABI = [
  parseAbiItem('function setText(bytes32 node, string calldata key, string calldata value) external')
]

// --- Setup ---
const account = privateKeyToAccount(PRIVATE_KEY)
const client = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL)
}).extend(publicActions)

// --- Helper ---
async function setRecord(name: string, key: string, value: string) {
  const node = namehash(name)
  console.log(`\n⏳ Setting ${name} -> [${key}] = "${value}"...`)

  try {
    const hash = await client.writeContract({
      address: RESOLVER_ADDRESS,
      abi: RESOLVER_ABI,
      functionName: 'setText',
      args: [node, key, value]
    })

    console.log(`   Hash: ${hash}`)
    
    // Wait for confirmation to avoid nonce issues if using same account rapidly
    const receipt = await client.waitForTransactionReceipt({ hash })
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`)

  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message || error}`)
  }
}

// --- Main Script ---
async function main() {
  console.log(`\n🚀 Starting Discovery Seeding Script`)
  console.log(`   Signer: ${account.address}`)
  console.log(`   Resolver: ${RESOLVER_ADDRESS}`)

  // 1. Root Registry
  // Value: fast-finance-agent.eth,cheap-finance-agent.eth
  await setRecord(
    'd4-registry.eth',
    'd4.list.finance',
    'fast-finance-agent.eth,cheap-finance-agent.eth'
  )

  // 2. Fast Agent
  const fastAgent = 'fast-finance-agent.eth'
  await setRecord(fastAgent, 'd4.type', 'service')
  await setRecord(fastAgent, 'd4.bond', BOND_CONTRACT)
  await setRecord(fastAgent, 'd4.endpoint', 'http://localhost:3000/api/agent/fast')
  await setRecord(fastAgent, 'd4.payment', account.address) // Paying ourselves for demo

  // 3. Cheap Agent
  const cheapAgent = 'cheap-finance-agent.eth'
  await setRecord(cheapAgent, 'd4.type', 'service')
  await setRecord(cheapAgent, 'd4.bond', BOND_CONTRACT)
  await setRecord(cheapAgent, 'd4.endpoint', 'http://localhost:3000/api/agent/cheap')
  await setRecord(cheapAgent, 'd4.payment', account.address)

  console.log(`\n🎉 Discovery Seeding Complete!`)
}

main().catch(console.error)
