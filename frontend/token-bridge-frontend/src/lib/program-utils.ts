// src/lib/program-utils.ts
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync 
} from "@solana/spl-token";

// Updated program ID for new deployment
const PROGRAM_ID = new PublicKey("Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw");

// PDA derivation functions based on your actual program seeds

/**
 * Get Bridge Config PDA
 * Seeds: ["bridge_config"]
 */
export function getBridgeConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bridge_config")],
    PROGRAM_ID
  );
}

/**
 * Get Token Vault PDA  
 * Seeds: ["token_vault", restrictedTokenMint]
 */
export function getTokenVaultPDA(restrictedTokenMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("token_vault"), restrictedTokenMint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get Whitelist PDA
 * Seeds: ["whitelist", mint]
 */
export function getWhitelistPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("whitelist"), mint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get Extra Account Meta List PDA (for Transfer Hook)
 * Seeds: ["extra-account-metas", mint]
 */
export function getExtraAccountMetaListPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get Vault's Associated Token Account
 * This is where locked Token2022 tokens are stored
 */
export function getVaultTokenAccount(
  restrictedTokenMint: PublicKey,
  tokenVault: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(
    restrictedTokenMint,
    tokenVault,
    true, // allowOwnerOffCurve (PDA can own ATA)
    TOKEN_2022_PROGRAM_ID
  );
}

/**
 * Get User's Token Account (works for both Token and Token2022)
 */
export function getUserTokenAccount(
  mint: PublicKey,
  owner: PublicKey,
  isToken2022: boolean = false
): PublicKey {
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    false, // allowOwnerOffCurve
    isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
  );
}

/**
 * Get User's Restricted Token Account (Token2022)
 */
export function getUserRestrictedTokenAccount(
  restrictedTokenMint: PublicKey,
  user: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(
    restrictedTokenMint,
    user,
    false,
    TOKEN_2022_PROGRAM_ID
  );
}

/**
 * Get User's Bridge Token Account (Standard SPL)
 */
export function getUserBridgeTokenAccount(
  bridgeTokenMint: PublicKey,
  user: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(
    bridgeTokenMint,
    user,
    false,
    TOKEN_PROGRAM_ID
  );
}

// Account structure helpers

/**
 * Get all accounts needed for wrap_tokens instruction
 */
export function getWrapTokensAccounts(
  user: PublicKey,
  restrictedTokenMint: PublicKey,
  bridgeTokenMint: PublicKey
) {
  const [bridgeConfig] = getBridgeConfigPDA();
  const [tokenVault] = getTokenVaultPDA(restrictedTokenMint);
  
  return {
    user,
    bridgeConfig,
    restrictedTokenMint,
    userRestrictedTokenAccount: getUserRestrictedTokenAccount(restrictedTokenMint, user),
    tokenVault,
    vaultTokenAccount: getVaultTokenAccount(restrictedTokenMint, tokenVault),
    bridgeTokenMint,
    userBridgeTokenAccount: getUserBridgeTokenAccount(bridgeTokenMint, user),
    tokenProgram: TOKEN_PROGRAM_ID,
    token2022Program: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };
}

/**
 * Get all accounts needed for unwrap_tokens instruction
 */
export function getUnwrapTokensAccounts(
  user: PublicKey,
  restrictedTokenMint: PublicKey,
  bridgeTokenMint: PublicKey
) {
  const [bridgeConfig] = getBridgeConfigPDA();
  const [tokenVault] = getTokenVaultPDA(restrictedTokenMint);
  
  return {
    user,
    bridgeConfig,
    restrictedTokenMint,
    userRestrictedTokenAccount: getUserRestrictedTokenAccount(restrictedTokenMint, user),
    tokenVault,
    vaultTokenAccount: getVaultTokenAccount(restrictedTokenMint, tokenVault),
    bridgeTokenMint,
    userBridgeTokenAccount: getUserBridgeTokenAccount(bridgeTokenMint, user),
    tokenProgram: TOKEN_PROGRAM_ID,
    token2022Program: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };
}

