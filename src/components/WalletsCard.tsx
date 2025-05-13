import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface WalletsCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function WalletsCard({ tokens, darkMode = false }: WalletsCardProps) {
  // Сортируем все токены по количеству кошельков
  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => b.wallets_count - a.wallets_count);
  }, [tokens]);
  
  // Создаем хэш-таблицу ранжирования
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedTokens.forEach((token, index) => {
      map.set(token.symbol, index + 1);
    });
    return map;
  }, [sortedTokens]);

  // Топ-5 токенов по количеству кошельков
  const topTokens = useMemo(() => {
    return sortedTokens.slice(0, 5);
  }, [sortedTokens]);

  // Общее количество кошельков в сети
  const totalWallets = useMemo(() => {
    // Берем максимальное количество кошельков как ориентировочное общее количество
    // Обычно токен DEL есть на большинстве кошельков
    const maxWallets = Math.max(...tokens.map(t => t.wallets_count));
    return maxWallets;
  }, [tokens]);

  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(0);
  };

  const calculatePercentage = (walletCount: number) => {
    return totalWallets > 0 ? (walletCount / totalWallets) * 100 : 0;
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Распространение
      </h2>
      
      <div className="mb-6">
        <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Всего кошельков в сети
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(totalWallets)}
          </span>
        </div>
      </div>
      
      <div>
        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Топ токенов по кошелькам
        </div>
        <div className="space-y-3">
          {topTokens.map((token, index) => (
            <div key={token.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? 'bg-purple-100 text-purple-700' : 
                  index === 1 ? 'bg-purple-50 text-purple-600' :
                  index === 2 ? 'bg-violet-50 text-violet-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="text-xs font-semibold">{rankMap.get(token.symbol)}</span>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {token.symbol}
                </span>
              </div>
              <div className="w-1/2">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, calculatePercentage(token.wallets_count))}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatNumber(token.wallets_count)}
                  </span>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {calculatePercentage(token.wallets_count).toFixed(2)}% кошельков
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Количество кошельков, на которых есть токен на балансе или в делегировании.</p>
        </div>
      </div>
    </div>
  );
} 