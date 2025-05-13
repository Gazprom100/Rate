import React, { useMemo } from 'react';
import { Token, convertFromRawValue } from '@/utils/decimalApi';

interface TopTokensCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function TopTokensCard({ tokens, darkMode = false }: TopTokensCardProps) {
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0.00';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price: number, rawPrice?: string) => {
    // Проверим сначала наличие исходного значения (raw_price)
    if (rawPrice && rawPrice !== '0') {
      try {
        const convertedPrice = convertFromRawValue(rawPrice);
        if (convertedPrice && convertedPrice > 0) {
          return `${convertedPrice.toFixed(8)} DEL`;
        }
      } catch (e) {
        console.error('Error formatting price from raw value:', e);
      }
    }
    
    // Затем проверяем обычную цену
    if (price && price > 0) {
      return `${price.toFixed(8)} DEL`;
    }
    
    // Если ни один вариант не сработал
    return `0.00000000 DEL`;
  };

  const formatMarketCap = (marketCap: number) => {
    // Показываем капитализацию в DEL
    return `${formatNumber(marketCap)} DEL`;
  };

  // Пересчитываем капитализацию для каждого токена
  const tokensWithMarketCap = useMemo(() => {
    return tokens.map(token => {
      // Получаем эффективную цену
      let effectivePrice = token.price;
      if ((!effectivePrice || effectivePrice < 0.00000001) && token.raw_price) {
        try {
          effectivePrice = convertFromRawValue(token.raw_price);
        } catch (e) {
          console.error('Error converting raw price for market cap:', e);
        }
      }
      
      // Получаем эффективный current_supply
      let effectiveSupply = token.current_supply || 0;
      if ((!effectiveSupply || effectiveSupply < 0.00000001) && token.raw_current_supply) {
        try {
          effectiveSupply = convertFromRawValue(token.raw_current_supply);
        } catch (e) {
          console.error('Error converting raw supply for market cap:', e);
        }
      }
        
      return {
        ...token,
        market_cap: effectivePrice * effectiveSupply
      };
    });
  }, [tokens]);

  // Сортируем токены по капитализации
  const sortedTokens = useMemo(() => {
    return [...tokensWithMarketCap].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
  }, [tokensWithMarketCap]);

  // Создаем хэш-таблицу ранжирования для всех токенов
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedTokens.forEach((token, index) => {
      map.set(token.symbol, index + 1);
    });
    return map;
  }, [sortedTokens]);

  // Получаем топ-5 токенов для отображения
  const topTokens = useMemo(() => {
    return sortedTokens.slice(0, 5);
  }, [sortedTokens]);

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Топ по капитализации
      </h2>
      
      <div className="space-y-4">
        {topTokens.map((token, index) => (
          <div key={token.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <span className="text-xs font-semibold">{rankMap.get(token.symbol)}</span>
              </div>
              <div>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {token.symbol}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {token.name}
                </div>
              </div>
            </div>
            <div className={`text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="font-medium">{formatMarketCap(token.market_cap || 0)}</div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatPrice(token.price, token.raw_price)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Капитализация = цена × объем выпуска</p>
        </div>
      </div>
    </div>
  );
} 