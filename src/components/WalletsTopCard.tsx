import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface WalletsTopCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function WalletsTopCard({ tokens, darkMode = false }: WalletsTopCardProps) {
  // Отбираем токены с данными о количестве кошельков
  const tokensWithWallets = useMemo(() => {
    return tokens.filter(token => 
      token.wallets_count !== undefined && 
      !isNaN(token.wallets_count) &&
      token.wallets_count > 0
    );
  }, [tokens]);

  // Сортируем токены по количеству кошельков
  const sortedTokens = useMemo(() => {
    return [...tokensWithWallets]
      .sort((a, b) => b.wallets_count - a.wallets_count);
  }, [tokensWithWallets]);
  
  // Получаем топ-10 токенов
  const topTokens = useMemo(() => {
    return sortedTokens.slice(0, 10);
  }, [sortedTokens]);

  // Общее количество кошельков в сети (максимальное значение как приблизительная оценка)
  const totalWallets = useMemo(() => {
    if (tokensWithWallets.length === 0) return 0;
    return Math.max(...tokensWithWallets.map(t => t.wallets_count));
  }, [tokensWithWallets]);

  // Форматирование числа с суффиксом для удобочитаемого отображения
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(0);
  };

  // Рассчитываем процент кошельков
  const calculatePercentage = (walletCount: number) => {
    return totalWallets > 0 ? (walletCount / totalWallets) * 100 : 0;
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Топ-10 по кошелькам
        </h2>
        <div className={`text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-1 rounded-full`}>
          {tokensWithWallets.length} токенов
        </div>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {topTokens.map((token, index) => (
          <div key={token.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                index === 0 ? 'bg-purple-100 text-purple-800' : 
                index === 1 ? 'bg-purple-50 text-purple-700' :
                index === 2 ? 'bg-violet-50 text-violet-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                <span className="text-xs font-semibold">{index + 1}</span>
              </div>
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {token.symbol}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatNumber(token.wallets_count)} кошельков
                </div>
              </div>
            </div>
            <div className="w-1/3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, calculatePercentage(token.wallets_count))}%` }}
                ></div>
              </div>
              <div className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {calculatePercentage(token.wallets_count).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Количество кошельков, имеющих токен на балансе или в делегировании</p>
        </div>
      </div>
    </div>
  );
} 