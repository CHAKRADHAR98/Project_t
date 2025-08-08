// src/lib/anchor-setup.ts
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

// Simple IDL object - no const assertion
export const IDL = {
  "address": "Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw",
  "metadata": {
    "name": "tokenBridgeWorkspace",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addApprovedHookProgram",
      "discriminator": [31, 196, 45, 58, 225, 80, 46, 77],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["bridgeConfig"]
        },
        {
          "name": "bridgeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "hookProgramId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addToWhitelist",
      "discriminator": [157, 211, 52, 54, 144, 81, 5, 55],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["whitelist"]
        },
        {
          "name": "mint"
        },
        {
          "name": "whitelist",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [119, 104, 105, 116, 101, 108, 105, 115, 116]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "user",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createBridgeTokenMint",
      "discriminator": [197, 42, 209, 137, 129, 254, 229, 172],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["bridgeConfig"]
        },
        {
          "name": "bridgeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        },
        {
          "name": "bridgeTokenMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeBridge",
      "discriminator": [6, 173, 152, 229, 35, 112, 127, 151],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "bridgeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeWhitelist",
      "discriminator": [223, 228, 11, 219, 112, 174, 108, 18],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "whitelist",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [119, 104, 105, 116, 101, 108, 105, 115, 116]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "removeApprovedHookProgram",
      "discriminator": [71, 13, 68, 145, 135, 114, 19, 77],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["bridgeConfig"]
        },
        {
          "name": "bridgeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "hookProgramId",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeFromWhitelist",
      "discriminator": [7, 144, 216, 239, 243, 236, 193, 235],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["whitelist"]
        },
        {
          "name": "mint"
        },
        {
          "name": "whitelist",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [119, 104, 105, 116, 101, 108, 105, 115, 116]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "user",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "toggleBridgeStatus",
      "discriminator": [156, 238, 111, 48, 67, 196, 116, 155],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["bridgeConfig"]
        },
        {
          "name": "bridgeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "unwrapTokens",
      "discriminator": [17, 121, 3, 250, 67, 105, 232, 113],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "bridgeConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        },
        {
          "name": "restrictedTokenMint"
        },
        {
          "name": "userRestrictedTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "restrictedTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89]
            }
          }
        },
        {
          "name": "tokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [116, 111, 107, 101, 110, 95, 118, 97, 117, 108, 116]
              },
              {
                "kind": "account",
                "path": "restrictedTokenMint"
              }
            ]
          }
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "tokenVault"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "restrictedTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89]
            }
          }
        },
        {
          "name": "bridgeTokenMint",
          "writable": true
        },
        {
          "name": "userBridgeTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "bridgeTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateBridgeAuthority",
      "discriminator": [126, 176, 226, 17, 50, 68, 117, 193],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": ["bridgeConfig"]
        },
        {
          "name": "bridgeConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "whitelistTransferHook",
      "discriminator": [124, 182, 48, 78, 57, 220, 170, 166],
      "accounts": [
        {
          "name": "sourceToken"
        },
        {
          "name": "mint"
        },
        {
          "name": "destinationToken"
        },
        {
          "name": "owner"
        },
        {
          "name": "extraAccountMetaList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [101, 120, 116, 114, 97, 45, 97, 99, 99, 111, 117, 110, 116, 45, 109, 101, 116, 97, 115]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "whitelist",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [119, 104, 105, 116, 101, 108, 105, 115, 116]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "wrapTokens",
      "discriminator": [244, 137, 57, 251, 232, 224, 54, 14],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "bridgeConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 114, 105, 100, 103, 101, 95, 99, 111, 110, 102, 105, 103]
              }
            ]
          }
        },
        {
          "name": "restrictedTokenMint"
        },
        {
          "name": "userRestrictedTokenAccount",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [116, 111, 107, 101, 110, 95, 118, 97, 117, 108, 116]
              },
              {
                "kind": "account",
                "path": "restrictedTokenMint"
              }
            ]
          }
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "tokenVault"
              },
              {
                "kind": "account",
                "path": "token2022Program"
              },
              {
                "kind": "account",
                "path": "restrictedTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89]
            }
          }
        },
        {
          "name": "bridgeTokenMint",
          "writable": true
        },
        {
          "name": "userBridgeTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "bridgeTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "token2022Program"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bridgeConfig",
      "discriminator": [40, 206, 51, 233, 246, 40, 178, 85]
    },
    {
      "name": "simpleWhitelist",
      "discriminator": [69, 202, 246, 224, 255, 143, 157, 186]
    },
    {
      "name": "tokenVault",
      "discriminator": [121, 7, 84, 254, 151, 228, 43, 144]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "bridgeNotActive",
      "msg": "Bridge is not active"
    },
    {
      "code": 6001,
      "name": "unapprovedHookProgram",
      "msg": "Transfer hook program is not approved"
    },
    {
      "code": 6002,
      "name": "nonTransferableToken",
      "msg": "Token is non-transferable and cannot be bridged"
    },
    {
      "code": 6003,
      "name": "insufficientLockedTokens",
      "msg": "Insufficient locked tokens for unwrap"
    },
    {
      "code": 6004,
      "name": "invalidTokenVault",
      "msg": "Invalid token vault for this mint"
    },
    {
      "code": 6005,
      "name": "bridgeTokenMintMismatch",
      "msg": "Bridge token mint mismatch"
    },
    {
      "code": 6006,
      "name": "maxApprovedHooksReached",
      "msg": "Maximum approved hook programs reached"
    },
    {
      "code": 6007,
      "name": "hookProgramAlreadyApproved",
      "msg": "Hook program already approved"
    },
    {
      "code": 6008,
      "name": "unauthorized",
      "msg": "Unauthorized: only bridge authority can perform this action"
    },
    {
      "code": 6009,
      "name": "invalidExtensionConfig",
      "msg": "Invalid extension configuration"
    },
    {
      "code": 6010,
      "name": "tokenVaultAlreadyExists",
      "msg": "Token vault already exists for this mint"
    },
    {
      "code": 6011,
      "name": "transferFeeCalculationFailed",
      "msg": "Transfer fee calculation failed"
    },
    {
      "code": 6012,
      "name": "hookValidationFailed",
      "msg": "Hook validation failed during unwrap"
    },
    {
      "code": 6013,
      "name": "invalidBridgeTokenAmount",
      "msg": "Invalid bridge token amount"
    },
    {
      "code": 6014,
      "name": "mathOverflow",
      "msg": "Math overflow error"
    },
    {
      "code": 6015,
      "name": "senderNotWhitelisted",
      "msg": "Sender is not whitelisted"
    },
    {
      "code": 6016,
      "name": "isNotCurrentlyTransferring",
      "msg": "The token is not currently transferring"
    }
  ],
  "types": [
    {
      "name": "bridgeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "bridgeTokenMint",
            "type": "pubkey"
          },
          {
            "name": "approvedHookPrograms",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "totalLockedAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "simpleWhitelist",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "users",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tokenVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bridgeConfig",
            "type": "pubkey"
          },
          {
            "name": "restrictedTokenMint",
            "type": "pubkey"
          },
          {
            "name": "vaultTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "bridgeTokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalLocked",
            "type": "u64"
          },
          {
            "name": "hookProgramId",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "extensionsBitmap",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
} as const;

// Program ID from your deployment
export const PROGRAM_ID = new PublicKey("Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw");

// Fix: Correct function signature - wallet parameter, not provider
export function getProgram(connection: Connection, wallet: AnchorWallet): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  
  return new Program(IDL as Idl, PROGRAM_ID, provider);
}

