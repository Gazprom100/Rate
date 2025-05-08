import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_DECIMAL_API_URL;

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  reserve: number;
  crr: number;
  wallets_count: number;
  delegation_percentage: number;
}

export const fetchTokens = async (): Promise<Token[]> => {
  try {
    const response = await axios.get(`${API_URL}/coins`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    throw error;
  }
};

export const fetchTokenHistory = async (tokenId: string, timeFrame: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/coins/${tokenId}/history`, {
      params: { timeFrame }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token history:', error);
    throw error;
  }
};

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}; 