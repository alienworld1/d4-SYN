
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';

const UNIVERSAL_RESOLVER_ADDRESS = '0xBaBC7678D7A63104f1658c11D6AE9A21cdA09725';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL)
});

async function test() {
  console.log('Testing ENS Resolution...');
  console.log('RPC:', RPC_URL);
  console.log('Resolver:', UNIVERSAL_RESOLVER_ADDRESS);
  
  try {
    const name = normalize('d4-registry.eth');
    console.log(`Resolving ${name} key 'd4.list.finance'...`);
    
    // Method 1: Using getEnsText with universalResolver
    try {
        const text = await client.getEnsText({
            name,
            key: 'd4.list.finance',
            universalResolverAddress: UNIVERSAL_RESOLVER_ADDRESS
        });
        console.log('Method 1 Result:', text);
    } catch (e: any) {
        console.error('Method 1 Failed:', e.message);
    }
    
    // Method 2: Standard resolver (let viem find it)
    try {
        const text2 = await client.getEnsText({
            name,
            key: 'd4.list.finance',
        });
        console.log('Method 2 Result:', text2);
    } catch (e: any) {
        console.error('Method 2 Failed:', e.message);
    }

  } catch (e) {
    console.error('Test Failed:', e);
  }
}

test();