// Account types for TypeScript
export interface BridgeConfig {
  authority: PublicKey;
  bump: number;
  bridgeTokenMint: PublicKey;
  approvedHookPrograms: PublicKey[];
  totalLockedAmount: BN;
  isActive: boolean;
}

export interface TokenVault {
  bridgeConfig: PublicKey;
  restrictedTokenMint: PublicKey;
  vaultTokenAccount: PublicKey;
  bridgeTokenMint: PublicKey;
  totalLocked: BN;
  hookProgramId: PublicKey | null;
  extensionsBitmap: BN;
  bump: number;
}

export interface SimpleWhitelist {
  authority: PublicKey;
  users: PublicKey[];
  bump: number;
}

// Helper functions for type conversion
export function convertBridgeConfig(raw: any): BridgeConfig {
  return {
    authority: raw.authority,
    bump: raw.bump,
    bridgeTokenMint: raw.bridgeTokenMint,
    approvedHookPrograms: raw.approvedHookPrograms,
    totalLockedAmount: raw.totalLockedAmount,
    isActive: raw.isActive,
  };
}

export function convertTokenVault(raw: any): TokenVault {
  return {
    bridgeConfig: raw.bridgeConfig,
    restrictedTokenMint: raw.restrictedTokenMint,
    vaultTokenAccount: raw.vaultTokenAccount,
    bridgeTokenMint: raw.bridgeTokenMint,
    totalLocked: raw.totalLocked,
    hookProgramId: raw.hookProgramId,
    extensionsBitmap: raw.extensionsBitmap,
    bump: raw.bump,
  };
}

