use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct InitializeBridge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = BridgeConfig::SPACE,
        seeds = [b"bridge_config"],
        bump
    )]
    pub bridge_config: Account<'info, BridgeConfig>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_bridge(ctx: Context<InitializeBridge>) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    
    bridge_config.authority = ctx.accounts.authority.key();
    bridge_config.bump = ctx.bumps.bridge_config;
    bridge_config.bridge_token_mint = Pubkey::default(); 
    bridge_config.approved_hook_programs = Vec::new();
    bridge_config.total_locked_amount = 0;
    bridge_config.is_active = true;
    
    msg!("Bridge initialized with authority: {}", bridge_config.authority);
    
    Ok(())
}