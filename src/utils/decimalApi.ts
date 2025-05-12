import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_DECIMAL_API_URL || 'https://api.decimalchain.com/api/v1';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  reserve: number;
  crr: number;
  wallets_count: number;
  delegation_percentage: number;
  market_cap?: number;
}

// Функция для вычисления рыночной капитализации
export const calculateMarketCap = (token: Token): number => {
  return token.price * token.reserve;
};

export const fetchTokens = async (): Promise<Token[]> => {
  try {
    const response = await axios.get(`${API_URL}/coins`);
    // Добавляем расчет market_cap для каждого токена
    return response.data.map((token: Token) => ({
      ...token,
      market_cap: calculateMarketCap(token)
    }));
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