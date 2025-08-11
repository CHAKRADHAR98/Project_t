use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::TransferHookInstruction;
use crate::error::*;

#[account]
pub struct SimpleWhitelist {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub users: Vec<Pubkey>,
    pub is_active: bool,
    pub bump: u8,
}

impl SimpleWhitelist {
    pub const MAX_USERS: usize = 50;
    pub const SPACE: usize = 8 + 32 + 32 + (4 + 32 * Self::MAX_USERS) + 1 + 1;
    
    pub fn is_whitelisted(&self, user: &Pubkey) -> bool {
        self.is_active && self.users.contains(user)
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
    
    /// CHECK: ExtraAccountMeta list account - initialized in this instruction
    #[account(
        init,
        payer = authority,
        space = ExtraAccountMetaList::size_of(1)?,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
    
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
        has_one = authority @ BridgeError::Unauthorized,
        has_one = mint
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
        bump,
        has_one = mint
    )]
    pub whitelist: Account<'info, SimpleWhitelist>,
}

impl<'info> InitializeWhitelist<'info> {
    pub fn extra_account_metas() -> Result<Vec<ExtraAccountMeta>> {
        Ok(vec![
            ExtraAccountMeta::new_with_seeds(
                &[Seed::Literal {
                    bytes: "whitelist".as_bytes().to_vec(),
                }, Seed::AccountKey { index: 1 }], // mint account index
                false, // is_signer
                false, // is_writable
            )?,
        ])
    }
}

pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    whitelist.authority = ctx.accounts.authority.key();
    whitelist.mint = ctx.accounts.mint.key();
    whitelist.users = Vec::new();
    whitelist.is_active = true;
    whitelist.bump = ctx.bumps.whitelist;
    
    msg!("Whitelist initialized for mint: {}", ctx.accounts.mint.key());
    msg!("Whitelist authority: {}", whitelist.authority);
    msg!("Whitelist is active: {}", whitelist.is_active);
    
    let account_metas = InitializeWhitelist::extra_account_metas()?;
    
   
    let data = &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<spl_transfer_hook_interface::instruction::ExecuteInstruction>(
        data,
        &account_metas,
    )?;
    
    msg!("ExtraAccountMeta list initialized with {} accounts", account_metas.len());
    
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
        msg!("Total whitelisted users: {}", whitelist.users.len());
    } else {
        msg!("User already whitelisted: {}", user);
    }
    
    Ok(())
}

pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    
    if let Some(pos) = whitelist.users.iter().position(|&x| x == user) {
        whitelist.users.remove(pos);
        msg!("Removed user from whitelist: {}", user);
        msg!("Remaining whitelisted users: {}", whitelist.users.len());
    } else {
        msg!("User not found in whitelist: {}", user);
    }
    
    Ok(())
}

pub fn toggle_whitelist_status(ctx: Context<ManageWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    whitelist.is_active = !whitelist.is_active;
    
    msg!("Whitelist status changed to: {}", whitelist.is_active);
    
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
    msg!("From: {} To: {}", 
         ctx.accounts.source_token.key(), 
         ctx.accounts.destination_token.key());
    
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
            let _extra_account_meta_list = &accounts[4];
            let whitelist = &accounts[5];
            
            msg!("Source token: {}", source_token.key());
            msg!("Mint: {}", mint.key());
            msg!("Destination token: {}", destination_token.key());
            msg!("Owner: {}", owner.key());
            
            let whitelist_data = whitelist.try_borrow_data()?;
            let whitelist_account = SimpleWhitelist::try_deserialize(&mut &whitelist_data[8..])?;
            
            require!(
                whitelist_account.is_whitelisted(&owner.key()),
                BridgeError::SenderNotWhitelisted
            );
            
            msg!("Fallback transfer hook validation passed for user: {}", owner.key());
            
            Ok(())
        }
        TransferHookInstruction::InitializeExtraAccountMetaList { 
            extra_account_metas 
        } => {
            msg!("Initializing ExtraAccountMeta list in fallback");
            
            require!(accounts.len() >= 1, BridgeError::IsNotCurrentlyTransferring);
            
            let extra_account_meta_list = &accounts[0];
            
            ExtraAccountMetaList::init::<spl_transfer_hook_interface::instruction::ExecuteInstruction>(
                &mut extra_account_meta_list.try_borrow_mut_data()?,
                &extra_account_metas,
            )?;
            
            msg!("ExtraAccountMeta list initialized with {} metas", extra_account_metas.len());
            Ok(())
        }
        TransferHookInstruction::UpdateExtraAccountMetaList { 
            extra_account_metas 
        } => {
            msg!("Updating ExtraAccountMeta list in fallback");
            
            require!(accounts.len() >= 1, BridgeError::IsNotCurrentlyTransferring);
            
            let extra_account_meta_list = &accounts[0];
            
            ExtraAccountMetaList::update::<spl_transfer_hook_interface::instruction::ExecuteInstruction>(
                &mut extra_account_meta_list.try_borrow_mut_data()?,
                &extra_account_metas,
            )?;
            
            msg!("ExtraAccountMeta list updated with {} metas", extra_account_metas.len());
            Ok(())
        }
    }
}