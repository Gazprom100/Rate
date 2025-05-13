import React, { useMemo, useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { TokenModal } from './TokenModal';

interface TopTokensCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function TopTokensCard({ tokens, darkMode = false }: TopTokensCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Отбираем токены с корректными данными для расчета капитализации
  const tokensWithMarketCap = useMemo(() => {
    return tokens.filter(token => 
      token.price !== undefined && 
      token.current_supply !== undefined && 
      !isNaN(token.price) &&
      !isNaN(token.current_supply) &&
      token.current_supply > 0
    );
  }, [tokens]);

  // Сортируем токены по капитализации (market_cap)
  const sortedTokens = useMemo(() => {
    return [...tokensWithMarketCap]
      .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
  }, [tokensWithMarketCap]);
  
  // Получаем топ-10 токенов
  const topTokens = useMemo(() => {
    return sortedTokens.slice(0, 10);
  }, [sortedTokens]);

  // Форматирование числа с суффиксом для удобочитаемого отображения
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  // Рассчитываем общую капитализацию
  const totalMarketCap = useMemo(() => {
    return tokensWithMarketCap.reduce((sum, token) => sum + (token.market_cap || 0), 0);
  }, [tokensWithMarketCap]);

  // Рассчитываем процент капитализации
  const calculatePercentage = (marketCap: number) => {
    return totalMarketCap > 0 ? (marketCap / totalMarketCap) * 100 : 0;
  };
  
  // Функция форматирования значения для модального окна
  const formatCapValue = (value: any) => {
    const numValue = Number(value) || 0;
    return `${formatNumber(numValue)} DEL (${calculatePercentage(numValue).toFixed(1)}%)`;
  };

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          ТОП-10 по капитализации
        </h2>
        <div className="flex items-center">
          <button 
            onClick={openModal}
            className={`text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-full transition-colors`}
          >
            {tokensWithMarketCap.length} токенов
          </button>
        </div>
      </div>
      
      <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
        {topTokens.map((token, index) => (
          <div key={token.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                index === 1 ? 'bg-gray-100 text-gray-800' :
                index === 2 ? 'bg-amber-50 text-amber-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                <span className="text-xs font-semibold">{index + 1}</span>
              </div>
              
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {token.symbol.toLowerCase()}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {token.name}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatNumber(token.market_cap || 0)} DEL
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {calculatePercentage(token.market_cap || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Капитализация = цена × объем выпуска</p>
        </div>
      </div>

      {/* Модальное окно с полным списком токенов */}
      <TokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokens={sortedTokens}
        title="Рейтинг токенов по капитализации"
        metricName="Капитализация"
        metricKey="market_cap"
        formatValue={formatCapValue}
        darkMode={darkMode}
      />
    </div>
  );
} 