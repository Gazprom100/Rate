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
  raw_price?: string; // Добавляем оригинальные (неконвертированные) значения для отладки
  raw_reserve?: string;
  raw_current_supply?: string; // Исходное значение current_supply из блокчейна
  raw_max_supply?: string;    // Исходное значение max_supply из блокчейна
  raw_delegated?: string;     // Исходное значение делегированных токенов
  current_supply?: number; // Текущий выпуск токенов
  max_supply?: number;     // Максимальный выпуск токенов
  supply_percentage?: number; // Процент выпущенных токенов от максимума
}

// Функция для вычисления рыночной капитализации
export const calculateMarketCap = (token: Token): number => {
  try {
    // Получаем эффективную цену (либо из уже преобразованного значения, либо из сырого)
    let effectivePrice = token.price;
    
    // Если цена близка к нулю, попробуем использовать raw_price
    if ((!effectivePrice || effectivePrice < 0.00000001) && token.raw_price) {
      effectivePrice = convertFromRawValue(token.raw_price);
      // Логируем для отладки
      if (effectivePrice > 0) {
        console.log(`Recalculated price for ${token.symbol}: ${effectivePrice}`);
      }
    }
    
    // Получаем эффективный current_supply
    let effectiveSupply = token.current_supply || 0;
    
    // Если supply близок к нулю, попробуем использовать raw_current_supply
    if ((!effectiveSupply || effectiveSupply < 0.00000001) && token.raw_current_supply) {
      effectiveSupply = convertFromRawValue(token.raw_current_supply);
      // Логируем для отладки
      if (effectiveSupply > 0) {
        console.log(`Recalculated supply for ${token.symbol}: ${effectiveSupply}`);
      }
    }
    
    // Проверка на валидные числа
    if (!effectivePrice || !effectiveSupply || isNaN(effectivePrice) || isNaN(effectiveSupply)) {
      return 0;
    }
    
    const marketCap = effectivePrice * effectiveSupply;
    
    // Для избранных токенов покажем подробный расчет капитализации
    if (['makarovsky', 'del', 'ddao'].includes(token.symbol.toLowerCase())) {
      console.log(`Market cap calculation for ${token.symbol}:`, {
        price: effectivePrice,
        supply: effectiveSupply,
        marketCap
      });
    }
    
    return marketCap;
  } catch (e) {
    console.error(`Error calculating market cap for ${token.symbol}:`, e);
    return 0;
  }
};

// Основная функция получения токенов с автоматической пагинацией
export const fetchTokens = async (): Promise<Token[]> => {
  try {
    console.log('Fetching all tokens with automatic pagination...');
    
    // Попытаемся сначала получить первую страницу токенов для определения общего количества
    const initialTokens = await fetchTokensPage(1, 100);
    
    if (!initialTokens || initialTokens.length === 0) {
      console.log('No tokens returned from the initial request');
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
    
    // Иначе предположим, что мы не знаем точное количество токенов
    // и будем последовательно запрашивать страницы, пока не получим все
    console.log('More than 100 tokens exist, fetching additional pages...');
    
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
          console.log('Reached final page of tokens');
        }
      } else {
        // Если вернулся пустой массив, значит больше токенов нет
        hasMoreTokens = false;
        console.log('No more tokens returned from API');
      }
      
      currentPage++;
      
      // Ограничение на случай бесконечного цикла (можно увеличить при необходимости)
      if (currentPage > 10) {
        console.warn('Reached maximum page limit (10), stopping pagination');
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
    console.error('Error fetching all tokens:', error);
    throw error;
  }
};

// Вспомогательная функция для получения одной страницы токенов
const fetchTokensPage = async (page: number, pageSize: number): Promise<Token[]> => {
  try {
    const offset = (page - 1) * pageSize;
    
    // Сначала пробуем с новым NodeJS маршрутом
    const endpoints = [
      `/api/decimal/coins?limit=${pageSize}&offset=${offset}`,          // Основной маршрут с преобразованием значений
      `/api/decimal-server/coins?limit=${pageSize}&offset=${offset}`    // Запасной маршрут
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
    
    return data;
  } catch (error) {
    console.error(`Error fetching tokens page ${page}:`, error);
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

// Utility function to convert raw blockchain values (with 18 decimals) to proper numbers
export const convertFromRawValue = (rawValue?: string | number): number => {
  if (!rawValue) return 0;
  
  const stringValue = typeof rawValue === 'string' ? rawValue : rawValue.toString();
  
  try {
    // Используем ручное деление для сохранения точности
    if (stringValue.length > 18) {
      // Разбиваем на целую и дробную части
      const integerPart = stringValue.slice(0, stringValue.length - 18);
      const fractionalPart = stringValue.slice(stringValue.length - 18);
      
      // Преобразуем их в числа
      const intValue = integerPart ? parseInt(integerPart) : 0;
      const fractValue = fractionalPart ? parseInt(fractionalPart) / 10**18 : 0;
      
      return intValue + fractValue;
    } else {
      // Если число меньше 1, деление нужно выполнить аккуратно
      return parseFloat(stringValue) / 10**18;
    }
  } catch (e) {
    console.error('Error converting raw blockchain value:', e);
    // Запасной метод
    return parseFloat(stringValue) / 10**18;
  }
}; 