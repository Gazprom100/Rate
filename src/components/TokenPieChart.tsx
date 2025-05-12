import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface TokenPieChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
  title: string;
  darkMode?: boolean;
}

export function TokenPieChart({ data, title, darkMode = false }: TokenPieChartProps) {
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
        text: title,
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
    <div className="w-full h-full">
      <Pie options={options} data={data} />
    </div>
  );
} 