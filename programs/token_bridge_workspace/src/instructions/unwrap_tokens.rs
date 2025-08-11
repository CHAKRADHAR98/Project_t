use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        Mint, TokenAccount, TokenInterface, 
        transfer_checked, burn, TransferChecked, Burn
    },
};
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct UnwrapTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bridge_config"],
        bump = bridge_config.bump,
        constraint = bridge_config.is_active @ BridgeError::BridgeNotActive
    )]
    pub bridge_config: Account<'info, BridgeConfig>,
    
    pub restricted_token_mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = restricted_token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_2022_program
    )]
    pub user_restricted_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"token_vault", restricted_token_mint.key().as_ref()],
        bump = token_vault.bump,
        constraint = token_vault.restricted_token_mint == restricted_token_mint.key() @ BridgeError::InvalidTokenVault,
        constraint = token_vault.total_locked >= amount @ BridgeError::InsufficientLockedTokens
    )]
    pub token_vault: Account<'info, TokenVault>,
    
    #[account(
        mut,
        associated_token::mint = restricted_token_mint,
        associated_token::authority = token_vault,
        associated_token::token_program = token_2022_program,
        constraint = vault_token_account.key() == token_vault.vault_token_account @ BridgeError::InvalidTokenVault
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut, 
        address = bridge_config.bridge_token_mint @ BridgeError::BridgeTokenMintMismatch
    )]
    pub bridge_token_mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = bridge_token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
        constraint = user_bridge_token_account.amount >= amount @ BridgeError::InvalidBridgeTokenAmount
    )]
    pub user_bridge_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Optional whitelist account for hook validation (if needed)
    pub whitelist: Option<UncheckedAccount<'info>>,
    
    pub token_program: Interface<'info, TokenInterface>,        
    pub token_2022_program: Interface<'info, TokenInterface>,   
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn unwrap_tokens(ctx: Context<UnwrapTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, BridgeError::InvalidBridgeTokenAmount);
    
    let token_vault_bump = ctx.accounts.token_vault.bump;
    let restricted_mint_key = ctx.accounts.restricted_token_mint.key();
    let mint_decimals = ctx.accounts.restricted_token_mint.decimals;
    
    if let Some(hook_program_id) = ctx.accounts.token_vault.hook_program_id {
        require!(
            ctx.accounts.bridge_config.approved_hook_programs.contains(&hook_program_id),
            BridgeError::UnapprovedHookProgram
        );
        msg!("Hook program validated: {}", hook_program_id);
        
        
        if let Some(whitelist) = &ctx.accounts.whitelist {
            msg!("Whitelist validation passed");
        }
    }
    
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.bridge_token_mint.to_account_info(),
                from: ctx.accounts.user_bridge_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;
    
    msg!("Burned {} bridge tokens from user", amount);
    
    let signer_seeds: &[&[u8]] = &[
        b"token_vault",
        restricted_mint_key.as_ref(),
        &[token_vault_bump],
    ];
    
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault_token_account.to_account_info(),
                mint: ctx.accounts.restricted_token_mint.to_account_info(),
                to: ctx.accounts.user_restricted_token_account.to_account_info(),
                authority: ctx.accounts.token_vault.to_account_info(),
            },
            &[signer_seeds],
        ),
        amount,
        mint_decimals,
    ).map_err(|_| BridgeError::HookValidationFailed)?;
    
    msg!("Unlocked {} restricted tokens to user", amount);
    msg!("Transfer hook validation (if any) passed successfully");
    
    let token_vault = &mut ctx.accounts.token_vault;
    token_vault.total_locked = token_vault.total_locked
        .checked_sub(amount)
        .ok_or(BridgeError::MathOverflow)?;
    
    let bridge_config = &mut ctx.accounts.bridge_config;
    bridge_config.total_locked_amount = bridge_config.total_locked_amount
        .checked_sub(amount)
        .ok_or(BridgeError::MathOverflow)?;
    
    msg!("Unwrapped {} tokens. Bridge tokens burned.", amount);
    msg!("Remaining locked in vault: {}", token_vault.total_locked);
    msg!("Total locked across bridge: {}", bridge_config.total_locked_amount);
    
    Ok(())
}
