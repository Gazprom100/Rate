import React, { useMemo, useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { TokenModal } from './TokenModal';

interface PriceChangeCardProps {
  tokens: Token[];
  timeFrame: string;
  priceChanges: Record<string, Record<string, number>>;
  loading?: boolean;
  darkMode?: boolean;
}

// Расширенный тип токена с дополнительным свойством для изменения цены
interface TokenWithPriceChange extends Token {
  price_change: number;
}

export function PriceChangeCard({ tokens, timeFrame, priceChanges, loading = false, darkMode = false }: PriceChangeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Сортируем только токены с положительным изменением цены
  const sortedTokens = useMemo(() => {
    return [...tokens]
      .filter(token => {
        const change = priceChanges[token.symbol]?.[timeFrame] || 0;
        return change > 0; // Отбираем только токены с положительным изменением цены
      })
      .sort((a, b) => {
        const changeA = priceChanges[a.symbol]?.[timeFrame] || 0;
        const changeB = priceChanges[b.symbol]?.[timeFrame] || 0;
        return changeB - changeA; // от большего к меньшему
      });
  }, [tokens, timeFrame, priceChanges]);

  // Создаем хэш-таблицу ранжирования
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedTokens.forEach((token, index) => {
      map.set(token.symbol, index + 1);
    });
    return map;
  }, [sortedTokens]);

  // Получаем топ-10 токенов для отображения
  const topTokens = useMemo(() => {
    return sortedTokens.slice(0, 10);
  }, [sortedTokens]);

  // Добавляем свойство price_change временно к токенам для отображения в модальном окне
  const tokensWithChange = useMemo(() => {
    return sortedTokens.map(token => ({
      ...token,
      price_change: priceChanges[token.symbol]?.[timeFrame] || 0
    })) as TokenWithPriceChange[];
  }, [sortedTokens, timeFrame, priceChanges]);

  const getPriceChangeClassName = (change: number) => {
    if (change > 0) return darkMode ? 'text-green-400' : 'text-green-600';
    if (change < 0) return darkMode ? 'text-red-400' : 'text-red-600';
    return darkMode ? 'text-gray-400' : 'text-gray-500';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getTimeFrameLabel = (tf: string) => {
    switch (tf) {
      case '24h': return '24ч';
      case '7d': return '7д';
      case '30d': return '30д';
      case '1y': return '1г';
      case 'all': return 'Всё время';
      default: return tf;
    }
  };
  
  // Функция для прокрутки к таблице токенов
  const scrollToTokenTable = () => {
    // Находим элемент таблицы по id и прокручиваем к нему
    const tokenTable = document.getElementById('token-table');
    if (tokenTable) {
      tokenTable.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          ТОП-10 по росту цены
        </h2>
        <div className="flex items-center">
          <button 
            onClick={openModal}
            className={`text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 rounded-full transition-colors`}
          >
            {sortedTokens.length} токенов | {timeFrame.toUpperCase()}
          </button>
        </div>
      </div>
      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
        {topTokens.map((token, index) => {
          const change = priceChanges[token.symbol]?.[timeFrame] || 0;
          return (
            <div key={token.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? 'bg-green-100 text-green-700' : 
                  index === 1 ? 'bg-green-50 text-green-600' :
                  index === 2 ? 'bg-green-50 text-green-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="text-xs font-semibold">{index + 1}</span>
                </div>
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {token.symbol}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {token.name}
                  </div>
                </div>
              </div>
              <div className={`flex items-center ${getPriceChangeClassName(change)}`}>
                <span className="text-lg font-bold mr-1">{getPriceChangeIcon(change)}</span>
                <span className="text-sm font-medium">
                  +{change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Показано изменение цены за выбранный период. Отображаются только растущие токены.</p>
        </div>
      </div>
      
      {/* Модальное окно с полным списком токенов */}
      <TokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokens={sortedTokens}
        title={`Рейтинг токенов по изменению цены (${getTimeFrameLabel(timeFrame)})`}
        metricName="Изменение цены"
        metricKey="symbol"
        formatValue={(value: any, token?: Token) => {
          if (!token) return '0%';
          const change = priceChanges[token.symbol]?.[timeFrame] || 0;
          const icon = change > 0 ? '↗' : change < 0 ? '↘' : '→';
          const prefix = change > 0 ? '+' : '';
          return `${icon} ${prefix}${change.toFixed(2)}%`;
        }}
        darkMode={darkMode}
      />
    </div>
  );
}