export const SERVICE_BOND_ADDRESS = "0x31d4bbd8ffb9c77b90f5b679d19c998acddc14af";

export const SERVICE_BOND_ABI = [
  {
    "type": "function",
    "name": "bonds",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "creationTime",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "unbondRequestTime",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "node",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "finalizeExit",
    "inputs": [
      {
        "name": "node",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "initiateExit",
    "inputs": [
      {
        "name": "node",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;
