'use client';

import React, { useState, useEffect } from 'react';
import { TokenTable } from '@/components/TokenTable';
import { TokenChart } from '@/components/TokenChart';
import { fetchTokens, Token } from '@/utils/decimalApi';

const timeFrames = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
];

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('24h');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        setDebugInfo('Начинаем загрузку токенов...');
        
        // Пробуем напрямую обратиться к API для отладки
        try {
          const testResponse = await fetch('/api/decimal-server/coins');
          const testJson = await testResponse.json();
          setDebugInfo(prev => `${prev}\nТестовый запрос: ${JSON.stringify(testJson).slice(0, 200)}...`);
        } catch (testErr) {
          setDebugInfo(prev => `${prev}\nОшибка тестового запроса: ${testErr instanceof Error ? testErr.message : String(testErr)}`);
        }
        
        const data = await fetchTokens();
        setDebugInfo(prev => `${prev}\nУспешно загружено ${data.length} токенов`);
        setTokens(data);
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
    const interval = setInterval(loadTokens, 60000); // Обновляем каждую минуту
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
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center">Loading...</div>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-200 rounded text-xs text-left whitespace-pre-wrap">
              <div className="font-bold mb-2">Debug Info:</div>
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center text-red-600">Error: {error}</div>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-200 rounded text-xs text-left whitespace-pre-wrap">
              <div className="font-bold mb-2">Debug Info:</div>
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Decimal Token Metrics</h1>
            <div className="flex space-x-2">
              {timeFrames.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setSelectedTimeFrame(tf.value)}
                  className={`px-4 py-2 rounded-md ${
                    selectedTimeFrame === tf.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <TokenChart
              data={{
                labels: tokens.map((t) => t.symbol),
                datasets: [
                  {
                    label: 'Price',
                    data: tokens.map((t) => t.price),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  },
                ],
              }}
              title="Token Prices"
            />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <TokenTable
              tokens={sortedTokens}
              timeFrame={selectedTimeFrame}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 