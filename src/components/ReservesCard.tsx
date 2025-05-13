import React, { useMemo, useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { TokenModal } from './TokenModal';

interface ReservesCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function ReservesCard({ tokens, darkMode = false }: ReservesCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Отбираем токены с корректными данными о резервах
  const tokensWithReserves = useMemo(() => {
    return tokens.filter(token => 
      token.reserve !== undefined && 
      !isNaN(token.reserve) &&
      token.reserve > 0
    );
  }, [tokens]);

  // Сортируем все токены по резерву
  const sortedTokens = useMemo(() => {
    return [...tokensWithReserves].sort((a, b) => b.reserve - a.reserve);
  }, [tokensWithReserves]);
  
  // Создаем хэш-таблицу ранжирования
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedTokens.forEach((token, index) => {
      map.set(token.symbol, index + 1);
    });
    return map;
  }, [sortedTokens]);

  // Получаем топ-10 токенов
  const topReserveTokens = useMemo(() => {
    return sortedTokens.slice(0, 10);
  }, [sortedTokens]);

  // Вычисляем общий резерв
  const totalReserve = useMemo(() => {
    return tokensWithReserves.reduce((acc, token) => acc + token.reserve, 0);
  }, [tokensWithReserves]);

  // Форматирование числа с суффиксом для удобочитаемого отображения
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  // Рассчитываем процент от общего резерва
  const calculatePercentage = (value: number) => {
    return totalReserve > 0 ? (value / totalReserve) * 100 : 0;
  };
  
  // Функция форматирования значения для модального окна
  const formatReserveValue = (value: any) => {
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
          ТОП-10 по резервам DEL
        </h2>
        <div className="flex items-center">
          <button 
            onClick={openModal}
            className={`text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-full transition-colors`}
          >
            {tokensWithReserves.length} токенов
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Общий резерв DEL
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(totalReserve)}
          </span>
        </div>
      </div>
      
      <div>
        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Топ токенов по резерву
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {topReserveTokens.map((token, index) => (
            <div key={token.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? 'bg-indigo-100 text-indigo-700' : 
                  index === 1 ? 'bg-indigo-50 text-indigo-600' :
                  index === 2 ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="text-xs font-semibold">{index + 1}</span>
                </div>
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {token.symbol}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatNumber(token.reserve)} DEL
                  </div>
                </div>
              </div>
              <div className="w-1/3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, calculatePercentage(token.reserve))}%` }}
                  ></div>
                </div>
                <div className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {calculatePercentage(token.reserve).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Резерв показывает количество DEL, обеспечивающих токен.</p>
        </div>
      </div>
      
      {/* Модальное окно с полным списком токенов */}
      <TokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokens={sortedTokens}
        title="Рейтинг токенов по резервам DEL"
        metricName="Резерв"
        metricKey="reserve"
        formatValue={formatReserveValue}
        darkMode={darkMode}
      />
    </div>
  );
} 