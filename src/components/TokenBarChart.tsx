import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Token } from '@/utils/decimalApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TokenBarChartProps {
  tokens: Token[];
  metric: keyof Token;
  darkMode?: boolean;
}

export function TokenBarChart({ tokens, metric, darkMode = false }: TokenBarChartProps) {
  // Используем useMemo для кэширования обработанных данных
  const chartData = useMemo(() => {
    // Filter out tokens that don't have the selected metric
    const validTokens = tokens.filter(token => token[metric] !== undefined);
    
    // Сортируем токены по убыванию метрики
    const sortedTokens = [...validTokens].sort((a, b) => {
      const aValue = a[metric] as number || 0;
      const bValue = b[metric] as number || 0;
      return bValue - aValue;
    });
    
    // Ограничиваем количество токенов до 50 для лучшей читаемости
    const limitedTokens = sortedTokens.slice(0, 50);
    
    // Background colors for bars
    const backgroundColors = [];
    const borderColors = [];
    
    // Создаем больше цветов, если необходимо
    for (let i = 0; i < limitedTokens.length; i++) {
      const hue = (i * 137.5) % 360; // Золотое сечение для равномерного распределения цветов
      backgroundColors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
      borderColors.push(`hsla(${hue}, 70%, 50%, 1)`);
    }
    
    // Prepare data for the chart
    return {
      labels: limitedTokens.map(token => token.symbol),
      datasets: [
        {
          label: getMetricLabel(metric),
          data: limitedTokens.map(token => token[metric] as number),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [tokens, metric]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#fff' : '#333',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${getMetricLabel(metric)} - Топ 50 токенов`,
        color: darkMode ? '#fff' : '#333',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? '#fff' : '#333',
        bodyColor: darkMode ? '#fff' : '#333',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#ccc' : '#666',
        },
      },
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#ccc' : '#666',
          autoSkip: true,
          maxRotation: 90,
          minRotation: 45
        },
      },
    },
  };

  return (
    <div className="w-full h-80">
      <Bar options={options} data={chartData} />
    </div>
  );
}

// Helper function to get human-readable metric labels
function getMetricLabel(metric: keyof Token): string {
  const metricLabels: Record<string, string> = {
    price: 'Цена',
    market_cap: 'Капитализация',
    reserve: 'Резерв DEL',
    delegation_percentage: 'Делегировано %',
    supply_percentage: 'Выпуск от максимума %',
    crr: 'CRR',
    wallets_count: 'Кошельки',
  };
  
  return metricLabels[metric] || String(metric);
} 