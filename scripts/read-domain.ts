import { createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const CUSTODY_ADDRESS = '0x019B65A265EB3363822f2752141b3dF16131b262';

async function main() {
    try {
        console.log('Reading EIP712 Domain from Custody Contract:', CUSTODY_ADDRESS);
        const abi = parseAbi([
            'function eip712Domain() view returns (bytes1, string, string, uint256, address, bytes32, uint256[])'
        ]);
        
        const domain = await client.readContract({
            address: CUSTODY_ADDRESS,
            abi: abi,
            functionName: 'eip712Domain'
        });
        
        console.log('Domain Result:', domain);
    } catch (e) {
        console.error('Error:', e);
    }
}

main();