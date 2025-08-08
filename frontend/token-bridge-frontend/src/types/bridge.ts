// src/types/bridge.ts
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// Re-export types from anchor-setup for consistency - FIXED import path
export type {
  BridgeConfig,
  TokenVault,
  SimpleWhitelist,
} from '@/lib/anchor-setup';

export {
  BridgeError,
  ERROR_MESSAGES,
  getErrorMessage,
  convertBridgeConfig,
  convertTokenVault,
  convertSimpleWhitelist,
} from '@/lib/anchor-setup';

// Additional frontend-specific types
export interface TokenInfo {
  mint: PublicKey;
  name?: string;
  symbol?: string;
  decimals: number;
  supply?: number;
  isToken2022: boolean;
  hasTransferHook: boolean;
}

export interface BridgeTransaction {
  signature: string;
  type: 'wrap' | 'unwrap';
  amount: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  restrictedTokenMint?: PublicKey;
  bridgeTokenMint?: PublicKey;
}

export interface PoolInfo {
  address: PublicKey;
  tokenA: PublicKey;
  tokenB: PublicKey;
  liquidityA: number;
  liquidityB: number;
  price: number;
  isActive: boolean;
}

// Hook types for form handling
export interface CreateTokenForm {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  enableWhitelist: boolean;
}

export interface BridgeForm {
  amount: string;
  restrictedTokenMint: string;
}

export interface PoolForm {
  tokenA: string;
  tokenB: string;
  initialPrice: string;
  liquidityA: string;
  liquidityB: string;
}

// API response types
export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: any[];
}

// Wallet adapter types
export interface WalletContextType {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnect: () => Promise<void>;
}

// Program context types - FIXED: use BridgeConfig from anchor-setup
export interface SolanaContextType {
  program: any | null;
  bridgeConfig: import('@/lib/anchor-setup').BridgeConfig | null;
  isLoading: boolean;
  refreshBridgeConfig: () => Promise<void>;
  error: string | null;
}

// Component prop types
export interface TokenBalanceProps {
  mint: PublicKey;
  owner: PublicKey;
  isToken2022?: boolean;
}

export interface TokenSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tokens: TokenInfo[];
  placeholder?: string;
  disabled?: boolean;
}

// Hook return types
export interface UseBridgeReturn {
  wrapTokens: (mint: PublicKey, amount: number, decimals?: number) => Promise<string>;
  unwrapTokens: (mint: PublicKey, amount: number, decimals?: number) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export interface UseTokenBalanceReturn {
  balance: number;
  decimals: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  error: string | null;
}

export interface UseJupiterReturn {
  getQuote: (inputMint: string, outputMint: string, amount: number, slippageBps?: number) => Promise<QuoteResponse | null>;
  executeSwap: (quoteResponse: QuoteResponse) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

// Constants
export const PROGRAM_CONFIG = {
  PROGRAM_ID: "Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw",
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  NETWORK: (process.env.NEXT_PUBLIC_NETWORK as "devnet" | "mainnet") || "devnet",
};

export const TOKEN_ADDRESSES = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC_DEV: "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k",
};

// Utility types
export type NetworkType = "devnet" | "mainnet" | "testnet";

export type TransactionStatus = "idle" | "loading" | "success" | "error";

export interface TransactionState {
  status: TransactionStatus;
  signature?: string;
  error?: string;
}

// Event types for demo flow
export interface DemoStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  path?: string;
}

export interface DemoFlowState {
  currentStep: string;
  completedSteps: string[];
  isComplete: boolean;
}

// Error handling types
export interface BridgeErrorInfo {
  code: number;
  message: string;
  instruction?: string;
  programError?: boolean;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TokenValidation extends ValidationResult {
  mint: PublicKey | null;
  isToken2022: boolean;
  hasTransferHook: boolean;
  decimals: number;
}

// Local storage types (if needed for caching)
export interface CachedTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  timestamp: number;
}

export interface UserPreferences {
  defaultSlippage: number;
  autoRefresh: boolean;
  showAdvanced: boolean;
  theme: "light" | "dark" | "system";
}