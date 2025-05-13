import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Token } from '@/utils/decimalApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TokenChartProps {
  tokens: Token[];
  metric: keyof Token;
  timeFrame: string;
  darkMode?: boolean;
}

export function TokenChart({ tokens, metric, timeFrame, darkMode = false }: TokenChartProps) {
  // Используем useMemo для кэширования обработанных данных
  const chartData = useMemo(() => {
    // Filter out tokens that don't have the selected metric
    const validTokens = tokens.filter(token => token[metric] !== undefined);
    
    // Сортируем токены для лучшего визуального представления
    const sortedTokens = [...validTokens].sort((a, b) => {
      const aValue = a[metric] as number || 0;
      const bValue = b[metric] as number || 0;
      return bValue - aValue;
    });
    
    // Prepare data for the chart
    return {
      labels: sortedTokens.map(token => token.symbol),
      datasets: [
        {
          label: getMetricLabel(metric),
          data: sortedTokens.map(token => token[metric] as number),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
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
        text: `${getMetricLabel(metric)} - Все токены (${timeFrame})`,
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
        beginAtZero: false,
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
          // Ограничиваем количество видимых меток на оси X для предотвращения перегрузки
          callback: function(val: any, index: number) {
            const labels = chartData.labels as string[];
            // Показываем каждую 5-ю метку, но не более 20 меток всего
            const interval = Math.max(1, Math.ceil(labels.length / 20));
            return index % interval === 0 ? labels[index] : '';
          },
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45
        },
      },
    },
  };

  return (
    <div className="w-full h-80">
      <Line options={options} data={chartData} />
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