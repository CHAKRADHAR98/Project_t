use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, TokenAccount, TokenInterface, 
        transfer_checked, mint_to, TransferChecked, MintTo
    },
};
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct WrapTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"bridge_config"],
        bump = bridge_config.bump,
        constraint = bridge_config.is_active @ BridgeError::BridgeNotActive
    )]
    pub bridge_config: Account<'info, BridgeConfig>,
    
    pub restricted_token_mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        token::mint = restricted_token_mint,
        token::authority = user,
        token::token_program = token_2022_program
    )]
    pub user_restricted_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = TokenVault::SPACE,
        seeds = [b"token_vault", restricted_token_mint.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenVault>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = restricted_token_mint,
        associated_token::authority = token_vault,
        associated_token::token_program = token_2022_program
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut, 
        address = bridge_config.bridge_token_mint @ BridgeError::BridgeTokenMintMismatch
    )]
    pub bridge_token_mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = bridge_token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_bridge_token_account: InterfaceAccount<'info, TokenAccount>,
    
    pub token_program: Interface<'info, TokenInterface>,        
    pub token_2022_program: Interface<'info, TokenInterface>,  
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn wrap_tokens(ctx: Context<WrapTokens>, amount: u64) -> Result<()> {
    // Validate the amount is positive first
    require!(amount > 0, BridgeError::InvalidBridgeTokenAmount);
    
    // Get all the data we need before any mutable operations
    let bridge_config_key = ctx.accounts.bridge_config.key();
    let bridge_config_bump = ctx.accounts.bridge_config.bump;
    let bridge_token_mint_key = ctx.accounts.bridge_config.bridge_token_mint;
    let restricted_mint_key = ctx.accounts.restricted_token_mint.key();
    let vault_token_account_key = ctx.accounts.vault_token_account.key();
    let token_vault_bump = ctx.bumps.token_vault;
    let mint_decimals = ctx.accounts.restricted_token_mint.decimals;
    
    // Initialize token vault if this is first wrap for this mint
    let token_vault = &mut ctx.accounts.token_vault;
    if token_vault.restricted_token_mint == Pubkey::default() {
        token_vault.bridge_config = bridge_config_key;
        token_vault.restricted_token_mint = restricted_mint_key;
        token_vault.vault_token_account = vault_token_account_key;
        token_vault.bridge_token_mint = bridge_token_mint_key;
        token_vault.total_locked = 0;
        token_vault.hook_program_id = None;
        token_vault.extensions_bitmap = 0;
        token_vault.bump = token_vault_bump;
        
        msg!("Token vault initialized for mint: {}", restricted_mint_key);
    }
    
    // Transfer Token2022 tokens from user to vault (locks them)
    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_2022_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.user_restricted_token_account.to_account_info(),
                mint: ctx.accounts.restricted_token_mint.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
        mint_decimals,
    )?;
    
    msg!("Locked {} restricted tokens in vault", amount);
    
    // Mint bridge tokens to user (1:1 with locked tokens)
    let bridge_signer_seeds: &[&[u8]] = &[
        b"bridge_config",
        &[bridge_config_bump],
    ];
    
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.bridge_token_mint.to_account_info(),
                to: ctx.accounts.user_bridge_token_account.to_account_info(),
                authority: ctx.accounts.bridge_config.to_account_info(),
            },
            &[bridge_signer_seeds],
        ),
        amount,
    )?;
    
    msg!("Minted {} bridge tokens to user", amount);
    
    // Update vault statistics
    token_vault.total_locked = token_vault.total_locked
        .checked_add(amount)
        .ok_or(BridgeError::MathOverflow)?;
    
    msg!("Wrapped {} tokens. Bridge tokens minted to user.", amount);
    msg!("Total locked in vault: {}", token_vault.total_locked);
    
    Ok(())
}