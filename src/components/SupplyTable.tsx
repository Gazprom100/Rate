import React, { useState } from 'react';
import { Token } from '@/utils/decimalApi';
import { Pagination } from './Pagination';

interface SupplyTableProps {
  tokens: Token[];
  darkMode?: boolean;
}

interface FilterRange {
  min: string;
  max: string;
}

export function SupplyTable({ tokens, darkMode = false }: SupplyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Token>('supply_percentage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  // Фильтры по диапазонам значений
  const [currentSupplyFilter, setCurrentSupplyFilter] = useState<FilterRange>({ min: '', max: '' });
  const [maxSupplyFilter, setMaxSupplyFilter] = useState<FilterRange>({ min: '', max: '' });
  const [percentageFilter, setPercentageFilter] = useState<FilterRange>({ min: '', max: '' });
  
  const ITEMS_PER_PAGE = 20;
  
  // Функция фильтрации по диапазону
  const isInRange = (value: number | undefined, range: FilterRange): boolean => {
    if (value === undefined) return false;
    
    const min = range.min !== '' ? parseFloat(range.min) : -Infinity;
    const max = range.max !== '' ? parseFloat(range.max) : Infinity;
    
    return value >= min && value <= max;
  };
  
  // Отбираем токены, у которых есть данные о supply и применяем фильтры
  const filteredTokens = tokens.filter(token => {
    // Базовая фильтрация - есть данные о supply и соответствие поисковому запросу
    const hasSupplyData = token.current_supply !== undefined || token.max_supply !== undefined;
    const matchesSearch = searchTerm === '' || 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Фильтрация по диапазонам
    const matchesCurrentSupply = !showFilters || 
      (currentSupplyFilter.min === '' && currentSupplyFilter.max === '') || 
      isInRange(token.current_supply, currentSupplyFilter);
    
    const matchesMaxSupply = !showFilters || 
      (maxSupplyFilter.min === '' && maxSupplyFilter.max === '') || 
      isInRange(token.max_supply, maxSupplyFilter);
    
    const matchesPercentage = !showFilters || 
      (percentageFilter.min === '' && percentageFilter.max === '') || 
      isInRange(token.supply_percentage, percentageFilter);
    
    return hasSupplyData && matchesSearch && matchesCurrentSupply && matchesMaxSupply && matchesPercentage;
  });
  
  // Сортируем токены
  const sortedTokens = [...filteredTokens].sort((a, b) => {
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
  
  // Обработчик изменения фильтров
  const handleFilterChange = (
    filterType: 'current_supply' | 'max_supply' | 'percentage',
    rangeType: 'min' | 'max',
    value: string
  ) => {
    // Валидируем, что введено число
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    // Обновляем соответствующий фильтр
    switch (filterType) {
      case 'current_supply':
        setCurrentSupplyFilter(prev => ({ ...prev, [rangeType]: value }));
        break;
      case 'max_supply':
        setMaxSupplyFilter(prev => ({ ...prev, [rangeType]: value }));
        break;
      case 'percentage':
        setPercentageFilter(prev => ({ ...prev, [rangeType]: value }));
        break;
    }
    
    // Сбрасываем на первую страницу при изменении фильтра
    setCurrentPage(1);
  };
  
  // Сброс всех фильтров
  const resetFilters = () => {
    setCurrentSupplyFilter({ min: '', max: '' });
    setMaxSupplyFilter({ min: '', max: '' });
    setPercentageFilter({ min: '', max: '' });
    setCurrentPage(1);
  };
  
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '-';
    if (num === 0) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };
  
  // Функция получения примеров сдвига запятой на 18 знаков
  const getDecimalExamples = () => {
    return (
      <div className={`p-4 rounded-lg mt-2 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
        <h4 className="font-medium mb-2">Преобразование значений в Decimal blockchain</h4>
        <p className="text-sm mb-2">
          Все числовые значения в блокчейне Decimal хранятся со сдвигом на 18 знаков вправо. 
          При отображении мы перемещаем запятую на 18 знаков влево.
        </p>
        <div className="text-sm">
          <p className="mb-1">Примеры:</p>
          <ul className="list-disc list-inside">
            <li>1 токен = 1000000000000000000 (10<sup>18</sup>) в блокчейне</li>
            <li>0.5 токена = 500000000000000000 (5×10<sup>17</sup>) в блокчейне</li>
            <li>1000 токенов = 1000000000000000000000 (10<sup>21</sup>) в блокчейне</li>
          </ul>
        </div>
        <p className="text-sm mt-2">
          Все значения в таблице и фильтрах уже преобразованы — вы работаете с реальными количествами токенов.
        </p>
      </div>
    );
  };
  
  return (
    <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-lg shadow p-6`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Выпуск токенов
          </h2>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Информация о преобразовании значений"
          >
            <span className="inline-block w-3 h-3 text-center">i</span>
          </button>
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {filteredTokens.length} токенов
        </div>
      </div>
      
      {/* Информация о преобразовании значений */}
      {showInfo && getDecimalExamples()}
      
      {/* Поиск и кнопка фильтров */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Поиск токена..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } flex items-center gap-1`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Фильтры
          </button>
        </div>
        
        {/* Блок расширенных фильтров */}
        {showFilters && (
          <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Фильтры по диапазону
              </h3>
              <button
                onClick={resetFilters}
                className={`text-xs px-2 py-1 rounded ${
                  darkMode 
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Сбросить фильтры
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Фильтр по текущему выпуску */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Текущий выпуск
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="От"
                    value={currentSupplyFilter.min}
                    onChange={(e) => handleFilterChange('current_supply', 'min', e.target.value)}
                    className={`w-full px-3 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <input
                    type="text"
                    placeholder="До"
                    value={currentSupplyFilter.max}
                    onChange={(e) => handleFilterChange('current_supply', 'max', e.target.value)}
                    className={`w-full px-3 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                </div>
              </div>
              
              {/* Фильтр по максимальному выпуску */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Максимальный выпуск
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="От"
                    value={maxSupplyFilter.min}
                    onChange={(e) => handleFilterChange('max_supply', 'min', e.target.value)}
                    className={`w-full px-3 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <input
                    type="text"
                    placeholder="До"
                    value={maxSupplyFilter.max}
                    onChange={(e) => handleFilterChange('max_supply', 'max', e.target.value)}
                    className={`w-full px-3 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                </div>
              </div>
              
              {/* Фильтр по проценту выпуска */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Процент от максимума (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="От"
                    value={percentageFilter.min}
                    onChange={(e) => handleFilterChange('percentage', 'min', e.target.value)}
                    className={`w-full px-3 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <input
                    type="text"
                    placeholder="До"
                    value={percentageFilter.max}
                    onChange={(e) => handleFilterChange('percentage', 'max', e.target.value)}
                    className={`w-full px-3 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                </div>
              </div>
            </div>
            <div className={`text-xs mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Примечание: Все значения преобразованы из формата блокчейна (поделены на 10<sup>18</sup>).
            </div>
          </div>
        )}
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
                    {token.raw_current_supply && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        raw: {token.raw_current_supply.length > 10 ? 
                          token.raw_current_supply.substring(0, 4) + '...' + 
                          token.raw_current_supply.substring(token.raw_current_supply.length - 4) 
                          : token.raw_current_supply}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    {formatNumber(token.max_supply)}
                    {token.raw_max_supply && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        raw: {token.raw_max_supply.length > 10 ? 
                          token.raw_max_supply.substring(0, 4) + '...' + 
                          token.raw_max_supply.substring(token.raw_max_supply.length - 4) 
                          : token.raw_max_supply}
                      </div>
                    )}
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
                  {filteredTokens.length === 0 ? 'Токены не найдены. Попробуйте изменить фильтры.' : 'Нет данных о выпуске токенов'}
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
          <p className="mt-1">Все значения преобразованы с учетом смещения запятой на 18 знаков влево (разделены на 10<sup>18</sup>).</p>
        </div>
      </div>
    </div>
  );
} 