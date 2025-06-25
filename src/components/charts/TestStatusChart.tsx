
import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TestStatusChartProps {
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  chartType?: 'pie' | 'bar';
}

const TestStatusChart: React.FC<TestStatusChartProps> = ({
  passed,
  failed,
  broken,
  skipped,
  chartType = 'pie',
}) => {
  const data = {
    labels: ['Passed', 'Failed', 'Broken', 'Skipped'],
    datasets: [
      {
        data: [passed, failed, broken, skipped],
        backgroundColor: [
          '#10b981', // green-500
          '#ef4444', // red-500
          '#f97316', // orange-500
          '#6b7280', // gray-500
        ],
        borderColor: [
          '#059669', // green-600
          '#dc2626', // red-600
          '#ea580c', // orange-600
          '#4b5563', // gray-600
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = passed + failed + broken + skipped;
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (chartType === 'bar') {
    return (
      <div className="h-64">
        <Bar data={data} options={barOptions} />
      </div>
    );
  }

  return (
    <div className="h-64">
      <Pie data={data} options={options} />
    </div>
  );
};

export default TestStatusChart;
