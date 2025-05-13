import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface SupplyCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function SupplyCard({ tokens, darkMode = false }: SupplyCardProps) {
  // Отбираем токены с корректными данными о выпуске
  const tokensWithSupply = useMemo(() => {
    return tokens.filter(token => 
      token.current_supply !== undefined && 
      token.max_supply !== undefined &&
      token.max_supply > 0 &&
      !isNaN(token.current_supply) &&
      !isNaN(token.max_supply)
    );
  }, [tokens]);

  // Рассчитываем процент выпуска для каждого токена
  const tokensWithPercentage = useMemo(() => {
    return tokensWithSupply.map(token => ({
      ...token,
      supply_percentage: (token.current_supply! / token.max_supply!) * 100
    }));
  }, [tokensWithSupply]);

  // Сортируем токены по проценту выпуска
  const sortedTokens = useMemo(() => {
    return [...tokensWithPercentage]
      .sort((a, b) => b.supply_percentage - a.supply_percentage);
  }, [tokensWithPercentage]);
  
  // Создаем хэш-таблицу ранжирования
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedTokens.forEach((token, index) => {
      map.set(token.symbol, index + 1);
    });
    return map;
  }, [sortedTokens]);

  // Топ-10 токенов по проценту выпуска
  const topSupplyTokens = useMemo(() => {
    return sortedTokens.slice(0, 10);
  }, [sortedTokens]);

  // Рассчитываем средневзвешенный процент выпуска по всем токенам
  const weightedAverageSupplyPercentage = useMemo(() => {
    if (tokensWithPercentage.length === 0) return 0;
    
    // Суммируем (процент выпуска * максимальный выпуск) для всех токенов
    const weightedSum = tokensWithPercentage.reduce((acc, token) => {
      return acc + token.supply_percentage * (token.max_supply || 0);
    }, 0);
    
    // Суммируем максимальную эмиссию всех токенов
    const totalMaxSupply = tokensWithPercentage.reduce((acc, token) => {
      return acc + (token.max_supply || 0);
    }, 0);
    
    // Возвращаем средневзвешенное значение
    return totalMaxSupply > 0 ? weightedSum / totalMaxSupply : 0;
  }, [tokensWithPercentage]);

  // Форматирование числа с суффиксом для удобочитаемого отображения
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          ТОП-10 по эмиссии
        </h2>
        <div className={`text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-1 rounded-full`}>
          {tokensWithPercentage.length} токенов
        </div>
      </div>
      
      <div className="mb-6">
        <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Средний % выпуска от максимума
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {weightedAverageSupplyPercentage.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="mb-5">
        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Топ токенов по выпуску
        </div>
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
          {topSupplyTokens.map((token, index) => (
            <div key={token.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    index === 0 ? 'bg-blue-100 text-blue-700' : 
                    index === 1 ? 'bg-blue-50 text-blue-600' :
                    index === 2 ? 'bg-indigo-50 text-indigo-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="text-xs font-semibold">{rankMap.get(token.symbol)}</span>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {token.symbol}
                  </span>
                </div>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {token.supply_percentage.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex flex-col w-full">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, token.supply_percentage)}%` }}
                  ></div>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatNumber(token.current_supply || 0)} / {formatNumber(token.max_supply || 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Отношение текущего выпуска токенов (Current Supply) к максимальному (Max Supply).</p>
        </div>
      </div>
    </div>
  );
} 