/**
 * Get all accounts needed for initialize_whitelist instruction
 */
export function getInitializeWhitelistAccounts(
  authority: PublicKey,
  mint: PublicKey
) {
  const [whitelist] = getWhitelistPDA(mint);
  
  return {
    authority,
    mint,
    whitelist,
    systemProgram: SystemProgram.programId,
  };
}

/**
 * Get all accounts needed for add_to_whitelist instruction
 */
export function getManageWhitelistAccounts(
  authority: PublicKey,
  mint: PublicKey
) {
  const [whitelist] = getWhitelistPDA(mint);
  
  return {
    authority,
    mint,
    whitelist,
  };
}

/**
 * Get all accounts needed for create_bridge_token_mint instruction
 */
export function getCreateBridgeTokenMintAccounts(
  authority: PublicKey,
  bridgeTokenMint: PublicKey
) {
  const [bridgeConfig] = getBridgeConfigPDA();
  
  return {
    authority,
    bridgeConfig,
    bridgeTokenMint,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };
}

/**
 * Get all accounts needed for initialize_bridge instruction
 */
export function getInitializeBridgeAccounts(authority: PublicKey) {
  const [bridgeConfig] = getBridgeConfigPDA();
  
  return {
    authority,
    bridgeConfig,
    systemProgram: SystemProgram.programId,
  };
}

/**
 * Get all accounts needed for admin operations (toggle, update authority, etc.)
 */
export function getUpdateBridgeConfigAccounts(authority: PublicKey) {
  const [bridgeConfig] = getBridgeConfigPDA();
  
  return {
    authority,
    bridgeConfig,
  };
}

/**
 * Get all accounts needed for whitelist_transfer_hook instruction
 */
export function getWhitelistTransferHookAccounts(
  sourceToken: PublicKey,
  mint: PublicKey,
  destinationToken: PublicKey,
  owner: PublicKey
) {
  const [extraAccountMetaList] = getExtraAccountMetaListPDA(mint);
  const [whitelist] = getWhitelistPDA(mint);
  
  return {
    sourceToken,
    mint,
    destinationToken,
    owner,
    extraAccountMetaList,
    whitelist,
  };
}

// Utility functions

/**
 * Check if a PublicKey is a valid address
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shorten a PublicKey for display
 */
export function shortenAddress(address: PublicKey | string, chars: number = 4): string {
  const addressStr = address.toString();
  return `${addressStr.slice(0, chars)}...${addressStr.slice(-chars)}`;
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Convert token amount to base units
 */
export function toBaseUnits(amount: number, decimals: number): number {
  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Convert base units to token amount
 */
export function fromBaseUnits(baseUnits: number, decimals: number): number {
  return baseUnits / Math.pow(10, decimals);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number, decimals: number = 4): string {
  if (amount === 0) return "0";
  if (amount < 0.0001) return "< 0.0001";
  return amount.toFixed(decimals);
}

/**
 * Validate token amount input
 */
export function validateTokenAmount(
  amount: string, 
  balance: number, 
  decimals: number
): { isValid: boolean; error?: string } {
  if (!amount || amount === "") {
    return { isValid: false, error: "Amount is required" };
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: "Invalid amount format" };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }
  
  if (numAmount > balance) {
    return { isValid: false, error: "Amount exceeds available balance" };
  }
  
  // Check if amount has too many decimal places
  const decimalPlaces = (amount.split('.')[1] || '').length;
  if (decimalPlaces > decimals) {
    return { isValid: false, error: `Maximum ${decimals} decimal places allowed` };
  }
  
  return { isValid: true };
}

// Transaction helpers

/**
 * Get transaction confirmation options
 */
export function getConfirmationOptions() {
  return {
    commitment: "confirmed" as const,
    preflightCommitment: "confirmed" as const,
  };
}

/**
 * Get compute unit price for priority fees (if needed)
 */
export function getComputeUnitPrice(): number {
  // Return microlamports per compute unit for priority fees
  // Adjust based on network conditions
  return 1; // Very low for devnet
}