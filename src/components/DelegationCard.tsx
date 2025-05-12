import React, { useMemo, useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { SupplyTable } from './SupplyTable';

interface DelegationCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function DelegationCard({ tokens, darkMode = false }: DelegationCardProps) {
  const [showAllTokens, setShowAllTokens] = useState(false);

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
    <>
      <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Выпуск токенов
          </h2>
          <button
            onClick={() => setShowAllTokens(true)}
            className={`text-xs px-2 py-1 rounded ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все токены
          </button>
        </div>
        
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

      {/* Модальное окно для отображения всех токенов */}
      {showAllTokens && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto`}>
            <div className="p-1">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAllTokens(false)}
                  className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SupplyTable tokens={tokens} darkMode={darkMode} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 