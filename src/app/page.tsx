'use client';

import React, { useState, useEffect } from 'react';
import { TokenTable } from '@/components/TokenTable';
import { fetchTokens, Token } from '@/utils/decimalApi';

const timeFrames = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' },
];

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('24h');

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        const data = await fetchTokens();
        setTokens(data);
        setError(null);
      } catch (err) {
        setError('Failed to load tokens. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const sortedTokens = [...tokens].sort((a, b) => {
    const aValue = a[sortBy as keyof Token];
    const bValue = b[sortBy as keyof Token];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return sortDirection === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Decimal Token Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Track and analyze Decimal blockchain tokens
          </p>
        </div>

        <div className="mb-6 flex justify-center space-x-4">
          {timeFrames.map((frame) => (
            <button
              key={frame.value}
              onClick={() => setSelectedTimeFrame(frame.value)}
              className={`px-4 py-2 rounded-md ${
                selectedTimeFrame === frame.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {frame.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tokens...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : (
          <TokenTable
            tokens={sortedTokens}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            timeFrame={selectedTimeFrame}
          />
        )}
      </div>
    </main>
  );
} 