export function convertSimpleWhitelist(raw: any): SimpleWhitelist {
  return {
    authority: raw.authority,
    users: raw.users,
    bump: raw.bump,
  };
}

// Program error types
export enum BridgeError {
  BridgeNotActive = 6000,
  UnapprovedHookProgram = 6001,
  NonTransferableToken = 6002,
  InsufficientLockedTokens = 6003,
  InvalidTokenVault = 6004,
  BridgeTokenMintMismatch = 6005,
  MaxApprovedHooksReached = 6006,
  HookProgramAlreadyApproved = 6007,
  Unauthorized = 6008,
  InvalidExtensionConfig = 6009,
  TokenVaultAlreadyExists = 6010,
  TransferFeeCalculationFailed = 6011,
  HookValidationFailed = 6012,
  InvalidBridgeTokenAmount = 6013,
  MathOverflow = 6014,
  SenderNotWhitelisted = 6015,
  IsNotCurrentlyTransferring = 6016,
}

// Error message mapping
export const ERROR_MESSAGES: Record<BridgeError, string> = {
  [BridgeError.BridgeNotActive]: "Bridge is not active",
  [BridgeError.UnapprovedHookProgram]: "Transfer hook program is not approved",
  [BridgeError.NonTransferableToken]: "Token is non-transferable and cannot be bridged",
  [BridgeError.InsufficientLockedTokens]: "Insufficient locked tokens for unwrap",
  [BridgeError.InvalidTokenVault]: "Invalid token vault for this mint",
  [BridgeError.BridgeTokenMintMismatch]: "Bridge token mint mismatch",
  [BridgeError.MaxApprovedHooksReached]: "Maximum approved hook programs reached",
  [BridgeError.HookProgramAlreadyApproved]: "Hook program already approved",
  [BridgeError.Unauthorized]: "Unauthorized: only bridge authority can perform this action",
  [BridgeError.InvalidExtensionConfig]: "Invalid extension configuration",
  [BridgeError.TokenVaultAlreadyExists]: "Token vault already exists for this mint",
  [BridgeError.TransferFeeCalculationFailed]: "Transfer fee calculation failed",
  [BridgeError.HookValidationFailed]: "Hook validation failed during unwrap",
  [BridgeError.InvalidBridgeTokenAmount]: "Invalid bridge token amount",
  [BridgeError.MathOverflow]: "Math overflow error",
  [BridgeError.SenderNotWhitelisted]: "Sender is not whitelisted",
  [BridgeError.IsNotCurrentlyTransferring]: "The token is not currently transferring",
};

// Helper function to get error message
export function getErrorMessage(error: any): string {
  if (error?.code && error.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error.code as BridgeError];
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return "Unknown error occurred";
}