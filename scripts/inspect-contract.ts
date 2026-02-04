
import { createPublicClient, http, encodeFunctionData, parseAbi, decodeFunctionResult } from 'viem';
import { sepolia } from 'viem/chains';

const CUSTODY_ADDRESS = '0x019B65A265EB3363822f2752141b3dF16131b262';

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

async function main() {
  console.log('Inspecting contract:', CUSTODY_ADDRESS);

  // Try standard eip712Domain
  try {
    const abi = parseAbi([
        'function eip712Domain() external view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)'
    ]);

    const data = await client.readContract({
      address: CUSTODY_ADDRESS,
      abi: abi,
      functionName: 'eip712Domain',
    });
    console.log('EIP712Domain Result:', data);
  } catch (e) {
    console.log('standard eip712Domain failed:');
  }

  // Try older domainSeparator
  try {
     const abi = parseAbi(['function DOMAIN_SEPARATOR() external view returns (bytes32)']);
     const data = await client.readContract({
        address: CUSTODY_ADDRESS,
        abi: abi,
        functionName: 'DOMAIN_SEPARATOR',
     });
     console.log('DOMAIN_SEPARATOR:', data);
  } catch(e) {
    console.log('DOMAIN_SEPARATOR failed');
  }
}

main();
