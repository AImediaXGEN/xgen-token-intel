import { Connection, PublicKey, type Commitment } from "@solana/web3.js";

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEFAULT_COMMITMENT: Commitment = "confirmed";

export function getRpcUrl(): string {
  return process.env.SOLANA_RPC_URL?.trim() || DEFAULT_RPC_URL;
}

export function createReadOnlyConnection(): Connection {
  return new Connection(getRpcUrl(), DEFAULT_COMMITMENT);
}

export function parseSolanaPublicKey(input: string): PublicKey | null {
  const candidate = input.trim();

  if (!candidate) {
    return null;
  }

  try {
    const publicKey = new PublicKey(candidate);
    return publicKey.toBase58() === candidate ? publicKey : null;
  } catch {
    return null;
  }
}
