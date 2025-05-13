import React from 'react';
import { Token } from '@/utils/decimalApi';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  title: string;
  metricName: string;
  metricKey: keyof Token;
  formatValue?: (value: any, token?: Token) => string;
  darkMode?: boolean;
}

export function TokenModal({ 
  isOpen, 
  onClose, 
  tokens, 
  title, 
  metricName, 
  metricKey, 
  formatValue = (value) => String(value || 0),
  darkMode = false 
}: TokenModalProps) {
  if (!isOpen) return null;

  // Клик по фону закрывает модальное окно
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Форматирование числа
  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className={`text-2xl ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Рейтинг
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Токен
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    {metricName}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {tokens.map((token, index) => (
                  <tr key={token.id} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-50 text-amber-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="text-xs font-semibold">{index + 1}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="font-medium">{token.symbol}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{token.name}</div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatValue(token[metricKey], token)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
} 