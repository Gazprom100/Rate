import React from 'react';
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
    // Check if price is extremely small (likely due to conversion issues)
    if (price === 0 || price < 0.00000001) {
      // Try to format using the raw value if available
      if (rawPrice) {
        try {
          const convertedPrice = convertFromRawValue(rawPrice);
          return `${convertedPrice.toFixed(8)} DEL`;
        } catch (e) {
          console.error('Error formatting price from raw value:', e);
        }
      }
    }
    
    // Default formatting for normal price values
    return `${price.toFixed(8)} DEL`;
  };

  const formatMarketCap = (marketCap: number) => {
    // Показываем капитализацию в DEL
    return `${formatNumber(marketCap)} DEL`;
  };

  // Пересчитываем капитализацию для каждого токена
  const tokensWithMarketCap = tokens.map(token => {
    // Use converted values or fallback to raw conversion if price is too small
    const effectivePrice = (token.price === 0 || token.price < 0.00000001) && token.raw_price
      ? convertFromRawValue(token.raw_price)
      : token.price;
    
    // Используем current_supply вместо reserve для расчета капитализации
    const currentSupply = token.current_supply || 0;
      
    return {
      ...token,
      market_cap: effectivePrice * currentSupply
    };
  });

  // Сортируем токены по капитализации
  const sortedTokens = [...tokensWithMarketCap].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Топ по капитализации
      </h2>
      
      <div className="space-y-4">
        {sortedTokens.map((token, index) => (
          <div key={token.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <span className="text-xs font-semibold">{index + 1}</span>
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