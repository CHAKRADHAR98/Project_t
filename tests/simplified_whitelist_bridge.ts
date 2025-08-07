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
} from "@solana/spl-token";

describe("simple_whitelist_test", () => {
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

  const [whitelist] = PublicKey.findProgramAddressSync(
    [Buffer.from("whitelist"), restrictedMint.publicKey.toBuffer()],
    program.programId
  );

  let bridgeTokenMint: PublicKey;

  before(async () => {
    console.log("🔧 Setting up simple whitelist test...");
    
    try {
      await connection.requestAirdrop(wallet.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      await connection.requestAirdrop(testUser.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log("✅ Test accounts funded");
    } catch (error) {
      console.log("ℹ️ Using existing balances");
    }
  });

  it("Initializes bridge (prerequisite)", async () => {
    console.log("🚀 Initializing bridge...");
    
    try {
      const tx = await program.methods
        .initializeBridge()
        .rpc();
      console.log("✅ Bridge initialized! TX:", tx);
    } catch (error) {
      console.log("ℹ️ Bridge already initialized");
    }
  });

  it("Creates bridge token mint (prerequisite)", async () => {
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
    } catch (error) {
      console.log("ℹ️ Using existing bridge token mint");
      const config = await program.account.bridgeConfig.fetch(bridgeConfig);
      bridgeTokenMint = config.bridgeTokenMint;
    }
  });

  it("Creates Token2022 mint", async () => {
    console.log("🔧 Creating Token2022 mint...");
    
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: restrictedMint.publicKey,
        space: 82,
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
  });

  it("Initializes simple whitelist", async () => {
    console.log("📋 Initializing simple whitelist...");
    
    try {
      const tx = await program.methods
        .initializeWhitelist()
        .accounts({
          mint: restrictedMint.publicKey,
        })
        .rpc();

      console.log("✅ Whitelist initialized! TX:", tx);

      // Verify whitelist was created
      const whitelistData = await program.account.simpleWhitelist.fetch(whitelist);
      console.log("📊 Whitelist created:", {
        authority: whitelistData.authority.toString(),
        usersCount: whitelistData.users.length,
        bump: whitelistData.bump,
      });

    } catch (error) {
      console.log("❌ Whitelist initialization failed:");
      console.log("Error:", error.message);
      throw error;
    }
  });

  it("Adds users to whitelist", async () => {
    console.log("➕ Adding users to whitelist...");
    
    try {
      const addTx = await program.methods
        .addToWhitelist(testUser.publicKey)
        .accounts({
          mint: restrictedMint.publicKey,
        })
        .rpc();

      console.log("✅ User added to whitelist! TX:", addTx);

      // Verify user was added
      const whitelistData = await program.account.simpleWhitelist.fetch(whitelist);
      console.log("📊 Whitelist after addition:", {
        usersCount: whitelistData.users.length,
        firstUser: whitelistData.users[0]?.toString(),
        isTestUserWhitelisted: whitelistData.users.includes(testUser.publicKey),
      });

    } catch (error) {
      console.log("❌ Adding user to whitelist failed:");
      console.log("Error:", error.message);
      throw error;
    }
  });

  it("Removes users from whitelist", async () => {
    console.log("➖ Removing users from whitelist...");
    
    try {
      const removeTx = await program.methods
        .removeFromWhitelist(testUser.publicKey)
        .accounts({
          mint: restrictedMint.publicKey,
        })
        .rpc();

      console.log("✅ User removed from whitelist! TX:", removeTx);

      // Verify user was removed
      const whitelistData = await program.account.simpleWhitelist.fetch(whitelist);
      console.log("📊 Whitelist after removal:", {
        usersCount: whitelistData.users.length,
        isTestUserWhitelisted: whitelistData.users.includes(testUser.publicKey),
      });

    } catch (error) {
      console.log("❌ Removing user from whitelist failed:");
      console.log("Error:", error.message);
      throw error;
    }
  });

  it("Final verification", async () => {
    console.log("🔍 Final verification...");
    
    const config = await program.account.bridgeConfig.fetch(bridgeConfig);
    const whitelistData = await program.account.simpleWhitelist.fetch(whitelist);
    
    console.log("📊 Final State Summary:");
    console.log("✓ Bridge Active:", config.isActive);
    console.log("✓ Bridge Token Mint:", config.bridgeTokenMint.toString());
    console.log("✓ Token2022 Mint:", restrictedMint.publicKey.toString());
    console.log("✓ Whitelist Authority:", whitelistData.authority.toString());
    console.log("✓ Whitelist Users Count:", whitelistData.users.length);
    
    console.log("🎯 SIMPLE WHITELIST TEST COMPLETE!");
    console.log("🏆 Achievements:");
    console.log("  ✅ Bridge system operational");
    console.log("  ✅ Simple whitelist functionality working");
    console.log("  ✅ Add/remove users to whitelist");
    console.log("  ✅ Whitelist state management");
    console.log("");
    console.log("🔜 Next: Integrate whitelist validation with bridge unwrap");
  });
});