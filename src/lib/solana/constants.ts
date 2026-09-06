import { PublicKey } from "@solana/web3.js";

export const SPL_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VE9zhz4v5DAwU6AFwdYJ11rAUYms",
);

export type SupportedTokenProgram = "spl-token" | "token-2022" | "unknown";

export function identifyTokenProgram(owner: PublicKey): SupportedTokenProgram {
  if (owner.equals(SPL_TOKEN_PROGRAM_ID)) {
    return "spl-token";
  }

  if (owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return "token-2022";
  }

  return "unknown";
}
