import React, { useMemo } from 'react';
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
  // Используем useMemo для оптимизации производительности
  const chartData = useMemo(() => {
    // Filter out tokens that don't have the selected metric
    const validTokens = tokens.filter(token => token[metric] !== undefined);
    
    // Сортируем токены по убыванию значения метрики
    const sortedTokens = [...validTokens].sort((a, b) => {
      const aValue = a[metric] as number || 0;
      const bValue = b[metric] as number || 0;
      return bValue - aValue;
    });
    
    // Ограничиваем количество элементов до 15 для круговой диаграммы
    // Остальные объединяем в категорию "Другие"
    const topTokens = sortedTokens.slice(0, 15);
    const otherTokens = sortedTokens.slice(15);
    
    let labels: string[] = [];
    let values: number[] = [];
    
    // Добавляем топ токены
    labels = topTokens.map(token => token.symbol);
    values = topTokens.map(token => token[metric] as number);
    
    // Объединяем оставшиеся токены в "Другие", если их больше 0
    if (otherTokens.length > 0) {
      const otherSum = otherTokens.reduce((sum, token) => sum + (token[metric] as number || 0), 0);
      labels.push('Другие');
      values.push(otherSum);
    }
    
    // Генерируем цвета для диаграммы
    const backgroundColors = [];
    const borderColors = [];
    
    for (let i = 0; i < labels.length; i++) {
      const hue = (i * 137.5) % 360; // Золотое сечение для равномерного распределения цветов
      backgroundColors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
      borderColors.push(`hsla(${hue}, 70%, 50%, 1)`);
    }
    
    // Prepare data for the chart
    return {
      labels,
      datasets: [
        {
          data: values,
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
        text: `${getMetricLabel(metric)} - Топ 15 токенов + Другие`,
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
      <Pie options={options} data={chartData} />
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