import { 
  WhirlpoolContext, 
  buildWhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  createSplashPoolInstructions,
  increaseLiquidityInstructions,
  TokenInfo
} from '@orca-so/whirlpools-sdk';

export function useOrca() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);

  const createSplashPool = async (
    tokenA: PublicKey,
    tokenB: PublicKey,
    initialPrice: number
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      // Initialize Whirlpool client
      const ctx = WhirlpoolContext.withProvider(
        connection,
        { publicKey } as any,
        ORCA_WHIRLPOOL_PROGRAM_ID
      );
      
      const client = buildWhirlpoolClient(ctx);

      // Create splash pool instructions
      const { instructions, poolKey } = await createSplashPoolInstructions(
        ctx,
        {
          tokenMintA: tokenA,
          tokenMintB: tokenB,
          tickSpacing: 64, // Standard for Splash pools
          initialPrice,
          payer: publicKey
        }
      );

      // Build and send transaction
      const tx = new Transaction().add(...instructions);
      const signature = await sendTransaction(tx, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Splash pool created successfully!');
      
      return {
        poolAddress: poolKey,
        signature,
      };
    } catch (error: any) {
      console.error('Pool creation error:', error);
      toast.error(`Failed to create pool: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addLiquidity = async (
    poolAddress: PublicKey,
    tokenAAmount: number,
    tokenBAmount: number
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const ctx = WhirlpoolContext.withProvider(
        connection,
        { publicKey } as any,
        ORCA_WHIRLPOOL_PROGRAM_ID
      );

      const client = buildWhirlpoolClient(ctx);
      const pool = await client.getPool(poolAddress);

      // Calculate liquidity amounts
      const { instructions } = await increaseLiquidityInstructions(
        ctx,
        {
          pool,
          tokenMaxA: tokenAAmount,
          tokenMaxB: tokenBAmount,
          liquidity: calculateLiquidity(tokenAAmount, tokenBAmount), // Helper function
          payer: publicKey
        }
      );

      const tx = new Transaction().add(...instructions);
      const signature = await sendTransaction(tx, connection);
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Liquidity added successfully!');
      
      return {
        signature,
      };
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      toast.error(`Failed to add liquidity: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSplashPool,
    addLiquidity,
    isLoading
  };
}