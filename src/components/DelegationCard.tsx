import React, { useMemo, useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { TokenModal } from './TokenModal';

interface DelegationCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function DelegationCard({ tokens, darkMode = false }: DelegationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Отбираем токены с корректными данными о делегировании
  const tokensWithDelegation = useMemo(() => {
    return tokens.filter(token => 
      token.delegation_percentage !== undefined && 
      !isNaN(token.delegation_percentage) &&
      token.current_supply !== undefined &&
      token.current_supply > 0
    );
  }, [tokens]);

  // Сортируем токены по проценту делегирования
  const sortedTokens = useMemo(() => {
    return [...tokensWithDelegation]
      .sort((a, b) => (b.delegation_percentage || 0) - (a.delegation_percentage || 0));
  }, [tokensWithDelegation]);
  
  // Создаем хэш-таблицу ранжирования
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedTokens.forEach((token, index) => {
      map.set(token.symbol, index + 1);
    });
    return map;
  }, [sortedTokens]);

  const topDelegatedTokens = useMemo(() => {
    return sortedTokens.slice(0, 10);
  }, [sortedTokens]);

  // Рассчитываем средневзвешенный процент делегирования по всем токенам
  const weightedAverageDelegation = useMemo(() => {
    if (tokensWithDelegation.length === 0) return 0;
    
    // Суммируем (делегирование % * текущая эмиссия) для всех токенов
    const weightedSum = tokensWithDelegation.reduce((acc, token) => {
      return acc + (token.delegation_percentage || 0) * (token.current_supply || 0);
    }, 0);
    
    // Суммируем общую эмиссию всех токенов
    const totalSupply = tokensWithDelegation.reduce((acc, token) => {
      return acc + (token.current_supply || 0);
    }, 0);
    
    // Возвращаем средневзвешенное значение
    return totalSupply > 0 ? weightedSum / totalSupply : 0;
  }, [tokensWithDelegation]);
  
  // Функция форматирования значения для модального окна
  const formatDelegationValue = (value: any) => {
    const numValue = Number(value) || 0;
    return `${numValue.toFixed(2)}%`;
  };

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          ТОП-10 по делегированию
        </h2>
        <div className="flex items-center">
          <button 
            onClick={openModal}
            className={`text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-full transition-colors`}
          >
            {tokensWithDelegation.length} токенов
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Средний % делегирования
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {weightedAverageDelegation.toFixed(2)}%
          </span>
          <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            (от текущей эмиссии)
          </span>
        </div>
      </div>
      
      <div>
        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Топ по делегированию
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {topDelegatedTokens.map((token, index) => (
            <div key={token.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? 'bg-green-100 text-green-700' : 
                  index === 1 ? 'bg-green-50 text-green-600' :
                  index === 2 ? 'bg-emerald-50 text-emerald-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="text-xs font-semibold">{index + 1}</span>
                </div>
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {token.symbol}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(token.delegation_percentage || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="w-1/3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, token.delegation_percentage || 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Процент делегированных (застейканных) токенов от текущей эмиссии.</p>
        </div>
      </div>
      
      {/* Модальное окно с полным списком токенов */}
      <TokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokens={sortedTokens}
        title="Рейтинг токенов по делегированию"
        metricName="Делегировано"
        metricKey="delegation_percentage"
        formatValue={formatDelegationValue}
        darkMode={darkMode}
      />
    </div>
  );
} 