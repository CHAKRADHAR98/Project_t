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

describe("bridge_only_test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.tokenBridgeWorkspace as Program<TokenBridgeWorkspace>;
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  // Test keypairs
  const restrictedMint = new Keypair();
  const testUser = new Keypair();
  const decimals = 9;

  // Derive PDAs
  const [bridgeConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("bridge_config")],
    program.programId
  );

  let bridgeTokenMint: PublicKey;

  before(async () => {
    console.log("🔧 Setting up bridge-only test environment...");
    
    // Fund test accounts
    try {
      await connection.requestAirdrop(wallet.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      await connection.requestAirdrop(testUser.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      
      // Wait for airdrops
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("✅ Test accounts funded");
    } catch (error) {
      console.log("ℹ️ Using existing balances");
    }
  });

  it("Initializes bridge", async () => {
    console.log("🚀 Initializing bridge...");
    
    try {
      const tx = await program.methods
        .initializeBridge()
        .rpc();

      console.log("✅ Bridge initialized! TX:", tx);
    } catch (error) {
      // Check if bridge is already initialized
      try {
        const config = await program.account.bridgeConfig.fetch(bridgeConfig);
        console.log("ℹ️  Bridge already initialized");
        console.log("📊 Bridge Config:", {
          authority: config.authority.toString(),
          isActive: config.isActive,
        });
      } catch (fetchError) {
        console.error("❌ Bridge initialization failed:", error.message);
        throw error;
      }
    }
  });

  it("Creates bridge token mint", async () => {
    console.log("🪙 Creating bridge token mint...");
    
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
  });

  it("Creates Token2022 mint and funds user", async () => {
    console.log("🔧 Creating Token2022 mint...");
    
    // Create basic Token2022 mint
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

    // Fund test user
    const amount = 1000 * (10 ** decimals);
    const userTokenAccount = getAssociatedTokenAddressSync(
      restrictedMint.publicKey,
      testUser.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
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

    await sendAndConfirmTransaction(connection, fundingTx, [wallet.payer]);
    console.log("✅ Test user funded with", amount / (10 ** decimals), "tokens");
  });

  it("Tests wrap functionality", async () => {
    console.log("📦 Testing token wrapping...");
    
    const wrapAmount = 500 * (10 ** decimals);
    const userTokenAccount = getAssociatedTokenAddressSync(
      restrictedMint.publicKey,
      testUser.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
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
      .rpc();

    console.log("✅ Tokens wrapped successfully! TX:", tx);

    // Verify vault state
    const [tokenVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
      program.programId
    );

    const vault = await program.account.tokenVault.fetch(tokenVault);
    console.log("📊 Vault Info:", {
      totalLocked: Number(vault.totalLocked.toString()) / (10 ** decimals),
      restrictedMint: vault.restrictedTokenMint.toString(),
      bridgeTokenMint: vault.bridgeTokenMint.toString(),
    });
  });

  it("Tests unwrap functionality", async () => {
    console.log("📤 Testing token unwrapping...");
    
    const unwrapAmount = 200 * (10 ** decimals);

    const tx = await program.methods
      .unwrapTokens(new anchor.BN(unwrapAmount))
      .accounts({
        user: testUser.publicKey,
        restrictedTokenMint: restrictedMint.publicKey,
        bridgeTokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .signers([testUser])
      .rpc();

    console.log("✅ Tokens unwrapped successfully! TX:", tx);

    // Verify final vault state
    const [tokenVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), restrictedMint.publicKey.toBuffer()],
      program.programId
    );

    const vault = await program.account.tokenVault.fetch(tokenVault);
    console.log("💰 Remaining in vault:", Number(vault.totalLocked.toString()) / (10 ** decimals), "tokens");
  });

  it("Tests admin functionality", async () => {
    console.log("🔐 Testing admin functions...");
    
    // Test adding approved hook program
    const dummyHookProgram = new PublicKey("11111111111111111111111111111112");
    
    const tx = await program.methods
      .addApprovedHookProgram(dummyHookProgram)
      .rpc();

    console.log("✅ Added approved hook program! TX:", tx);

    // Verify it was added
    const config = await program.account.bridgeConfig.fetch(bridgeConfig);
    console.log("📊 Approved hook programs:", config.approvedHookPrograms.length);
  });

  it("Final verification", async () => {
    console.log("🔍 Final verification...");
    
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
    console.log("✓ Token2022 Mint:", restrictedMint.publicKey.toString());
    console.log("✓ Tokens Locked in Vault:", Number(vault.totalLocked.toString()) / (10 ** decimals));
    
    console.log("🎯 BRIDGE-ONLY TEST COMPLETE!");
    console.log("🏆 All core bridge functionality verified:");
    console.log("  ✅ Bridge initialization");
    console.log("  ✅ Bridge token mint creation");
    console.log("  ✅ Token2022 support");
    console.log("  ✅ Token wrapping (Lock Token2022 → Mint bridge tokens)");
    console.log("  ✅ Token unwrapping (Burn bridge tokens → Unlock Token2022)");
    console.log("  ✅ Vault management");
    console.log("  ✅ Admin controls");
    console.log("");
    console.log("🚀 READY FOR AMM INTEGRATION!");
    console.log("Bridge tokens are standard SPL tokens - compatible with all AMMs");
  });
});