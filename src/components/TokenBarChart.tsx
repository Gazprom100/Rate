import React from 'react';
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
  // Filter out tokens that don't have the selected metric
  const validTokens = tokens.filter(token => token[metric] !== undefined);
  
  // Background colors for bars
  const backgroundColors = [
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
  ];
  
  // Prepare data for the chart
  const data = {
    labels: validTokens.map(token => token.symbol),
    datasets: [
      {
        label: getMetricLabel(metric),
        data: validTokens.map(token => token[metric] as number),
        backgroundColor: backgroundColors.slice(0, validTokens.length),
      },
    ],
  };

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
        text: `${getMetricLabel(metric)} - Топ ${tokens.length} токенов`,
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
        },
      },
    },
  };

  return (
    <div className="w-full h-80">
      <Bar options={options} data={data} />
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