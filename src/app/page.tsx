'use client';

import React, { useState, useEffect } from 'react';
import { TokenTable } from '@/components/TokenTable';
import { TokenChart } from '@/components/TokenChart';
import { fetchTokens, fetchTokenHistory, Token, calculateGrowth } from '@/utils/decimalApi';
import { PriceChangeCard } from '@/components/PriceChangeCard';
import { DelegationCard } from '@/components/DelegationCard';
import { ReservesCard } from '@/components/ReservesCard';
import { TopTokensCard } from '@/components/TopTokensCard';
import { TokenPieChart } from '@/components/TokenPieChart';
import { TokenBarChart } from '@/components/TokenBarChart';
import { SupplyCard } from '@/components/SupplyCard';
import { Pagination } from '@/components/Pagination';
import { SearchFilter } from '@/components/SearchFilter';
import { WalletsTopCard } from '@/components/WalletsTopCard';

const timeFrames = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

const chartTypes = [
  { label: 'Линейный', value: 'line' },
  { label: 'Столбчатый', value: 'bar' },
  { label: 'Круговой', value: 'pie' },
];

const metrics = [
  { label: 'Цена', value: 'price' },
  { label: 'Капитализация', value: 'market_cap' },
  { label: 'Резерв DEL', value: 'reserve' },
  { label: 'Делегировано %', value: 'delegation_percentage' },
  { label: 'Выпуск от максимума %', value: 'supply_percentage' },
];

