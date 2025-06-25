
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { TestBehavior } from '../../types/behaviors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TestTimeSeriesChartProps {
  tests: TestBehavior[];
}

const TestTimeSeriesChart: React.FC<TestTimeSeriesChartProps> = ({ tests }) => {
  // Group tests by day and calculate pass rate
  const groupedByDay = tests.reduce((acc, test) => {
    if (!test.time?.start) return acc;
    
    const date = new Date(test.time.start);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!acc[dateKey]) {
      acc[dateKey] = { total: 0, passed: 0, failed: 0, broken: 0, skipped: 0, totalDuration: 0 };
    }
    
    acc[dateKey].total++;
    acc[dateKey][test.status]++;
    acc[dateKey].totalDuration += test.duration || 0;
    
    return acc;
  }, {} as Record<string, { total: number; passed: number; failed: number; broken: number; skipped: number; totalDuration: number }>);

  const sortedDates = Object.keys(groupedByDay).sort();
  
  const passRateData = sortedDates.map(date => ({
    x: date,
    y: groupedByDay[date].total > 0 ? (groupedByDay[date].passed / groupedByDay[date].total) * 100 : 0,
  }));

  const avgDurationData = sortedDates.map(date => ({
    x: date,
    y: groupedByDay[date].total > 0 ? groupedByDay[date].totalDuration / groupedByDay[date].total / 1000 : 0, // Convert to seconds
  }));

  const data = {
    datasets: [
      {
        label: 'Pass Rate (%)',
        data: passRateData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Avg Duration (s)',
        data: avgDurationData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Pass Rate (%)',
        },
        min: 0,
        max: 100,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Duration (seconds)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString();
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
};

export default TestTimeSeriesChart;
