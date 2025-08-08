use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct UpdateBridgeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bridge_config"],
        bump = bridge_config.bump,
        has_one = authority @ BridgeError::Unauthorized
    )]
    pub bridge_config: Account<'info, BridgeConfig>,
}

pub fn add_approved_hook_program(
    ctx: Context<UpdateBridgeConfig>, 
    hook_program_id: Pubkey
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    
    require!(
        bridge_config.approved_hook_programs.len() < BridgeConfig::MAX_APPROVED_HOOKS,
        BridgeError::MaxApprovedHooksReached
    );
    
    require!(
        !bridge_config.approved_hook_programs.contains(&hook_program_id),
        BridgeError::HookProgramAlreadyApproved
    );
    
    bridge_config.approved_hook_programs.push(hook_program_id);
    
    msg!("Added approved hook program: {}", hook_program_id);
    msg!("Total approved hook programs: {}", bridge_config.approved_hook_programs.len());
    
    Ok(())
}

pub fn remove_approved_hook_program(
    ctx: Context<UpdateBridgeConfig>, 
    hook_program_id: Pubkey
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    
    if let Some(pos) = bridge_config.approved_hook_programs.iter().position(|&x| x == hook_program_id) {
        bridge_config.approved_hook_programs.remove(pos);
        msg!("Removed approved hook program: {}", hook_program_id);
    } else {
        msg!("Hook program not found in approved list: {}", hook_program_id);
    }
    
    Ok(())
}

pub fn toggle_bridge_status(ctx: Context<UpdateBridgeConfig>) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    
    bridge_config.is_active = !bridge_config.is_active;
    
    msg!("Bridge status changed to: {}", bridge_config.is_active);
    
    Ok(())
}

pub fn update_bridge_authority(
    ctx: Context<UpdateBridgeConfig>, 
    new_authority: Pubkey
) -> Result<()> {
    let bridge_config = &mut ctx.accounts.bridge_config;
    
    let old_authority = bridge_config.authority;
    bridge_config.authority = new_authority;
    
    msg!("Bridge authority updated from {} to {}", old_authority, new_authority);
    
    Ok(())
}