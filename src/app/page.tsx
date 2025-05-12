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
];

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

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        setDebugInfo('Начинаем загрузку токенов...');
        
        const data = await fetchTokens();
        setDebugInfo(prev => `${prev}\nУспешно загружено ${data.length} токенов`);
        setTokens(data);
        
        // Загрузка исторических данных для первых 10 токенов
        const top10Tokens = data.slice(0, 10);
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
  };

  const sortedTokens = [...tokens].sort((a, b) => {
    const aValue = a[sortBy as keyof Token] ?? 0;
    const bValue = b[sortBy as keyof Token] ?? 0;
    return sortOrder === 'asc'
      ? aValue > bValue ? 1 : -1
      : aValue < bValue ? 1 : -1;
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <PriceChangeCard 
            tokens={sortedTokens.slice(0, 5)} 
            timeFrame={selectedTimeFrame} 
            priceChanges={priceChanges}
            darkMode={darkMode}
          />
          <DelegationCard 
            tokens={sortedTokens} 
            darkMode={darkMode}
          />
          <ReservesCard 
            tokens={sortedTokens} 
            darkMode={darkMode}
          />
          <TopTokensCard 
            tokens={sortedTokens.slice(0, 5)} 
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

          <div className="h-80">
            {chartType === 'line' && (
              <TokenChart
                data={{
                  labels: sortedTokens.slice(0, 10).map((t) => t.symbol),
                  datasets: [
                    {
                      label: metrics.find(m => m.value === selectedMetric)?.label || '',
                      data: sortedTokens.slice(0, 10).map((t) => t[selectedMetric as keyof Token] as number),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    },
                  ],
                }}
                title={`${metrics.find(m => m.value === selectedMetric)?.label || ''} - Top 10 Tokens`}
                darkMode={darkMode}
              />
            )}
            {chartType === 'bar' && (
              <TokenBarChart
                data={{
                  labels: sortedTokens.slice(0, 10).map((t) => t.symbol),
                  datasets: [
                    {
                      label: metrics.find(m => m.value === selectedMetric)?.label || '',
                      data: sortedTokens.slice(0, 10).map((t) => t[selectedMetric as keyof Token] as number),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(83, 102, 255, 0.7)',
                        'rgba(40, 159, 64, 0.7)',
                        'rgba(210, 99, 132, 0.7)',
                      ],
                    },
                  ],
                }}
                title={`${metrics.find(m => m.value === selectedMetric)?.label || ''} - Top 10 Tokens`}
                darkMode={darkMode}
              />
            )}
            {chartType === 'pie' && (
              <TokenPieChart
                data={{
                  labels: sortedTokens.slice(0, 10).map((t) => t.symbol),
                  datasets: [
                    {
                      data: sortedTokens.slice(0, 10).map((t) => t[selectedMetric as keyof Token] as number),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(83, 102, 255, 0.7)',
                        'rgba(40, 159, 64, 0.7)',
                        'rgba(210, 99, 132, 0.7)',
                      ],
                    },
                  ],
                }}
                title={`${metrics.find(m => m.value === selectedMetric)?.label || ''} - Top 10 Tokens`}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>

        <div className={`bg-${darkMode ? 'gray-800' : 'white'} shadow rounded-lg overflow-hidden`}>
          <div className="p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Таблица токенов
            </h2>
          </div>
          <TokenTable
            tokens={sortedTokens}
            timeFrame={selectedTimeFrame}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            darkMode={darkMode}
            priceChanges={priceChanges}
          />
        </div>
      </div>
    </div>
  );
} 