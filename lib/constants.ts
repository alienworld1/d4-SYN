export const USDC_SEPOLIA_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export const YELLOW_RPC_URL = process.env.NEXT_PUBLIC_YELLOW_RPC || "wss://clearnet-sandbox.yellow.com/ws";
export const MOCK_YELLOW = process.env.NEXT_PUBLIC_MOCK_YELLOW === "true";

export const YELLOW_ADDRESSES = {
  custody: "0x019B65A265EB3363822f2752141b3dF16131b262",
  adjudicator: "0x7c7ccbc98469190849BCC6c926307794fDfB11F2"
};

export const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;
