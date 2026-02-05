import { createWalletClient, http, parseAbi, namehash, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

const BOND_CONTRACT_ADDRESS = '0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF';

const ABI = parseAbi([
  'function deposit(bytes32 node) external payable'
]);

const CONFIG = [
  { name: 'fast-finance-agent.eth', amount: '0.05' },
  { name: 'cheap-finance-agent.eth', amount: '0.04' },
  { name: 'evil-finance-agent.eth', amount: '0.0001' }
];

async function main() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('Missing PRIVATE_KEY in .env');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl)
  });

  console.log(`Seeding bonds from ${account.address}...`);

  for (const agent of CONFIG) {
    const node = namehash(agent.name);
    console.log(`Bonding ${agent.amount} ETH for ${agent.name} (${node})...`);

    try {
      const hash = await client.writeContract({
        address: BOND_CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'deposit',
        args: [node],
        value: parseEther(agent.amount)
      });
      console.log(`  -> Tx: ${hash}`);
    } catch (e: any) {
      console.error(`  -> Failed: ${e.message}`);
    }
  }
}

main();
