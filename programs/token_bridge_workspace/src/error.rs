use anchor_lang::prelude::*;

#[error_code]
pub enum BridgeError {
    #[msg("Bridge is not active")]
    BridgeNotActive,
    
    #[msg("Transfer hook program is not approved")]
    UnapprovedHookProgram,
    
    #[msg("Token is non-transferable and cannot be bridged")]
    NonTransferableToken,
    
    #[msg("Insufficient locked tokens for unwrap")]
    InsufficientLockedTokens,
    
    #[msg("Invalid token vault for this mint")]
    InvalidTokenVault,
    
    #[msg("Bridge token mint mismatch")]
    BridgeTokenMintMismatch,
    
    #[msg("Maximum approved hook programs reached")]
    MaxApprovedHooksReached,
    
    #[msg("Hook program already approved")]
    HookProgramAlreadyApproved,
    
    #[msg("Unauthorized: only bridge authority can perform this action")]
    Unauthorized,
    
    #[msg("Invalid extension configuration")]
    InvalidExtensionConfig,
    
    #[msg("Token vault already exists for this mint")]
    TokenVaultAlreadyExists,
    
    #[msg("Transfer fee calculation failed")]
    TransferFeeCalculationFailed,
    
    #[msg("Hook validation failed during unwrap")]
    HookValidationFailed,
    
    #[msg("Invalid bridge token amount")]
    InvalidBridgeTokenAmount,
    
    #[msg("Math overflow error")]
    MathOverflow,
    
    #[msg("Sender is not whitelisted")]
    SenderNotWhitelisted,
    
    #[msg("The token is not currently transferring")]
    IsNotCurrentlyTransferring,
}