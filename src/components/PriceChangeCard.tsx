import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface PriceChangeCardProps {
  tokens: Token[];
  timeFrame: string;
  priceChanges: Record<string, Record<string, number>>;
  darkMode?: boolean;
}

export function PriceChangeCard({ tokens, timeFrame, priceChanges, darkMode = false }: PriceChangeCardProps) {
  // Сортируем все токены по изменению цены (от наибольшего к наименьшему)
  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const changeA = priceChanges[a.symbol]?.[timeFrame] || 0;
      const changeB = priceChanges[b.symbol]?.[timeFrame] || 0;
      return changeB - changeA; // от большего к меньшему
    });
  }, [tokens, timeFrame, priceChanges]);

  // Создаем хэш-таблицу ранжирования
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

  const getPriceChangeClassName = (change: number) => {
    if (change > 0) return darkMode ? 'text-green-400' : 'text-green-600';
    if (change < 0) return darkMode ? 'text-red-400' : 'text-red-600';
    return darkMode ? 'text-gray-400' : 'text-gray-500';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getTimeFrameLabel = (tf: string) => {
    switch (tf) {
      case '24h': return '24ч';
      case '7d': return '7д';
      case '30d': return '30д';
      case '1y': return '1г';
      case 'all': return 'Всё время';
      default: return tf;
    }
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Изменение цены ({getTimeFrameLabel(timeFrame)})
      </h2>
      <div className="space-y-4">
        {topTokens.map((token, index) => {
          const change = priceChanges[token.symbol]?.[timeFrame] || 0;
          return (
            <div key={token.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  change > 0 ? (
                    index === 0 ? 'bg-green-100 text-green-700' : 
                    index === 1 ? 'bg-green-50 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  ) : (
                    index === 0 ? 'bg-red-100 text-red-700' : 
                    index === 1 ? 'bg-red-50 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  )
                }`}>
                  <span className="text-xs font-semibold">{rankMap.get(token.symbol)}</span>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {token.symbol}
                </span>
              </div>
              <div className={`flex items-center ${getPriceChangeClassName(change)}`}>
                <span className="text-lg font-bold mr-1">{getPriceChangeIcon(change)}</span>
                <span className="text-sm font-medium">
                  {change > 0 ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Показано изменение цены за выбранный период. Стрелки указывают направление изменения.</p>
        </div>
      </div>
    </div>
  );
} 