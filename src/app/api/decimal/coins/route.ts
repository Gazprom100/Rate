import { NextRequest, NextResponse } from 'next/server';

// Принудительно указываем, что это динамический маршрут
export const dynamic = 'force-dynamic';

// Переключаемся на стандартный рантайм
// export const runtime = 'edge';

// Функция для преобразования значений с учетом сдвига на 18 знаков
const convertFromDecimals = (value: string | number): number => {
  if (!value) return 0;
  
  const numValue = typeof value === 'string' ? value : value.toString();
  
  try {
    // Используем BigInt для точного преобразования больших чисел
    // с последующим делением на 10^18
    const valueBigInt = BigInt(numValue);
    const divisor = BigInt(10**18);
    
    // Получаем целую часть
    const integerPart = Number(valueBigInt / divisor);
    
    // Получаем дробную часть с нужной точностью
    const remainder = Number(valueBigInt % divisor) / 10**18;
    
    return integerPart + remainder;
  } catch (e) {
    console.error('Error converting from decimals:', e);
    // Запасной вариант - простое деление с плавающей точкой
    return parseFloat(numValue) / 10**18;
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Starting fetch request to Decimal API...');
    
    // Получаем параметры пагинации из запроса
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100'; // Увеличиваем лимит по умолчанию до 100
    const offset = searchParams.get('offset') || '0';
    
    console.log(`Fetching coins with limit=${limit}, offset=${offset}`);
    
    // Исправляем URL API в соответствии с документацией Swagger
    // basePath: "/api/v1/coins" означает, что полный путь должен быть:
    // https://api.decimalchain.com/api/v1/coins/coins
    const url = new URL('https://api.decimalchain.com/api/v1/coins/coins');
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    
    console.log(`Sending request to: ${url.toString()}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rate-App/1.0',
      },
      next: { revalidate: 60 }, // Кешируем на 60 секунд
    });

    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;
      console.error(`API request failed: ${status} ${statusText}`);
      return NextResponse.json(
        { 
          error: 'Decimal API Error',
          message: `API returned error: ${status} ${statusText}`,
          statusCode: status
        },
        { status }
      );
    }

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Правильно обрабатываем вложенную структуру ответа API
    if (data.Ok === true && Array.isArray(data.Result) && data.Result.length > 0) {
      const coinsData = data.Result[0].coins;
      if (Array.isArray(coinsData)) {
        console.log(`Successfully retrieved ${coinsData.length} tokens from API`);
        
        // Логируем для отладки первый токен
        if (coinsData.length > 0) {
          const firstCoin = coinsData[0];
          console.log('Sample coin data before conversion:', {
            symbol: firstCoin.symbol,
            price: firstCoin.price,
            reserve: firstCoin.reserve,
            current_supply: firstCoin.current_supply || firstCoin.volume,
            max_supply: firstCoin.max_supply || firstCoin.limit_volume
          });
          
          // Демонстрируем преобразование значений
          console.log('Conversion demonstration for first token:', {
            price: {
              raw: firstCoin.price,
              converted: convertFromDecimals(firstCoin.price || 0)
            },
            current_supply: {
              raw: firstCoin.current_supply || firstCoin.volume || '0',
              converted: convertFromDecimals(firstCoin.current_supply || firstCoin.volume || 0)
            },
            max_supply: {
              raw: firstCoin.max_supply || firstCoin.limit_volume || '0',
              converted: convertFromDecimals(firstCoin.max_supply || firstCoin.limit_volume || 0)
            }
          });
        }
        
        // Нормализуем ключи к ожидаемому формату и применяем преобразование
        const normalizedCoins = coinsData.map(coin => {
          // Сохраняем все необработанные значения для отладки
          const rawPrice = coin.current_price || coin.price || '0';
          const rawReserve = coin.reserve || '0';
          const rawCurrentSupply = coin.total_supply || coin.current_supply || coin.volume || '0';
          const rawMaxSupply = coin.max_supply || coin.limit_volume || '0';
          const rawDelegated = coin.delegate || coin.delegated_coins || '0';
          
          // Логируем для проверки правильности конвертации (только для избранных токенов)
          if (['makarovsky', 'del', 'ddao'].includes(coin.symbol.toLowerCase())) {
            console.log(`DEBUG ${coin.symbol} raw values:`, {
              current_price: coin.current_price,
              price: coin.price,
              rawPrice,
              total_supply: coin.total_supply,
              current_supply: coin.current_supply,
              rawCurrentSupply,
              rawReserve,
              rawDelegated
            });
          }
          
          // Получаем и преобразуем значения с учетом 18 знаков
          let price;
          try {
            price = convertFromDecimals(rawPrice);
          } catch (e) {
            console.error(`Error converting price for ${coin.symbol}:`, e);
            price = 0;
          }
          
          let reserve;
          try {
            reserve = convertFromDecimals(rawReserve);
          } catch (e) {
            console.error(`Error converting reserve for ${coin.symbol}:`, e);
            reserve = 0;
          }
          
          let currentSupply;
          try {
            currentSupply = convertFromDecimals(rawCurrentSupply);
          } catch (e) {
            console.error(`Error converting current_supply for ${coin.symbol}:`, e);
            currentSupply = 0;
          }
          
          let maxSupply;
          try {
            maxSupply = convertFromDecimals(rawMaxSupply);
          } catch (e) {
            console.error(`Error converting max_supply for ${coin.symbol}:`, e);
            maxSupply = 0;
          }
          
          let delegated;
          try {
            delegated = convertFromDecimals(rawDelegated);
          } catch (e) {
            console.error(`Error converting delegated for ${coin.symbol}:`, e);
            delegated = 0;
          }
          
          // Рассчитываем процент текущего supply от максимального
          let supplyPercentage = 0;
          if (maxSupply > 0) {
            supplyPercentage = (currentSupply / maxSupply) * 100;
          }
          
          // Получаем значение процента делегирования
          let delegationPercentage = 0;
          try {
            // Если delegation_percentage есть в ответе API, используем его
            if (coin.delegation_percentage && parseFloat(coin.delegation_percentage) > 0) {
              delegationPercentage = parseFloat(coin.delegation_percentage || '0');
            } 
            // Иначе рассчитываем из делегированного количества и текущего объема
            else if (coin.delegate && (coin.current_supply || coin.volume || coin.total_supply)) {
              // Используем raw значения для более точного расчета
              const rawDelegated = coin.delegate || '0';
              const rawVolume = coin.current_supply || coin.volume || coin.total_supply || '0';
              
              if (rawDelegated !== '0' && rawVolume !== '0') {
                // Чтобы избежать потери точности при работе с большими числами,
                // делим raw значения и умножаем на 100 для получения процента
                try {
                  // Используем BigInt для точных вычислений
                  const delegatedBigInt = BigInt(rawDelegated);
                  const volumeBigInt = BigInt(rawVolume);
                  
                  if (volumeBigInt > BigInt(0)) {
                    // (delegated * 10000) / volume -> получаем процент с двумя знаками после запятой
                    // множитель 10000 для того, чтобы сохранить 2 знака после запятой
                    const percentageMultiplied = (delegatedBigInt * BigInt(10000)) / volumeBigInt;
                    delegationPercentage = Number(percentageMultiplied) / 100;
                    
                    console.log(`Calculated delegation for ${coin.symbol}: ${delegationPercentage}%`);
                    
                    // Дополнительно для проверки рассчитаем через convertFromDecimals
                    const delegatedConverted = convertFromDecimals(rawDelegated);
                    const volumeConverted = convertFromDecimals(rawVolume);
                    const alternativePercentage = (delegatedConverted / volumeConverted) * 100;
                    
                    console.log(`Alternative delegation calculation for ${coin.symbol}: ${alternativePercentage}%`);
                  }
                } catch (e) {
                  console.error(`Error calculating delegation with BigInt for ${coin.symbol}:`, e);
                  
                  // Запасной вариант - используем преобразованные значения
                  delegationPercentage = (delegated / currentSupply) * 100;
                }
              }
            }
          } catch (e) {
            console.error(`Error calculating delegation percentage for ${coin.symbol}:`, e);
          }

          // Для отладки выведем преобразованные значения для некоторых токенов
          if (['makarovsky', 'del', 'ddao'].includes(coin.symbol.toLowerCase())) {
            console.log(`DEBUG ${coin.symbol} converted values:`, {
              price,
              currentSupply,
              maxSupply,
              reserve,
              delegated,
              delegationPercentage,
              supplyPercentage
            });
          }
          
          return {
            id: coin.symbol,
            symbol: coin.symbol,
            name: coin.title,
            price: price,
            reserve: reserve,
            crr: parseFloat(coin.crr || 0),
            wallets_count: parseInt(coin.wallets_count || 0),
            delegation_percentage: delegationPercentage,
            // Добавляем информацию о supply
            current_supply: currentSupply,
            max_supply: maxSupply,
            supply_percentage: supplyPercentage,
            // Оригинальные значения для отладки
            raw_price: rawPrice,
            raw_reserve: rawReserve,
            raw_current_supply: rawCurrentSupply,
            raw_max_supply: rawMaxSupply,
            raw_delegated: rawDelegated
          };
        });
        
        // Логируем для отладки первый преобразованный токен
        if (normalizedCoins.length > 0) {
          console.log('Sample coin data after conversion:', {
            symbol: normalizedCoins[0].symbol,
            price: normalizedCoins[0].price,
            raw_price: normalizedCoins[0].raw_price,
            reserve: normalizedCoins[0].reserve,
            raw_reserve: normalizedCoins[0].raw_reserve,
            current_supply: normalizedCoins[0].current_supply,
            max_supply: normalizedCoins[0].max_supply,
            supply_percentage: normalizedCoins[0].supply_percentage,
            raw_current_supply: normalizedCoins[0].raw_current_supply,
            raw_max_supply: normalizedCoins[0].raw_max_supply
          });
        }
        
        return NextResponse.json(normalizedCoins);
      }
    }
    
    // Если формат не соответствует ожидаемому
    console.error('Unexpected API response format:', data);
    return NextResponse.json(
      { 
        error: 'API Format Error',
        message: 'Unexpected data format from Decimal API',
        statusCode: 500
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error proxying Decimal API:', error.name, error.message, error.stack);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500
      },
      { status: 500 }
    );
  }
} 