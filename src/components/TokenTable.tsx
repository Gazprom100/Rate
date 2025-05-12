import React from 'react';
import { Token, convertFromRawValue } from '@/utils/decimalApi';

interface TokenTableProps {
  tokens: Token[];
  timeFrame: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  darkMode?: boolean;
  priceChanges?: Record<string, Record<string, number>>;
}

export function TokenTable({ 
  tokens, 
  timeFrame, 
  sortBy, 
  sortOrder, 
  onSort, 
  darkMode = false,
  priceChanges = {}
}: TokenTableProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(2) + '%';
  };

  const formatPrice = (price: number, rawPrice?: string) => {
    // Проверим сначала наличие исходного значения (raw_price)
    if (rawPrice && rawPrice !== '0') {
      try {
        const convertedPrice = convertFromRawValue(rawPrice);
        if (convertedPrice && convertedPrice > 0) {
          return `${convertedPrice.toFixed(8)} DEL`;
        }
      } catch (e) {
        console.error('Error formatting price from raw value:', e);
      }
    }
    
    // Затем проверяем обычную цену
    if (price && price > 0) {
      return `${price.toFixed(8)} DEL`;
    }
    
    // Если ни один вариант не сработал
    return `0.00000000 DEL`;
  };

  const formatMarketCap = (marketCap: number) => {
    // Показываем капитализацию в DEL
    return `${formatNumber(marketCap)} DEL`;
  };

  const getPriceChangeClassName = (change: number) => {
    if (change > 0) return darkMode ? 'text-green-400' : 'text-green-600';
    if (change < 0) return darkMode ? 'text-red-400' : 'text-red-600';
    return darkMode ? 'text-gray-400' : 'text-gray-500';
  };

  const getPriceChangeText = (symbol: string) => {
    if (!priceChanges[symbol] || !priceChanges[symbol][timeFrame]) {
      return '0.00%';
    }
    
    const change = priceChanges[symbol][timeFrame];
    return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
          <tr>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('symbol')}
            >
              Токен {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('price')}
            >
              Цена (DEL) {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('market_cap')}
            >
              Капитализация (DEL) {sortBy === 'market_cap' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
            >
              Изменение ({timeFrame})
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('reserve')}
            >
              Резерв DEL {sortBy === 'reserve' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('crr')}
            >
              CRR {sortBy === 'crr' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('wallets_count')}
            >
              Кошельки {sortBy === 'wallets_count' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer hover:bg-opacity-80`}
              onClick={() => onSort('delegation_percentage')}
            >
              Делегировано % {sortBy === 'delegation_percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {tokens.map((token) => (
            <tr key={token.id} className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-150`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`flex items-center`}>
                  <div className="ml-4">
                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{token.symbol}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{token.name}</div>
                  </div>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatPrice(token.price, token.raw_price)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatMarketCap(token.market_cap || 0)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getPriceChangeClassName(priceChanges[token.symbol]?.[timeFrame] || 0)}`}>
                {getPriceChangeText(token.symbol)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatNumber(token.reserve)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatPercentage(token.crr)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatNumber(token.wallets_count)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {formatPercentage(token.delegation_percentage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 