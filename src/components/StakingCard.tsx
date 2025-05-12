import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface StakingCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function StakingCard({ tokens, darkMode = false }: StakingCardProps) {
  // Отбираем токены с корректными данными о делегировании
  const tokensWithDelegation = useMemo(() => {
    return tokens.filter(token => 
      token.delegation_percentage !== undefined && 
      !isNaN(token.delegation_percentage)
    );
  }, [tokens]);

  const topDelegatedTokens = useMemo(() => {
    return [...tokensWithDelegation]
      .sort((a, b) => (b.delegation_percentage || 0) - (a.delegation_percentage || 0))
      .slice(0, 5);
  }, [tokensWithDelegation]);

  const averageDelegation = useMemo(() => {
    if (tokensWithDelegation.length === 0) return 0;
    const sum = tokensWithDelegation.reduce((acc, token) => acc + (token.delegation_percentage || 0), 0);
    return sum / tokensWithDelegation.length;
  }, [tokensWithDelegation]);

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Стейкинг
      </h2>
      
      <div className="mb-6">
        <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Средний % делегирования
        </div>
        <div className="flex items-center">
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {averageDelegation.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div>
        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Топ по делегированию
        </div>
        <div className="space-y-3">
          {topDelegatedTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {token.symbol}
              </span>
              <div className="w-1/2">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, token.delegation_percentage || 0)}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(token.delegation_percentage || 0).toFixed(2)}%
                  </span>
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
    </div>
  );
} 