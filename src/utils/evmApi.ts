import axios from 'axios';
import { ethers } from 'ethers';

// EVM provider for Decimal blockchain
const EVM_RPC_URL = 'https://node.decimalchain.com/web3/';

// Initialize provider
export const getEvmProvider = () => {
  return new ethers.JsonRpcProvider(EVM_RPC_URL, undefined, {
    polling: true,
    pollingInterval: 4000,
    cacheTimeout: 10000
  });
};

// Get the latest block number
export const getLatestBlockNumber = async (): Promise<number> => {
  const provider = getEvmProvider();
  return await provider.getBlockNumber();
};

// Get block by number
export const getBlockByNumber = async (blockNumber: number) => {
  const provider = getEvmProvider();
  return await provider.getBlock(blockNumber);
};

// Get transaction by hash
export const getTransactionByHash = async (txHash: string) => {
  const provider = getEvmProvider();
  return await provider.getTransaction(txHash);
};

// Get active wallet addresses from recent blocks
export const getActiveWalletAddresses = async (blockCount: number = 100): Promise<string[]> => {
  const provider = getEvmProvider();
  const latestBlock = await provider.getBlockNumber();
  
  // Start from the latest block and go back blockCount blocks
  const startBlock = Math.max(0, latestBlock - blockCount);
  const uniqueAddresses = new Set<string>();
  
  for (let i = latestBlock; i > startBlock; i--) {
    try {
      const block = await provider.getBlock(i, true);
      
      if (block && block.transactions) {
        // Extract unique addresses from transactions
        for (const tx of block.transactions) {
          const transaction = tx as unknown as ethers.TransactionResponse;
          if (transaction.from) uniqueAddresses.add(transaction.from.toLowerCase());
          if (transaction.to) uniqueAddresses.add(transaction.to.toLowerCase());
        }
      }
    } catch (error) {
      console.error(`Error processing block ${i}:`, error);
    }
  }
  
  return Array.from(uniqueAddresses);
};

// Get wallet statistics including counts and activity
export const getWalletStatistics = async (blockRange: number = 1000): Promise<{
  totalUniqueWallets: number;
  activeWallets: number;
  walletActivity: { [key: string]: number };
}> => {
  const provider = getEvmProvider();
  let latestBlock;
  
  try {
    latestBlock = await provider.getBlockNumber();
  } catch (error) {
    console.error("Error getting latest block number:", error);
    // Return default values if we can't connect
    return {
      totalUniqueWallets: 0,
      activeWallets: 0,
      walletActivity: {}
    };
  }
  
  // Use a smaller block range for efficiency and to reduce timeouts
  const actualBlockRange = Math.min(blockRange, 200);
  // Start from the latest block and go back blockRange blocks
  const startBlock = Math.max(0, latestBlock - actualBlockRange);
  const uniqueAddresses = new Set<string>();
  const activityCounter: { [key: string]: number } = {};
  
  // Sample blocks less frequently for larger ranges
  const step = actualBlockRange > 100 ? 20 : 10;
  
  for (let i = latestBlock; i > startBlock; i -= step) {
    try {
      const block = await provider.getBlock(i, true);
      
      if (block && block.transactions) {
        // Process transactions in the block
        for (const tx of block.transactions) {
          const transaction = tx as unknown as ethers.TransactionResponse;
          
          if (transaction.from) {
            const fromAddress = transaction.from.toLowerCase();
            uniqueAddresses.add(fromAddress);
            activityCounter[fromAddress] = (activityCounter[fromAddress] || 0) + 1;
          }
          
          if (transaction.to) {
            const toAddress = transaction.to.toLowerCase();
            uniqueAddresses.add(toAddress);
            activityCounter[toAddress] = (activityCounter[toAddress] || 0) + 1;
          }
        }
      }
    } catch (error) {
      console.error(`Error processing block ${i}:`, error);
      // Continue processing other blocks
      continue;
    }
  }
  
  return {
    totalUniqueWallets: uniqueAddresses.size,
    activeWallets: Object.keys(activityCounter).length,
    walletActivity: activityCounter
  };
};
