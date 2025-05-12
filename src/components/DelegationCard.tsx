import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface DelegationCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function DelegationCard({ tokens, darkMode = false }: DelegationCardProps) {
  // Отбираем токены, у которых есть данные о supply
  const tokensWithSupply = useMemo(() => {
    return tokens.filter(token => 
      token.current_supply !== undefined && 
      token.max_supply !== undefined && 
      token.max_supply > 0
    );
  }, [tokens]);
  
  // Топ токенов по проценту выпуска от максимума
  const topSupplyTokens = useMemo(() => {
    return [...tokensWithSupply]
      .sort((a, b) => (b.supply_percentage || 0) - (a.supply_percentage || 0))
      .slice(0, 5);
  }, [tokensWithSupply]);

  // Средний процент выпуска токенов
  const averageSupplyPercentage = useMemo(() => {
    if (tokensWithSupply.length === 0) return 0;
    const sum = tokensWithSupply.reduce((acc, token) => acc + (token.supply_percentage || 0), 0);
    return sum / tokensWithSupply.length;
  }, [tokensWithSupply]);

  const formatSupply = (num?: number) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Выпуск токенов
      </h2>
      
      <div className="mb-6">
        <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Средний % выпуска от максимума
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {averageSupplyPercentage.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div>
        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Топ токенов по выпуску
        </div>
        <div className="space-y-3">
          {topSupplyTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {token.symbol}
              </span>
              <div className="w-1/2">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, token.supply_percentage || 0)}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(token.supply_percentage || 0).toFixed(2)}%
                  </span>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {formatSupply(token.current_supply)} / {formatSupply(token.max_supply)}
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