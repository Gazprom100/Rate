import React from 'react';
import { Token } from '@/utils/decimalApi';

interface PriceChangeCardProps {
  tokens: Token[];
  timeFrame: string;
  priceChanges: Record<string, Record<string, number>>;
  darkMode?: boolean;
}

export function PriceChangeCard({ tokens, timeFrame, priceChanges, darkMode = false }: PriceChangeCardProps) {
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
        {tokens.map((token) => {
          const change = priceChanges[token.symbol]?.[timeFrame] || 0;
          return (
            <div key={token.id} className="flex items-center justify-between">
              <div className="flex items-center">
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