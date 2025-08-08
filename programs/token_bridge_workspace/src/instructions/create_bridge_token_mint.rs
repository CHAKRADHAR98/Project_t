use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct CreateBridgeTokenMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bridge_config"],
        bump = bridge_config.bump,
        has_one = authority @ BridgeError::Unauthorized
    )]
    pub bridge_config: Account<'info, BridgeConfig>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9, 
        mint::authority = bridge_config, 
        mint::token_program = token_program
    )]
    pub bridge_token_mint: InterfaceAccount<'info, Mint>,
    
    pub token_program: Interface<'info, TokenInterface>, 
    pub system_program: Program<'info, System>,
}

pub fn create_bridge_token_mint(ctx: Context<CreateBridgeTokenMint>) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    
    bridge_config.bridge_token_mint = ctx.accounts.bridge_token_mint.key();
    
    msg!("Bridge token mint created: {}", bridge_config.bridge_token_mint);
    msg!("Bridge token is standard SPL token - compatible with all AMMs");
    
    Ok(())
}