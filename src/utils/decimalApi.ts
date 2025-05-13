
import axios from "axios";

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
  raw_price?: string;
  raw_reserve?: string;
  raw_current_supply?: string;
  raw_max_supply?: string;
  raw_delegated?: string;
  current_supply?: number;
  max_supply?: number;
  supply_percentage?: number;
}

export const convertFromRawValue = (rawValue?: string | number): number => {
  if (!rawValue) return 0;
  const stringValue = typeof rawValue === "string" ? rawValue : rawValue.toString();
  
  try {
    if (stringValue.length > 18) {
      const integerPart = stringValue.slice(0, stringValue.length - 18);
      const fractionalPart = stringValue.slice(stringValue.length - 18);
      
      const intValue = integerPart ? parseInt(integerPart) : 0;
      const fractValue = fractionalPart ? parseInt(fractionalPart) / 10**18 : 0;
      
      return intValue + fractValue;
    } else {
      return parseFloat(stringValue) / 10**18;
    }
  } catch (e) {
    console.error("Error converting raw blockchain value:", e);
    return parseFloat(stringValue) / 10**18;
  }
};

export const calculateMarketCap = (token: Token): number => {
  try {
    let effectivePrice = token.price;
    
    if ((!effectivePrice || effectivePrice < 0.00000001) && token.raw_price) {
      effectivePrice = convertFromRawValue(token.raw_price);
    }
    
    let effectiveSupply = token.current_supply || 0;
    
    if ((!effectiveSupply || effectiveSupply < 0.00000001) && token.raw_current_supply) {
      effectiveSupply = convertFromRawValue(token.raw_current_supply);
    }
    
    if (!effectivePrice || !effectiveSupply || isNaN(effectivePrice) || isNaN(effectiveSupply)) {
      return 0;
    }
    
    return effectivePrice * effectiveSupply;
  } catch (e) {
    console.error(`Error calculating market cap for ${token.symbol}:`, e);
    return 0;
  }
};

const fetchTokensPage = async (page: number, pageSize: number): Promise<Token[]> => {
  try {
    const offset = (page - 1) * pageSize;
    
    const endpoints = [
      `/api/decimal/coins?limit=${pageSize}&offset=${offset}`,          // Основной маршрут
      `/api/decimal-server/coins?limit=${pageSize}&offset=${offset}`    // Запасной маршрут
    ];
    
    let data = null;
    let lastError = null;
    
    // Пробуем поочередно все эндпоинты
    for (const endpoint of endpoints) {
      try {
        console.log(`Attempting to fetch tokens from ${endpoint}...`);
        const response = await axios.get(endpoint);
        
        // Проверяем структуру ответа
        if (response.data) {
          // Проверяем структуру { Ok: true, Result: [ { count: N, coins: [...] } ] }
          if (response.data.Ok === true && 
              Array.isArray(response.data.Result) && 
              response.data.Result.length > 0 &&
              response.data.Result[0].coins) {
            data = response.data.Result[0].coins;
            console.log(`Successfully fetched ${data.length} tokens from ${endpoint} (new API structure)`);
          }
          // Если ответ уже в виде массива
          else if (Array.isArray(response.data)) {
            data = response.data;
            console.log(`Successfully fetched ${data.length} tokens from ${endpoint}`);
          }
        }
        
        if (data) break;
      } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        lastError = error;
      }
    }
    
    if (!data) {
      throw lastError || new Error("All API endpoints failed");
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching tokens page ${page}:`, error);
    throw error;
  }
};

export const fetchTokens = async (): Promise<Token[]> => {
  try {
    console.log("Fetching all tokens with automatic pagination...");
    
    const initialTokens = await fetchTokensPage(1, 100);
    
    if (!initialTokens || initialTokens.length === 0) {
      console.log("No tokens returned from the initial request");
      return [];
    }
    
    // Если количество токенов меньше 100, значит мы уже получили все
    if (initialTokens.length < 100) {
      console.log(`Only ${initialTokens.length} tokens exist, returning single page`);
      
      // Добавляем расчет market_cap для каждого токена
      return initialTokens.map(token => ({
        ...token,
        market_cap: calculateMarketCap(token)
      }));
    }
    
    // Иначе продолжаем получать страницы, пока не получим все токены
    console.log("More than 100 tokens exist, fetching additional pages...");
    
    const allTokens = [...initialTokens];
    let currentPage = 2;
    let hasMoreTokens = true;
    
    // Продолжаем запрашивать страницы, пока не получим неполную страницу
    while (hasMoreTokens) {
      console.log(`Fetching tokens page ${currentPage}...`);
      const nextPageTokens = await fetchTokensPage(currentPage, 100);
      
      if (nextPageTokens && nextPageTokens.length > 0) {
        allTokens.push(...nextPageTokens);
        console.log(`Added ${nextPageTokens.length} tokens from page ${currentPage}`);
        
        // Если страница неполная, значит это последняя страница
        if (nextPageTokens.length < 100) {
          hasMoreTokens = false;
          console.log("Reached final page of tokens");
        }
      } else {
        // Если вернулся пустой массив, больше токенов нет
        hasMoreTokens = false;
        console.log("No more tokens returned from API");
      }
      
      currentPage++;
      
      // Ограничение на случай бесконечного цикла
      if (currentPage > 10) {
        console.warn("Reached maximum page limit (10), stopping pagination");
        break;
      }
    }
    
    console.log(`Successfully fetched a total of ${allTokens.length} tokens`);
    
    // Добавляем расчет market_cap для каждого токена
    const tokensWithMarketCap = allTokens.map(token => ({
      ...token,
      market_cap: calculateMarketCap(token)
    }));
    
    return tokensWithMarketCap;
  } catch (error) {
    console.error("Error fetching all tokens:", error);
    throw error;
  }
};

export const fetchTokenHistory = async (tokenId: string, timeFrame: string): Promise<any> => {
  try {
    // Используем локальный API-маршрут вместо прямого запроса к внешнему API
    const response = await axios.get('/api/decimal/history', {
      params: { tokenId, timeFrame }
    });
    
    const data = response.data;
    
    // Проверяем, преобразованы ли значения цены в истории
    if (data.price_history && data.price_history.length > 0) {
      // Проверяем, есть ли отладочные поля raw_price
      if ('raw_price' in data.price_history[0]) {
        console.log('History price data includes debug fields (raw values)');
        console.log('Sample history price:', {
          price: data.price_history[0].price,
          raw_price: data.price_history[0].raw_price,
          timestamp: data.price_history[0].timestamp
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching token history:', error);
    throw error;
  }
};

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};
