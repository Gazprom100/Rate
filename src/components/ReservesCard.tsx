import React, { useMemo } from 'react';
import { Token } from '@/utils/decimalApi';

interface ReservesCardProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function ReservesCard({ tokens, darkMode = false }: ReservesCardProps) {
  const topReserveTokens = useMemo(() => {
    return [...tokens]
      .sort((a, b) => b.reserve - a.reserve)
      .slice(0, 5);
  }, [tokens]);

  const totalReserve = useMemo(() => {
    return tokens.reduce((acc, token) => acc + token.reserve, 0);
  }, [tokens]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const calculatePercentage = (value: number) => {
    return totalReserve > 0 ? (value / totalReserve) * 100 : 0;
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Резервы DEL
      </h2>
      
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
        <div className="space-y-3">
          {topReserveTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {token.symbol}
              </span>
              <div className="w-1/2">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, calculatePercentage(token.reserve))}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatNumber(token.reserve)}
                  </span>
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
    </div>
  );
} 