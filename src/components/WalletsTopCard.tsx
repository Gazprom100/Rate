import React, { useMemo, useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { TokenModal } from './TokenModal';

interface WalletsTopCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function WalletsTopCard({ tokens, darkMode = false }: WalletsTopCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  // Обычно это количество кошельков с DEL (основной токен сети)
  const totalWallets = useMemo(() => {
    if (tokensWithWallets.length === 0) return 0;
    
    // Находим токен DEL, если он есть
    const delToken = tokensWithWallets.find(t => t.symbol === 'DEL');
    if (delToken) {
      return delToken.wallets_count;
    }
    
    // Иначе берем максимальное значение как приблизительную оценку
    return Math.max(...tokensWithWallets.map(t => t.wallets_count));
  }, [tokensWithWallets]);
  
  // Оценка распределения делегаторов и держателей
  const walletDistributionStats = useMemo(() => {
    // Выбираем токены, у которых есть данные о делегировании
    const tokensWithDelegation = topTokens.filter(token => 
      token.delegation_percentage !== undefined && 
      !isNaN(token.delegation_percentage) &&
      token.current_supply !== undefined
    );
    
    if (tokensWithDelegation.length === 0) {
      return {
        hasDelegationData: false,
        estimatedDelegators: 0,
        estimatedHolders: 0,
        estimatedOverlap: 0
      };
    }
    
    // Находим средний процент делегирования среди топ-токенов
    const avgDelegationPercentage = tokensWithDelegation.reduce(
      (sum, token) => sum + (token.delegation_percentage || 0), 
      0
    ) / tokensWithDelegation.length;
    
    // Оценка количества кошельков, которые занимаются делегированием
    // (Очень приблизительная, так как нет точных данных)
    const estimatedDelegators = Math.floor(totalWallets * (avgDelegationPercentage / 100) * 0.5);
    
    // Оценка количества кошельков, которые просто держат токены
    const estimatedHolders = totalWallets - estimatedDelegators;
    
    // Оценка количества кошельков, которые и делегируют, и держат токены
    // (Допускаем, что примерно 30% делегаторов также держат токены на балансе)
    const estimatedOverlap = Math.floor(estimatedDelegators * 0.3);
    
    return {
      hasDelegationData: true,
      avgDelegationPercentage,
      estimatedDelegators,
      estimatedHolders,
      estimatedOverlap
    };
  }, [topTokens, totalWallets]);

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

  // Функция форматирования значения для модального окна
  const formatWalletValue = (value: any) => {
    const numValue = Number(value) || 0;
    return `${formatNumber(numValue)} (${calculatePercentage(numValue).toFixed(1)}%)`;
  };

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          ТОП-10 по кошелькам
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-1 rounded-full`}>
            {tokensWithWallets.length} токенов
          </div>
          <button 
            onClick={openModal}
            className={`text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-full transition-colors`}
          >
            100 токенов
          </button>
        </div>
      </div>
      
      {/* Общая статистика по кошелькам */}
      <div className={`mb-4 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className={`text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-700'} font-medium`}>
          Всего кошельков в сети
        </div>
        <div className="flex items-center mb-2">
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(totalWallets)}
          </span>
          <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            уникальных адресов
          </span>
        </div>
        
        {walletDistributionStats.hasDelegationData && (
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            <div className="flex justify-between items-center">
              <span>Держатели балансов:</span>
              <span className="font-medium">
                {formatNumber(walletDistributionStats.estimatedHolders)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-0.5">
              <span>Делегаторы:</span>
              <span className="font-medium">
                {formatNumber(walletDistributionStats.estimatedDelegators)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-0.5">
              <span>Пересечение (оценка):</span>
              <span className="font-medium">
                {formatNumber(walletDistributionStats.estimatedOverlap)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
          <p>Показано общее количество уникальных адресов, имеющих токен на балансе или в делегировании.</p>
          <p className="mt-1">Если адрес имеет токен и на балансе, и в делегировании, он учитывается один раз.</p>
          {walletDistributionStats.hasDelegationData && (
            <p className="mt-1">Распределение кошельков между держателями и делегаторами - ориентировочная оценка.</p>
          )}
        </div>
      </div>
      
      {/* Модальное окно с полным списком токенов */}
      <TokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokens={sortedTokens}
        title="Рейтинг токенов по количеству кошельков"
        metricName="Количество кошельков"
        metricKey="wallets_count"
        formatValue={formatWalletValue}
        darkMode={darkMode}
      />
    </div>
  );
} 