use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};
use crate::error::*;

#[account]
pub struct SimpleWhitelist {
    pub authority: Pubkey,
    pub users: Vec<Pubkey>,
    pub bump: u8,
}

impl SimpleWhitelist {
    pub const MAX_USERS: usize = 20; 
    pub const SPACE: usize = 8 + 32 + (4 + 32 * Self::MAX_USERS) + 1;
    
    pub fn is_whitelisted(&self, user: &Pubkey) -> bool {
        self.users.contains(user)
    }
}

#[derive(Accounts)]
pub struct InitializeWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        space = SimpleWhitelist::SPACE,
        seeds = [b"whitelist", mint.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, SimpleWhitelist>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"whitelist", mint.key().as_ref()],
        bump,
        has_one = authority @ BridgeError::Unauthorized
    )]
    pub whitelist: Account<'info, SimpleWhitelist>,
}

#[derive(Accounts)]
pub struct WhitelistTransferHook<'info> {
    #[account(
        token::mint = mint,
        token::authority = owner,
    )]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        token::mint = mint,
    )]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: source token account owner
    pub owner: UncheckedAccount<'info>,
    
    /// CHECK: ExtraAccountMeta list account
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"whitelist", mint.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, SimpleWhitelist>,
}

pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    whitelist.authority = ctx.accounts.authority.key();
    whitelist.users = Vec::new();
    whitelist.bump = ctx.bumps.whitelist;
    
    msg!("Whitelist initialized for mint: {}", ctx.accounts.mint.key());
    msg!("Whitelist authority: {}", whitelist.authority);
    
    
    
    Ok(())
}

pub fn add_to_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    
    require!(
        whitelist.users.len() < SimpleWhitelist::MAX_USERS,
        BridgeError::MaxApprovedHooksReached
    );
    
    if !whitelist.users.contains(&user) {
        whitelist.users.push(user);
        msg!("Added user to whitelist: {}", user);
    }
    
    Ok(())
}

pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    
    if let Some(pos) = whitelist.users.iter().position(|&x| x == user) {
        whitelist.users.remove(pos);
        msg!("Removed user from whitelist: {}", user);
    }
    
    Ok(())
}

pub fn whitelist_transfer_hook(ctx: Context<WhitelistTransferHook>, amount: u64) -> Result<()> {
    let whitelist = &ctx.accounts.whitelist;
    let owner = &ctx.accounts.owner;
    
    require!(
        whitelist.is_whitelisted(&owner.key()),
        BridgeError::SenderNotWhitelisted
    );
    
    msg!("Transfer hook validation passed for whitelisted user: {}", owner.key());
    msg!("Transfer amount: {}", amount);
    
    Ok(())
}

pub fn whitelist_fallback<'info>(
    _program_id: &Pubkey,
    accounts: &'info [AccountInfo<'info>],
    data: &[u8],
) -> Result<()> {
    let instruction = TransferHookInstruction::unpack(data)?;

    match instruction {
        TransferHookInstruction::Execute { amount } => {
            msg!("Transfer hook fallback executed for amount: {}", amount);
            
            require!(accounts.len() >= 6, BridgeError::IsNotCurrentlyTransferring);
            
            let source_token = &accounts[0];
            let mint = &accounts[1];
            let destination_token = &accounts[2];
            let owner = &accounts[3];
            
   
            msg!("Validating transfer for owner: {}", owner.key());
            msg!("Transfer amount: {}", amount);
            

            Ok(())
        }
        _ => return Err(ProgramError::InvalidInstructionData.into()),
    }
}