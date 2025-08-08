// src/lib/orca-utils.ts
import { PublicKey } from '@solana/web3.js';

// ===================================================================
// ORCA CONSTANTS AND CONFIGURATION
// ===================================================================

// Orca Splash Pool Configuration
export const ORCA_CONFIG = {
  SPLASH_POOL_TICK_SPACING: 64,
  WHIRLPOOL_PROGRAM_ID: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  DEFAULT_SLIPPAGE: 1, // 1%
  FEE_TIERS: {
    SPLASH: 0.003, // 0.3%
    STANDARD: 0.01, // 1%
  }
};

// ===================================================================
// ORCA TYPES AND INTERFACES
// ===================================================================

// Token info for Orca integration
export interface OrcaTokenInfo {
  mint: PublicKey;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
}

export interface OrcaPool {
  address: PublicKey;
  tokenA: OrcaTokenInfo;
  tokenB: OrcaTokenInfo;
  liquidity: number;
  price: number;
  volume24h: number;
  fees24h: number;
  apr: number;
}

export interface LiquidityPosition {
  pool: PublicKey;
  owner: PublicKey;
  liquidity: number;
  tokenAAmount: number;
  tokenBAmount: number;
  fees: {
    tokenA: number;
    tokenB: number;
  };
}

export interface SwapQuote {
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  fees: number;
  route: PublicKey[];
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

// Helper function to format pool addresses
export function formatPoolAddress(address: PublicKey): string {
  const str = address.toBase58();
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

// Helper function to calculate price impact
export function calculatePriceImpact(
  amountIn: number,
  amountOut: number,
  currentPrice: number
): number {
  const executionPrice = amountIn / amountOut;
  const priceImpact = Math.abs((executionPrice - currentPrice) / currentPrice);
  return priceImpact * 100; // Return as percentage
}

// Helper function to format token amounts
export function formatTokenAmount(amount: number, decimals: number = 4): string {
  if (amount === 0) return "0";
  if (amount < 0.0001) return "< 0.0001";
  return amount.toFixed(decimals);
}

// Helper function to calculate APR from fees
export function calculateAPR(
  fees24h: number,
  liquidity: number
): number {
  if (liquidity === 0) return 0;
  const dailyRate = fees24h / liquidity;
  const annualRate = dailyRate * 365;
  return annualRate * 100; // Return as percentage
}

// Helper function to validate Orca pool address
export function isValidOrcaPool(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

// Helper function to get pool name
export function getPoolName(tokenA: OrcaTokenInfo, tokenB: OrcaTokenInfo): string {
  return `${tokenA.symbol}/${tokenB.symbol}`;
}

// Helper function to calculate minimum amounts for slippage
export function calculateMinimumAmounts(
  amountA: number,
  amountB: number,
  slippagePercent: number = ORCA_CONFIG.DEFAULT_SLIPPAGE
): { minAmountA: number; minAmountB: number } {
  const slippageMultiplier = (100 - slippagePercent) / 100;
  return {
    minAmountA: amountA * slippageMultiplier,
    minAmountB: amountB * slippageMultiplier,
  };
}

// Helper function to sort tokens (Orca convention)
export function sortTokens(
  tokenA: PublicKey,
  tokenB: PublicKey
): [PublicKey, PublicKey] {
  const comparison = tokenA.toBuffer().compare(tokenB.toBuffer());
  return comparison < 0 ? [tokenA, tokenB] : [tokenB, tokenA];
}

// Helper function to calculate pool reserves ratio
export function calculatePoolRatio(
  tokenAAmount: number,
  tokenBAmount: number
): number {
  if (tokenBAmount === 0) return 0;
  return tokenAAmount / tokenBAmount;
}

// ===================================================================
// ORCA ERROR TYPES
// ===================================================================

export enum OrcaErrorType {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  INVALID_TOKEN = 'INVALID_TOKEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

export class OrcaError extends Error {
  constructor(
    public type: OrcaErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OrcaError';
  }
}

// Helper function to handle Orca errors
export function handleOrcaError(error: any): string {
  if (error instanceof OrcaError) {
    switch (error.type) {
      case OrcaErrorType.INSUFFICIENT_FUNDS:
        return 'Insufficient funds for this transaction';
      case OrcaErrorType.SLIPPAGE_EXCEEDED:
        return 'Price moved too much. Try increasing slippage tolerance';
      case OrcaErrorType.POOL_NOT_FOUND:
        return 'Pool not found. Please check the pool address';
      case OrcaErrorType.INVALID_TOKEN:
        return 'Invalid token. Please check token addresses';
      case OrcaErrorType.NETWORK_ERROR:
        return 'Network error. Please try again';
      case OrcaErrorType.TRANSACTION_FAILED:
        return 'Transaction failed. Please try again';
      default:
        return error.message;
    }
  }
  
  // Handle common Solana/Anchor errors
  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient SOL for transaction fees';
  }
  
  if (error.message?.includes('slippage')) {
    return 'Price moved too much during swap';
  }
  
  return error.message || 'An unexpected error occurred';
}