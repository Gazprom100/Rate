import React, { useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { Pagination } from './Pagination';

interface SupplyTableProps {
  tokens: Token[];
  darkMode?: boolean;
}

export function SupplyTable({ tokens, darkMode = false }: SupplyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Token>('supply_percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const ITEMS_PER_PAGE = 20;
  
  // Отбираем токены, у которых есть данные о supply и фильтруем по поиску
  const tokensWithSupply = tokens.filter(token => 
    (token.current_supply !== undefined || token.max_supply !== undefined) &&
    (searchTerm === '' || 
     token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     token.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Сортируем токены
  const sortedTokens = [...tokensWithSupply].sort((a, b) => {
    const aValue = a[sortBy] ?? 0;
    const bValue = b[sortBy] ?? 0;
    return sortOrder === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (aValue < bValue ? 1 : -1);
  });
  
  // Пагинация
  const totalPages = Math.ceil(sortedTokens.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const tokensForCurrentPage = sortedTokens.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const handleSort = (field: keyof Token) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '-';
    if (num === 0) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };
  
  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Выпуск токенов
        </h2>
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {tokensWithSupply.length} токенов
        </div>
      </div>
      
      {/* Поиск */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск токена..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={`w-full px-4 py-2 rounded-lg border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
      
      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                onClick={() => handleSort('symbol')}
              >
                Токен {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                onClick={() => handleSort('current_supply')}
              >
                Текущий выпуск {sortBy === 'current_supply' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                onClick={() => handleSort('max_supply')}
              >
                Максимум {sortBy === 'max_supply' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider cursor-pointer`}
                onClick={() => handleSort('supply_percentage')}
              >
                % от максимума {sortBy === 'supply_percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {tokensForCurrentPage.length > 0 ? (
              tokensForCurrentPage.map((token) => (
                <tr key={token.id} className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {token.symbol}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {formatNumber(token.current_supply)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {formatNumber(token.max_supply)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, token.supply_percentage || 0)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {(token.supply_percentage || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={4} 
                  className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {searchTerm ? 'Токены не найдены' : 'Нет данных о выпуске токенов'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Пагинация */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          darkMode={darkMode}
        />
      )}
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Отношение текущего выпуска токенов (Current Supply) к максимальному (Max Supply).</p>
        </div>
      </div>
    </div>
  );
} 