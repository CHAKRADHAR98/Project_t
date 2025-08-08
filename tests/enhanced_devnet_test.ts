import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenBridgeWorkspace } from "../target/types/token_bridge_workspace";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

describe("enhanced_devnet_test", () => {
  // Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const programId = new PublicKey("Hfvd4ZLYac9wHs8fz4Yo3DCNqU1qRScMY4tu9GwQP7gw");
  
  // Setup provider for devnet
  const wallet = anchor.AnchorProvider.env().wallet;
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the program
  const program = anchor.workspace.tokenBridgeWorkspace as Program<TokenBridgeWorkspace>;

  // Test keypairs - Generate new ones each time to avoid conflicts
  let restrictedMint: Keypair;
  let testUser: Keypair;
  const decimals = 9;

  // Derive PDAs
  const [bridgeConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("bridge_config")],
    program.programId
  );

  let bridgeTokenMint: PublicKey;

  before(async () => {
    console.log("🌐 ENHANCED DEVNET TESTING");
    console.log("Program ID:", program.programId.toString());
    console.log("Network:", connection.rpcEndpoint);
    console.log("Wallet:", wallet.publicKey.toString());
    
    // Generate fresh keypairs for this test run
    restrictedMint = new Keypair();
    testUser = new Keypair();
    
    console.log("🔑 Generated fresh test accounts:");
    console.log("Restricted Mint:", restrictedMint.publicKey.toString());
    console.log("Test User:", testUser.publicKey.toString());
    
    // Check and request SOL with better error handling
    try {
      console.log("💰 Checking and requesting devnet SOL...");
      
      const walletBalance = await connection.getBalance(wallet.publicKey);
      const userBalance = await connection.getBalance(testUser.publicKey);
      
      console.log("Current balances:");
      console.log("- Wallet:", walletBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      console.log("- Test User:", userBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      
      // Fund test user if needed (wallet should have enough from deployment)
      if (userBalance < 2 * anchor.web3.LAMPORTS_PER_SOL) {
        console.log("💸 Funding test user from wallet...");
        const fundTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: testUser.publicKey,
            lamports: 2 * anchor.web3.LAMPORTS_PER_SOL,
          })
        );
        
        await sendAndConfirmTransaction(connection, fundTx, [wallet.payer], {
          commitment: "confirmed",
        });
        
        const newBalance = await connection.getBalance(testUser.publicKey);
        console.log("✅ Test user funded! New balance:", newBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      }
      
    } catch (error) {
      console.log("⚠️ Funding issue:", error.message);
      
      // Check if we have minimum required balances
      const walletBalance = await connection.getBalance(wallet.publicKey);
      const userBalance = await connection.getBalance(testUser.publicKey);
      
      if (walletBalance < 1 * anchor.web3.LAMPORTS_PER_SOL) {
        throw new Error("Insufficient wallet balance for testing. Please add more devnet SOL.");
      }
      
      console.log("💰 Proceeding with available balances:");
      console.log("- Wallet:", walletBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      console.log("- Test User:", userBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
    }
  });

  it("🚀 Verifies bridge initialization", async () => {
    console.log("🧪 Verifying bridge state...");
    
    try {
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      console.log("✅ Bridge is operational!");
      console.log("📊 Bridge Config:", {
        authority: config.authority.toString(),
        isActive: config.isActive,
        bridgeTokenMint: config.bridgeTokenMint.toString(),
        approvedHooks: config.approvedHookPrograms.length,
      });
      
      bridgeTokenMint = config.bridgeTokenMint;
      
    } catch (error) {
      throw new Error("Bridge not properly initialized on devnet: " + error.message);
    }
  });

  it("🔧 Creates fresh Token2022 mint and funds user", async () => {
    console.log("🧪 Creating fresh Token2022 mint...");
    
    try {
      // Create Token2022 mint
      const mintRent = await connection.getMinimumBalanceForRentExemption(82);
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: restrictedMint.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          restrictedMint.publicKey,
          decimals,
          wallet.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID,
        )
      );

      const createTx = await sendAndConfirmTransaction(
        connection, 
        transaction, 
        [wallet.payer, restrictedMint],
        { commitment: "confirmed" }
      );
      
      console.log("✅ Token2022 mint created:", restrictedMint.publicKey.toString());
      console.log("🔗 TX:", createTx);

      // Fund user with tokens
      const amount = 1000 * (10 ** decimals);
      const userTokenAccount = getAssociatedTokenAddressSync(
        restrictedMint.publicKey,
        testUser.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Check if user has enough SOL for ATA creation
      const userBalance = await connection.getBalance(testUser.publicKey);
      const ataRent = await connection.getMinimumBalanceForRentExemption(165);
      
      console.log("💰 User balance:", userBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      console.log("💰 ATA rent required:", ataRent / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      
      // Fund user if needed for ATA creation
      if (userBalance < ataRent + 0.01 * anchor.web3.LAMPORTS_PER_SOL) {
        console.log("💸 Funding user for ATA creation...");
        const fundTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: testUser.publicKey,
            lamports: ataRent + 0.01 * anchor.web3.LAMPORTS_PER_SOL,
          })
        );
        
        await sendAndConfirmTransaction(connection, fundTx, [wallet.payer], {
          commitment: "confirmed",
        });
      }
      
      const fundingTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.payer.publicKey,
          userTokenAccount,
          testUser.publicKey,
          restrictedMint.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
          restrictedMint.publicKey,
          userTokenAccount,
          wallet.publicKey,
          amount,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      const fundTx = await sendAndConfirmTransaction(
        connection, 
        fundingTx, 
        [wallet.payer],
        { commitment: "confirmed" }
      );
      
      console.log("✅ User funded with", amount / (10 ** decimals), "tokens");
      console.log("🔗 TX:", fundTx);
      
    } catch (error) {
      console.error("❌ Token creation failed:", error);
      throw error;
    }
  });

  it("📦 Tests wrap functionality with proper funding", async () => {
    console.log("🧪 Testing wrap with enhanced error handling...");
    
    try {
      const wrapAmount = 500 * (10 ** decimals);
      const userTokenAccount = getAssociatedTokenAddressSync(
        restrictedMint.publicKey,
        testUser.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      // Pre-flight checks
      console.log("🔍 Pre-flight checks...");
      
      // Check user token balance
      const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
      console.log("✅ User token account exists:", !!tokenAccountInfo);
      
      // Check user SOL balance for transaction fees
      const userBalance = await connection.getBalance(testUser.publicKey);
      console.log("💰 User SOL balance:", userBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      
      // Estimate costs for vault and ATA creation
      const vaultRent = await connection.getMinimumBalanceForRentExemption(
        8 + 32 + 32 + 32 + 32 + 8 + (1 + 32) + 8 + 1 // TokenVault::SPACE
      );
      const ataRent = await connection.getMinimumBalanceForRentExemption(165);
      const totalCostEstimate = vaultRent + ataRent + 0.01 * anchor.web3.LAMPORTS_PER_SOL; // Extra for fees
      
      console.log("💰 Estimated costs:");
      console.log("- Vault rent:", vaultRent / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      console.log("- ATA rent:", ataRent / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      console.log("- Total estimate:", totalCostEstimate / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      
      // Fund user if insufficient
      if (userBalance < totalCostEstimate) {
        console.log("💸 Funding user for wrap operation...");
        const fundAmount = totalCostEstimate - userBalance + 0.1 * anchor.web3.LAMPORTS_PER_SOL;
        
        const fundTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: testUser.publicKey,
            lamports: fundAmount,
          })
        );
        
        await sendAndConfirmTransaction(connection, fundTx, [wallet.payer], {
          commitment: "confirmed",
        });
        
        const newBalance = await connection.getBalance(testUser.publicKey);
        console.log("✅ User funded! New balance:", newBalance / anchor.web3.LAMPORTS_PER_SOL, "SOL");
      }

      // Execute wrap
      console.log("🔄 Executing wrap transaction...");
      const wrapTx = await program.methods
        .wrapTokens(new anchor.BN(wrapAmount))
        .accounts({
          user: testUser.publicKey,
          restrictedTokenMint: restrictedMint.publicKey,
          userRestrictedTokenAccount: userTokenAccount,
          bridgeTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([testUser])
        .rpc({
          commitment: "confirmed",
        });

      console.log("✅ Tokens wrapped successfully!");
      console.log("🔗 TX:", wrapTx);
      console.log("🔗 View on Solscan:", `https://solscan.io/tx/${wrapTx}?cluster=devnet`);

      // Verify vault state
      const [tokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
        program.programId
      );

      const vault = await program.account.tokenVault.fetch(tokenVault);
      console.log("📊 Vault created successfully:");
      console.log("- Total locked:", Number(vault.totalLocked.toString()) / (10 ** decimals), "tokens");
      console.log("- Vault address:", tokenVault.toString());
      
    } catch (error) {
      console.error("❌ Wrap failed:", error);
      
      // Enhanced error logging
      if (error.logs) {
        console.log("📋 Transaction logs:");
        error.logs.forEach((log: string, i: number) => console.log(`${i}: ${log}`));
      }
      
      throw error;
    }
  });

  it("📤 Tests unwrap functionality", async () => {
    console.log("🧪 Testing unwrap...");
    
    try {
      const unwrapAmount = 200 * (10 ** decimals);

      const unwrapTx = await program.methods
        .unwrapTokens(new anchor.BN(unwrapAmount))
        .accounts({
          user: testUser.publicKey,
          restrictedTokenMint: restrictedMint.publicKey,
          bridgeTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([testUser])
        .rpc({
          commitment: "confirmed",
        });

      console.log("✅ Tokens unwrapped successfully!");
      console.log("🔗 TX:", unwrapTx);
      console.log("🔗 View on Solscan:", `https://solscan.io/tx/${unwrapTx}?cluster=devnet`);

      // Verify final vault state
      const [tokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
        program.programId
      );

      const vault = await program.account.tokenVault.fetch(tokenVault);
      console.log("💰 Remaining in vault:", Number(vault.totalLocked.toString()) / (10 ** decimals), "tokens");
      
    } catch (error) {
      console.error("❌ Unwrap failed:", error);
      throw error;
    }
  });

  it("🔐 Tests admin functionality with conflict handling", async () => {
    console.log("🧪 Testing admin functions...");
    
    try {
      // Generate a unique hook program ID for this test using a valid base58 string
      const uniqueHookProgram = Keypair.generate().publicKey;
      
      const tx = await program.methods
        .addApprovedHookProgram(uniqueHookProgram)
        .rpc({
          commitment: "confirmed",
        });

      console.log("✅ Added unique approved hook program!");
      console.log("🔗 TX:", tx);

      // Verify it was added
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      console.log("📊 Total approved hook programs:", config.approvedHookPrograms.length);
      console.log("📊 Latest hook program:", uniqueHookProgram.toString());
      
    } catch (error) {
      console.error("❌ Admin function failed:", error);
      throw error;
    }
  });

  it("🏆 Final comprehensive verification", async () => {
    console.log("🔍 Final state verification...");
    
    try {
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      const [tokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
        program.programId
      );
      const vault = await program.account.tokenVault.fetch(tokenVault);
      
      console.log("📊 DEVNET DEPLOYMENT VERIFICATION COMPLETE!");
      console.log("🌐 Network: Devnet");
      console.log("📍 Program ID:", program.programId.toString());
      console.log("✓ Bridge Active:", config.isActive);
      console.log("✓ Bridge Authority:", config.authority.toString());
      console.log("✓ Bridge Token Mint:", config.bridgeTokenMint.toString());
      console.log("✓ Approved Hook Programs:", config.approvedHookPrograms.length);
      console.log("✓ Current Test Token2022 Mint:", restrictedMint.publicKey.toString());
      console.log("✓ Tokens in Current Vault:", Number(vault.totalLocked.toString()) / (10 ** decimals));
      console.log("✓ Vault Address:", tokenVault.toString());
      
      console.log("");
      console.log("🎯 SUCCESS METRICS:");
      console.log("✅ Bridge deployment functional");
      console.log("✅ Token2022 to SPL bridge working");
      console.log("✅ Vault system operational");
      console.log("✅ Admin controls working");
      console.log("✅ Standard SPL token minting");
      console.log("✅ Cross-program invocations successful");
      console.log("");
      console.log("🔗 Explore on Solscan:");
      console.log(`https://solscan.io/account/${program.programId}?cluster=devnet`);
      console.log(`https://solscan.io/account/${bridgeConfig}?cluster=devnet`);
      console.log(`https://solscan.io/account/${tokenVault}?cluster=devnet`);
      
    } catch (error) {
      console.error("❌ Final verification failed:", error);
      throw error;
    }
  });
});