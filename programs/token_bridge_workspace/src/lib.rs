use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;

declare_id!("Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw");

#[program]
pub mod token_bridge_workspace {
    use super::*;

    pub fn initialize_bridge(ctx: Context<InitializeBridge>) -> Result<()> {
        instructions::initialize_bridge(ctx)
    }

    pub fn create_bridge_token_mint(ctx: Context<CreateBridgeTokenMint>) -> Result<()> {
        instructions::create_bridge_token_mint(ctx)
    }

    pub fn wrap_tokens(ctx: Context<WrapTokens>, amount: u64) -> Result<()> {
        instructions::wrap_tokens(ctx, amount)
    }

    pub fn unwrap_tokens(ctx: Context<UnwrapTokens>, amount: u64) -> Result<()> {
        instructions::unwrap_tokens(ctx, amount)
    }

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

    pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>) -> Result<()> {
        instructions::initialize_whitelist(ctx)
    }

    pub fn add_to_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
        instructions::add_to_whitelist(ctx, user)
    }

    pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
        instructions::remove_from_whitelist(ctx, user)
    }

    pub fn toggle_whitelist_status(ctx: Context<ManageWhitelist>) -> Result<()> {
        instructions::toggle_whitelist_status(ctx)
    }

    pub fn whitelist_transfer_hook(ctx: Context<WhitelistTransferHook>, amount: u64) -> Result<()> {
        instructions::whitelist_transfer_hook(ctx, amount)
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        instructions::whitelist_fallback(program_id, accounts, data)
    }
}