import React from 'react';
import { Token } from '@/utils/decimalApi';

interface TokenTableProps {
  tokens: Token[];
  timeFrame: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function TokenTable({ tokens, timeFrame, sortBy, sortOrder, onSort }: TokenTableProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(2) + '%';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('symbol')}
            >
              Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('price')}
            >
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('market_cap')}
            >
              Market Cap {sortBy === 'market_cap' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('reserve')}
            >
              Reserve {sortBy === 'reserve' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('crr')}
            >
              CRR {sortBy === 'crr' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('wallets_count')}
            >
              Wallets {sortBy === 'wallets_count' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('delegation_percentage')}
            >
              Delegation {sortBy === 'delegation_percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tokens.map((token) => (
            <tr key={token.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                <div className="text-sm text-gray-500">{token.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${token.price.toFixed(6)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatNumber(token.market_cap || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatNumber(token.reserve)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatPercentage(token.crr)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatNumber(token.wallets_count)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatPercentage(token.delegation_percentage)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 