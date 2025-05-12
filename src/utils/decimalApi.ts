import axios from 'axios';

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
    // Сначала пробуем с новым NodeJS маршрутом
    const endpoints = [
      '/api/decimal-server/coins',  // NodeJS версия
      '/api/decimal/coins'          // Edge версия (резервная)
    ];
    
    let data = null;
    let lastError = null;
    
    // Пробуем поочередно все эндпоинты
    for (const endpoint of endpoints) {
      try {
        console.log(`Attempting to fetch tokens from ${endpoint}...`);
        const response = await axios.get(endpoint);
        data = response.data;
        console.log(`Successfully fetched ${data.length} tokens from ${endpoint}`);
        break; // Если успешно, прерываем цикл
      } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        lastError = error;
      }
    }
    
    // Если ни один эндпоинт не сработал, бросаем последнюю ошибку
    if (!data) {
      throw lastError || new Error('All API endpoints failed');
    }
    
    // Добавляем расчет market_cap для каждого токена
    return data.map((token: Token) => ({
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
    // Используем локальный API-маршрут вместо прямого запроса к внешнему API
    const response = await axios.get('/api/decimal/history', {
      params: { tokenId, timeFrame }
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