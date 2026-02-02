"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const STORAGE_KEY = "d4_session_pk";

export function useSessionWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  useEffect(() => {
    // Client-side only
    if (typeof window === "undefined") return;

    let pk = localStorage.getItem(STORAGE_KEY);

    if (!pk) {
      // Generate new Identity
      const wallet = ethers.Wallet.createRandom();
      pk = wallet.privateKey;
      localStorage.setItem(STORAGE_KEY, pk);
      console.log("[SESSION] Generated new Session Key Identity");
    }

    setPrivateKey(pk);
    const wallet = new ethers.Wallet(pk);
    setAddress(wallet.address);
  }, []);

  return {
    address,
    privateKey,
  };
}