const TOKENS_PER_PAGE = 20;

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('24h');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('price');
  const [darkMode, setDarkMode] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Record<string, Record<string, number>>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        setDebugInfo('Начинаем загрузку токенов...');
        
        const data = await fetchTokens();
        setDebugInfo(prev => `${prev}\nУспешно загружено ${data.length} токенов`);
        setTokens(data);
        
        // Загружаем исторические данные только для топ-10 токенов по капитализации для карточек
        const sortedByMarketCap = [...data].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
        const top10Tokens = sortedByMarketCap.slice(0, 10);
        const changesData: Record<string, Record<string, number>> = {};
        
        for (const token of top10Tokens) {
          changesData[token.symbol] = {};
          
          for (const tf of timeFrames) {
            try {
              const history = await fetchTokenHistory(token.symbol, tf.value);
              
              if (history && history.price_history && history.price_history.length >= 2) {
                const oldest = parseFloat(history.price_history[0].price);
                const newest = parseFloat(history.price_history[history.price_history.length - 1].price);
                const change = calculateGrowth(newest, oldest);
                changesData[token.symbol][tf.value] = change;
              } else {
                changesData[token.symbol][tf.value] = 0;
              }
            } catch (e) {
              console.error(`Ошибка при загрузке истории для ${token.symbol} (${tf.value}):`, e);
              changesData[token.symbol][tf.value] = 0;
            }
          }
        }
        
        setPriceChanges(changesData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tokens';
        setDebugInfo(prev => `${prev}\nОшибка загрузки: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
    const interval = setInterval(loadTokens, 300000); // Обновляем каждые 5 минут
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    // При изменении сортировки возвращаемся на первую страницу
    setCurrentPage(1);
  };

  const sortedTokens = [...tokens].sort((a, b) => {
    const aValue = a[sortBy as keyof Token] ?? 0;
    const bValue = b[sortBy as keyof Token] ?? 0;
    return sortOrder === 'asc'
      ? aValue > bValue ? 1 : -1
      : aValue < bValue ? 1 : -1;
  });

  // Выбираем топ-5 токенов по капитализации для карточек
  const topTokensByMarketCap = [...tokens]
    .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
    .slice(0, 5);

  // Вычисляем общие метрики для отображения в карточках
  const getTotalReserve = () => tokens.reduce((sum, token) => sum + token.reserve, 0);
  const getTotalDelegated = () => tokens.reduce((sum, token) => sum + (token.delegation_percentage || 0) * token.reserve / 100, 0);

  // Filter tokens based on search term
  const filteredTokens = sortedTokens.filter(token => 
    searchTerm === '' || 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Recalculate pagination for filtered tokens
  const totalPages = Math.ceil(filteredTokens.length / TOKENS_PER_PAGE);
  const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
  const tokensForCurrentPage = filteredTokens.slice(startIndex, startIndex + TOKENS_PER_PAGE);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Прокручиваем страницу к таблице
    window.scrollTo({ top: document.getElementById('token-table')?.offsetTop || 0, behavior: 'smooth' });
  };

  if (loading && tokens.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} py-6 flex flex-col justify-center sm:py-12`}>
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <div className="ml-4">Загрузка данных...</div>
          </div>
          {debugInfo && (
            <div className={`mt-4 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded text-xs text-left whitespace-pre-wrap`}>
              <div className="font-bold mb-2">Отладочная информация:</div>
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} py-6 flex flex-col justify-center sm:py-12`}>
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center text-red-600">Ошибка: {error}</div>
          {debugInfo && (
            <div className={`mt-4 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded text-xs text-left whitespace-pre-wrap`}>
              <div className="font-bold mb-2">Отладочная информация:</div>
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Decimal Token Metrics
          </h1>
          <div className="flex items-center space-x-4">
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {tokens.length} токенов
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            <div className="relative">
              <select
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                className={`block appearance-none w-full ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300'} border rounded py-2 px-4 pr-8 leading-tight focus:outline-none focus:border-blue-500`}
              >
                {timeFrames.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Метрики и карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PriceChangeCard 
            tokens={topTokensByMarketCap} 
            priceChanges={priceChanges} 
            timeFrame={selectedTimeFrame}
            loading={loading} 
            darkMode={darkMode}
          />
          <DelegationCard
            tokens={tokens}
            darkMode={darkMode}
          />
          <SupplyCard
            tokens={tokens}
            darkMode={darkMode}
          />
          <TopTokensCard 
            tokens={tokens} 
            darkMode={darkMode}
          />
        </div>

        {/* Дополнительные карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <ReservesCard 
            tokens={tokens}
            darkMode={darkMode}
          />
          <WalletsTopCard
            tokens={tokens}
            darkMode={darkMode}
          />
        </div>

        {/* Графики */}
        <div className={`bg-${darkMode ? 'gray-800' : 'white'} shadow rounded-lg p-6 mb-8`}>
          <div className="flex flex-wrap items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Визуализация метрик
            </h2>
            <div className="flex space-x-4">
              <div className="relative">
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className={`block appearance-none ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'} border rounded py-1 px-3 pr-8 leading-tight focus:outline-none focus:border-blue-500`}
                >
                  {chartTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className={`block appearance-none ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'} border rounded py-1 px-3 pr-8 leading-tight focus:outline-none focus:border-blue-500`}
                >
                  {metrics.map((metric) => (
                    <option key={metric.value} value={metric.value}>
                      {metric.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {chartType === 'line' && (
              <TokenChart 
                tokens={filteredTokens} 
                timeFrame={selectedTimeFrame} 
                metric={selectedMetric as keyof Token} 
                darkMode={darkMode}
              />
            )}
            {chartType === 'bar' && (
              <TokenBarChart 
                tokens={filteredTokens} 
                metric={selectedMetric as keyof Token} 
                darkMode={darkMode}
              />
            )}
            {chartType === 'pie' && (
              <TokenPieChart 
                tokens={filteredTokens} 
                metric={selectedMetric as keyof Token} 
                darkMode={darkMode}
              />
            )}
          </div>
        </div>

        {/* Таблица токенов с поиском и пагинацией */}
        <div id="token-table" className={`bg-${darkMode ? 'gray-800' : 'white'} shadow rounded-lg p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Все токены Decimal
            </h2>
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {filteredTokens.length} из {tokens.length} токенов
            </div>
          </div>

          <SearchFilter 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            darkMode={darkMode}
          />

          {filteredTokens.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Токены не найдены. Попробуйте изменить поисковый запрос.
            </div>
          ) : (
            <>
              <TokenTable 
                tokens={tokensForCurrentPage} 
                timeFrame={selectedTimeFrame}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                darkMode={darkMode}
                priceChanges={priceChanges}
              />

              {totalPages > 1 && (
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={handlePageChange} 
                  darkMode={darkMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 