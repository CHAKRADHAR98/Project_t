use anchor_lang::prelude::*;

#[account]
pub struct BridgeConfig {
    pub authority: Pubkey,                    // Bridge program authority
    pub bump: u8,                            // PDA bump seed
    pub bridge_token_mint: Pubkey,           // Standard SPL token mint (for trading)
    pub approved_hook_programs: Vec<Pubkey>, // Whitelisted hook programs
    pub total_locked_amount: u64,            // Total Token2022 tokens locked
    pub is_active: bool,                     // Bridge operational status
}

impl BridgeConfig {
    pub const MAX_APPROVED_HOOKS: usize = 10;
    
    pub const SPACE: usize = 8 + 32 + 1 + 32 + (4 + 32 * Self::MAX_APPROVED_HOOKS) + 8 + 1;
}

#[account]
pub struct TokenVault {
    pub bridge_config: Pubkey,               // Reference to bridge config
    pub restricted_token_mint: Pubkey,       // Original Token2022 mint
    pub vault_token_account: Pubkey,         // ATA holding locked tokens
    pub bridge_token_mint: Pubkey,           // Corresponding bridge token mint
    pub total_locked: u64,                   // Amount of restricted tokens locked
    pub hook_program_id: Option<Pubkey>,     // Transfer hook program (if any)
    pub extensions_bitmap: u64,              // Bitmap of detected extensions
    pub bump: u8,                            // PDA bump seed
}

impl TokenVault {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 32 + 8 + (1 + 32) + 8 + 1;
}

#[account]
pub struct HookMetadata {
    pub vault: Pubkey,                       // Reference to token vault
    pub hook_program_id: Pubkey,             // Hook program address
    pub extra_account_meta_list: Pubkey,     // ExtraAccountMetas PDA
    pub hook_type: HookType,                 // Type of hook for validation
    pub is_active: bool,                     // Hook validation status
    pub bump: u8,                            // PDA bump seed
}

impl HookMetadata {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum HookType {
    Whitelist,
    KYC,
    TransferLimit,
    Custom,
}

pub struct ExtensionFlags;
impl ExtensionFlags {
    pub const TRANSFER_HOOK: u64 = 1 << 0;
    pub const TRANSFER_FEE: u64 = 1 << 1;
    pub const DEFAULT_ACCOUNT_STATE: u64 = 1 << 2;
    pub const NON_TRANSFERABLE: u64 = 1 << 3;
    pub const METADATA: u64 = 1 << 4;
}
