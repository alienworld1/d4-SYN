
import { createPublicClient, http, namehash, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'; // Try the improved one

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL)
});

const REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const DOMAIN = 'd4-registry.eth';
const KEY = 'd4.list.finance';

async function debug() {
  console.log(`Debugging ENS for ${DOMAIN} on Sepolia...`);

  try {
    const node = namehash(normalize(DOMAIN));
    console.log(`Node: ${node}`);

    // 1. Get Resolver from Registry
    console.log(`\n1. Querying Registry (${REGISTRY_ADDRESS})...`);
    const registryAbi = parseAbi(['function resolver(bytes32 node) view returns (address)']);
    
    const resolverAddress = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: 'resolver',
      args: [node]
    });

    console.log(`Resolver Address: ${resolverAddress}`);

    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
      console.error('No resolver set for this domain!');
      return;
    }

    // 2. Query Text Record from Resolver
    console.log(`\n2. Querying Text Record (${KEY}) from Resolver...`);
    const resolverAbi = parseAbi(['function text(bytes32 node, string key) view returns (string)']);
    
    const text = await client.readContract({
      address: resolverAddress,
      abi: resolverAbi,
      functionName: 'text',
      args: [node, KEY]
    });

    console.log(`\nResult: "${text}"`);
    
  } catch (err: any) {
    console.error('Error:', err);
  }
}

debug();
