// programs/token_bridge_workspace/src/lib.rs
use anchor_lang::prelude::*;
use spl_transfer_hook_interface::instruction::TransferHookInstruction;

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;

declare_id!("3Ld5LRkUTu85RDU3kfPKQQsDJZXQEBMJA2AYpLCddP4f");

#[program]
pub mod token_bridge_workspace {
    use super::*;

    // Bridge Configuration
    pub fn initialize_bridge(ctx: Context<InitializeBridge>) -> Result<()> {
        instructions::initialize_bridge(ctx)
    }

    // Core Bridge Operations
    pub fn wrap_tokens(ctx: Context<WrapTokens>, amount: u64) -> Result<()> {
        instructions::wrap_tokens(ctx, amount)
    }

    pub fn unwrap_tokens(ctx: Context<UnwrapTokens>, amount: u64) -> Result<()> {
        instructions::unwrap_tokens(ctx, amount)
    }

    // Admin Operations
    pub fn add_approved_hook_program(
        ctx: Context<UpdateBridgeConfig>, 
        hook_program_id: Pubkey
    ) -> Result<()> {
        instructions::add_approved_hook_program(ctx, hook_program_id)
    }

    pub fn remove_approved_hook_program(
        ctx: Context<UpdateBridgeConfig>, 
        hook_program_id: Pubkey
    ) -> Result<()> {
        instructions::remove_approved_hook_program(ctx, hook_program_id)
    }

    pub fn toggle_bridge_status(ctx: Context<UpdateBridgeConfig>) -> Result<()> {
        instructions::toggle_bridge_status(ctx)
    }

    pub fn update_bridge_authority(
        ctx: Context<UpdateBridgeConfig>, 
        new_authority: Pubkey
    ) -> Result<()> {
        instructions::update_bridge_authority(ctx, new_authority)
    }

    pub fn create_bridge_token_mint(ctx: Context<CreateBridgeTokenMint>) -> Result<()> {
        instructions::create_bridge_token_mint(ctx)
    }

    // Whitelist Hook Operations
    pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>) -> Result<()> {
        instructions::initialize_whitelist(ctx)
    }

    pub fn add_to_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
        instructions::add_to_whitelist(ctx, user)
    }

    pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
        instructions::remove_from_whitelist(ctx, user)
    }

    pub fn whitelist_transfer_hook(ctx: Context<WhitelistTransferHook>, amount: u64) -> Result<()> {
        instructions::whitelist_transfer_hook(ctx, amount)
    }

    // Fallback for transfer hook interface
    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        instructions::whitelist_fallback(program_id, accounts, data)
    }
}