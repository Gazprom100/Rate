import React from 'react';
import { Token } from '@/utils/decimalApi';

interface TokenTableProps {
  tokens: Token[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  timeFrame: string;
}

export const TokenTable: React.FC<TokenTableProps> = ({
  tokens,
  sortBy,
  sortDirection,
  onSort,
  timeFrame,
}) => {
  const headers = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price' },
    { key: 'reserve', label: 'Reserve' },
    { key: 'crr', label: 'CRR' },
    { key: 'wallets_count', label: 'Wallets' },
    { key: 'delegation_percentage', label: 'Delegation %' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => onSort(header.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                {header.label}
                {sortBy === header.key && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tokens.map((token) => (
            <tr key={token.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {token.symbol}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {token.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${token.price.toFixed(4)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${token.reserve.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {token.crr}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {token.wallets_count.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {token.delegation_percentage.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 