import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Token } from '@/utils/decimalApi';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface TokenPieChartProps {
  tokens: Token[];
  metric: keyof Token;
  darkMode?: boolean;
}

export function TokenPieChart({ tokens, metric, darkMode = false }: TokenPieChartProps) {
  // Filter out tokens that don't have the selected metric
  const validTokens = tokens.filter(token => token[metric] !== undefined);
  
  // Background colors for pie slices
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
        position: 'right' as const,
        labels: {
          color: darkMode ? '#fff' : '#333',
          font: {
            size: 12,
          },
          boxWidth: 15,
          padding: 10,
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
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? '#fff' : '#333',
        bodyColor: darkMode ? '#fff' : '#333',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${percentage}%`;
          }
        }
      },
    },
  };

  return (
    <div className="w-full h-80">
      <Pie options={options} data={data} />
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