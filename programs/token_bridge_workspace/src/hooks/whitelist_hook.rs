// programs/token_bridge/src/hooks/whitelist_hook.rs
use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount},
};
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

#[derive(Accounts)]
pub struct InitializeWhitelistHookExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
    
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = payer,
        space = WhitelistConfig::SPACE,
        seeds = [b"whitelist", payer.key().as_ref()],
        bump
    )]
    pub whitelist_config: Account<'info, WhitelistConfig>,
    
    pub system_program: Program<'info, System>,
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
    
    /// CHECK: ExtraAccountMetaList Account
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"whitelist", owner.key().as_ref()],
        bump
    )]
    pub whitelist_config: Account<'info, WhitelistConfig>,
}

#[derive(Accounts)]
pub struct ManageWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"whitelist", authority.key().as_ref()],
        bump,
    )]
    pub whitelist_config: Account<'info, WhitelistConfig>,
}

#[account]
pub struct WhitelistConfig {
    pub authority: Pubkey,
    pub users: Vec<Pubkey>,
}

impl WhitelistConfig {
    pub const MAX_USERS: usize = 100;
    pub const SPACE: usize = 8 + 32 + (4 + 32 * Self::MAX_USERS);
    
    pub fn is_whitelisted(&self, user: &Pubkey) -> bool {
        self.users.contains(user)
    }
}

// Whitelist hook functions (to be called by main program)
pub fn initialize_whitelist_extra_account_meta_list(
    ctx: Context<InitializeWhitelistHookExtraAccountMetaList>,
) -> Result<()> {
    // Define extra accounts needed for whitelist validation
    let account_metas = vec![
        // Whitelist account for sender validation
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: "whitelist".as_bytes().to_vec(),
                },
                Seed::AccountKey { index: 3 }, // owner account index
            ],
            false, // is_signer
            false, // is_writable (read-only for validation)
        )?,
    ];

    // Initialize the account data
    ExtraAccountMetaList::init::<ExecuteInstruction>(
        &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
        &account_metas,
    )?;

    msg!("Whitelist hook extra account meta list initialized");
    
    Ok(())
}

pub fn whitelist_transfer_hook(ctx: Context<WhitelistTransferHook>, amount: u64) -> Result<()> {
    // Validate that this is being called during a transfer
    assert_is_transferring(&ctx)?;
    
    let whitelist = &ctx.accounts.whitelist_config;
    let owner = &ctx.accounts.owner;
    
    // Check if sender is whitelisted
    require!(
        whitelist.is_whitelisted(&owner.key()),
        WhitelistHookError::SenderNotWhitelisted
    );
    
    msg!("Transfer hook validation passed for whitelisted user: {}", owner.key());
    msg!("Transfer amount: {}", amount);
    
    Ok(())
}

pub fn add_to_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist_config;
    
    if !whitelist.users.contains(&user) {
        whitelist.users.push(user);
        msg!("Added user to whitelist: {}", user);
    }
    
    Ok(())
}

pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, user: Pubkey) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist_config;
    
    if let Some(pos) = whitelist.users.iter().position(|&x| x == user) {
        whitelist.users.remove(pos);
        msg!("Removed user from whitelist: {}", user);
    }
    
    Ok(())
}

// Fallback instruction handler for transfer hook interface
pub fn whitelist_fallback<'info>(
    program_id: &Pubkey,
    accounts: &'info [AccountInfo<'info>],
    data: &[u8],
) -> Result<()> {
    let instruction = TransferHookInstruction::unpack(data)?;

    match instruction {
        TransferHookInstruction::Execute { amount } => {
            // Simple validation - check if we have enough accounts
            require!(accounts.len() >= 6, WhitelistHookError::IsNotCurrentlyTransferring);
            
            // For now, just log the transfer - full hook validation can be added later
            msg!("Transfer hook executed for amount: {}", amount);
            Ok(())
        }
        _ => return Err(ProgramError::InvalidInstructionData.into()),
    }
}

#[error_code]
pub enum WhitelistHookError {
    #[msg("Sender is not whitelisted")]
    SenderNotWhitelisted,
    
    #[msg("The token is not currently transferring")]
    IsNotCurrentlyTransferring,
}

// Helper function to ensure hook is called during transfer
fn assert_is_transferring(ctx: &Context<WhitelistTransferHook>) -> Result<()> {
    use anchor_spl::token_2022::spl_token_2022::{
        extension::{transfer_hook::TransferHookAccount, BaseStateWithExtensions, PodStateWithExtensions},
        pod::PodAccount,
    };
    
    let source_token_info = ctx.accounts.source_token.to_account_info();
    let account_data_ref = source_token_info.try_borrow_data()?;
    let account = PodStateWithExtensions::<PodAccount>::unpack(*account_data_ref)?;
    let account_extension = account.get_extension::<TransferHookAccount>()?;

    if !bool::from(account_extension.transferring) {
        return err!(WhitelistHookError::IsNotCurrentlyTransferring);
    }

    Ok(())
}