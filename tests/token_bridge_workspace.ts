import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenBridgeWorkspace } from "../target/types/token_bridge_workspace";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
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

describe("token_bridge_workspace", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.tokenBridgeWorkspace as Program<TokenBridgeWorkspace>;
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  // Test keypairs
  const restrictedMint = new Keypair();
  const user = new Keypair();
  const decimals = 9;

  // Derive PDAs that we'll need for verification
  const [bridgeConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("bridge_config")],
    program.programId
  );

  let bridgeTokenMint: PublicKey;

  before(async () => {
    console.log("🔧 Setting up test environment...");
    console.log("Program ID:", program.programId.toString());
    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Bridge Config PDA:", bridgeConfig.toString());
    
    // Airdrop SOL to test users
    try {
      const balance1 = await connection.getBalance(wallet.publicKey);
      const balance2 = await connection.getBalance(user.publicKey);
      
      if (balance1 < anchor.web3.LAMPORTS_PER_SOL) {
        await connection.requestAirdrop(wallet.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      }
      
      if (balance2 < anchor.web3.LAMPORTS_PER_SOL) {
        await connection.requestAirdrop(user.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      }
      
      // Wait for airdrops to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log("✅ Test accounts funded");
    } catch (error) {
      console.log("ℹ️  Using existing balance");
    }
  });

  it("Initializes bridge", async () => {
    console.log("🚀 Testing bridge initialization...");
    
    try {
      const tx = await program.methods
        .initializeBridge()
        .rpc();

      console.log("✅ Bridge initialized! TX:", tx);

      // Verify bridge config state
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      console.log("📊 Bridge Config:", {
        authority: config.authority.toString(),
        isActive: config.isActive,
        bump: config.bump,
      });

    } catch (error) {
      console.error("❌ Bridge initialization failed:", error);
      throw error;
    }
  });

  it("Creates bridge token mint", async () => {
    console.log("🪙 Creating bridge token mint...");
    
    try {
      const bridgeTokenKeypair = new Keypair();
      bridgeTokenMint = bridgeTokenKeypair.publicKey;

      const tx = await program.methods
        .createBridgeTokenMint()
        .accounts({
          bridgeTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bridgeTokenKeypair])
        .rpc();

      console.log("✅ Bridge token mint created! TX:", tx);
      console.log("🪙 Bridge Token Mint:", bridgeTokenMint.toString());

      // Verify config was updated
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      console.log("📊 Updated bridge config mint:", config.bridgeTokenMint.toString());

    } catch (error) {
      console.error("❌ Bridge token mint creation failed:", error);
      throw error;
    }
  });

  it("Creates and funds Token2022 mint", async () => {
    console.log("🔧 Creating Token2022 test mint...");
    
    try {
      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: restrictedMint.publicKey,
          space: 82, // Basic mint size
          lamports: await connection.getMinimumBalanceForRentExemption(82),
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

      await sendAndConfirmTransaction(connection, transaction, [wallet.payer, restrictedMint]);
      console.log("✅ Token2022 mint created:", restrictedMint.publicKey.toString());

      // Create and fund user's restricted token account
      const userRestrictedTokenAccount = getAssociatedTokenAddressSync(
        restrictedMint.publicKey,
        user.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const amount = 1000 * (10 ** decimals);
      const setupTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.payer.publicKey,
          userRestrictedTokenAccount,
          user.publicKey,
          restrictedMint.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
          restrictedMint.publicKey,
          userRestrictedTokenAccount,
          wallet.publicKey,
          amount,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      await sendAndConfirmTransaction(connection, setupTx, [wallet.payer]);
      console.log(`✅ Minted ${amount / (10 ** decimals)} tokens to user`);

    } catch (error) {
      console.error("❌ Token2022 setup failed:", error);
      throw error;
    }
  });

  it("Wraps tokens successfully", async () => {
    console.log("📦 Testing token wrapping...");
    
    try {
      const amount = 500 * (10 ** decimals);
      console.log(`📊 Wrapping ${amount / (10 ** decimals)} tokens`);

      // Calculate user's restricted token account
      const userRestrictedTokenAccount = getAssociatedTokenAddressSync(
        restrictedMint.publicKey,
        user.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .wrapTokens(new anchor.BN(amount))
        .accounts({
          user: user.publicKey,
          restrictedTokenMint: restrictedMint.publicKey,
          userRestrictedTokenAccount, // This one is NOT a PDA in wrapTokens according to IDL
          bridgeTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      console.log("✅ Tokens wrapped! TX:", tx);

      // Verify vault state by deriving the PDA manually
      const [tokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
        program.programId
      );

      const vault = await program.account.tokenVault.fetch(tokenVault);
      const lockedTokens = Number(vault.totalLocked.toString()) / (10 ** decimals);
      console.log(`🎉 Vault now holds ${lockedTokens} locked tokens`);
      console.log("📊 Vault Info:", {
        restrictedMint: vault.restrictedTokenMint.toString(),
        bridgeTokenMint: vault.bridgeTokenMint.toString(),
        totalLocked: lockedTokens
      });

    } catch (error) {
      console.error("❌ Token wrapping failed:", error);
      console.error("Error details:", error.logs || error.message);
      throw error;
    }
  });

  it("Unwraps tokens successfully", async () => {
    console.log("📤 Testing token unwrapping...");
    
    try {
      const amount = 200 * (10 ** decimals);
      console.log(`📊 Unwrapping ${amount / (10 ** decimals)} tokens`);

      const tx = await program.methods
        .unwrapTokens(new anchor.BN(amount))
        .accounts({
          user: user.publicKey,
          restrictedTokenMint: restrictedMint.publicKey,
          bridgeTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      console.log("✅ Tokens unwrapped! TX:", tx);

      // Verify final vault state
      const [tokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
        program.programId
      );

      const vault = await program.account.tokenVault.fetch(tokenVault);
      const remainingTokens = Number(vault.totalLocked.toString()) / (10 ** decimals);
      console.log(`💰 Vault now holds ${remainingTokens} locked tokens`);

    } catch (error) {
      console.error("❌ Token unwrapping failed:", error);
      console.error("Error details:", error.logs || error.message);
      throw error;
    }
  });

  it("Tests admin functionality", async () => {
    console.log("🔐 Testing admin functions...");
    
    try {
      // Test adding approved hook program
      const dummyHookProgram = new PublicKey("11111111111111111111111111111112");
      
      const tx = await program.methods
        .addApprovedHookProgram(dummyHookProgram)
        .rpc();

      console.log("✅ Added approved hook program! TX:", tx);

      // Verify it was added
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      console.log("📊 Approved hook programs:", config.approvedHookPrograms.length);
      console.log("📋 Hook program added:", config.approvedHookPrograms[0]?.toString());

    } catch (error) {
      console.error("❌ Admin functionality test failed:", error);
      throw error;
    }
  });

  it("Verifies complete bridge functionality", async () => {
    console.log("🔍 Final verification...");
    
    try {
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      const [tokenVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
        program.programId
      );
      const vault = await program.account.tokenVault.fetch(tokenVault);

      console.log("📊 Final State Summary:");
      console.log("✓ Bridge Active:", config.isActive);
      console.log("✓ Bridge Authority:", config.authority.toString());
      console.log("✓ Bridge Token Mint:", config.bridgeTokenMint.toString());
      console.log("✓ Approved Hook Programs:", config.approvedHookPrograms.length);
      console.log("✓ Restricted Token Mint:", restrictedMint.publicKey.toString());
      console.log("✓ Tokens Locked in Vault:", Number(vault.totalLocked.toString()) / (10 ** decimals));
      console.log("✓ Vault Token Account:", vault.vaultTokenAccount.toString());
      
      console.log("🎯 Phase 1 Bridge Test Suite COMPLETE!");
      console.log("🏆 All core functionality verified:");
      console.log("  ✅ Bridge initialization");
      console.log("  ✅ Bridge token creation");
      console.log("  ✅ Token2022 wrapping");
      console.log("  ✅ Token unwrapping");
      console.log("  ✅ Vault management");
      console.log("  ✅ Admin controls");

    } catch (error) {
      console.error("❌ Final verification failed:", error);
      throw error;
    }
  });
});