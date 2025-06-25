import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { TimelineItem } from '../../types/behaviors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TimelineGanttChartProps {
  timelineItems: TimelineItem[];
}

const TimelineGanttChart: React.FC<TimelineGanttChartProps> = ({ timelineItems }) => {
  if (!timelineItems || timelineItems.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No timeline data available
      </div>
    );
  }

  // Filter out items without valid time data
  const validItems = timelineItems.filter(item => 
    item.time && 
    item.time.start && 
    item.time.stop && 
    item.thread
  );

  if (validItems.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No valid timeline data with execution times available
      </div>
    );
  }

  // Group by thread for Gantt visualization
  const threadGroups = validItems.reduce((acc, item) => {
    if (!acc[item.thread]) {
      acc[item.thread] = [];
    }
    acc[item.thread].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const threads = Object.keys(threadGroups);
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#64748b'
  ];
  const datasets = threads.map((thread, index) => {
    const items = threadGroups[thread];
    const data = items
      .filter(item => item.time && item.time.start && item.time.stop) // Filter out items without valid time data
      .map(item => ({
        x: [new Date(item.time.start), new Date(item.time.stop)],
        y: thread,
        testName: item.name,
        status: item.status,
        duration: item.time.duration || 0,
      }));

    return {
      label: `Thread ${thread}`,
      data: data,
      backgroundColor: colors[index % colors.length] + '80', // Add transparency
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      barThickness: 20,
    };
  });

  const data = {
    labels: threads,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'second' as const,
          displayFormats: {
            second: 'HH:mm:ss',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Thread',
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend as it's redundant with y-axis labels
      },      tooltip: {
        callbacks: {
          title: (context: TooltipItem<'bar'>[]) => {
            const item = context[0]?.raw as { testName?: string };
            return item?.testName || 'Unknown Test';
          },
          label: (context: TooltipItem<'bar'>) => {
            const item = context.raw as { 
              x: [Date, Date]; 
              duration: number; 
              status: string;
            };
            if (!item || !item.x || !Array.isArray(item.x)) return '';
            
            const start = new Date(item.x[0]).toLocaleTimeString();
            const end = new Date(item.x[1]).toLocaleTimeString();
            const duration = (item.duration / 1000).toFixed(2);
            return [
              `Status: ${item.status || 'unknown'}`,
              `Start: ${start}`,
              `End: ${end}`,
              `Duration: ${duration}s`,
              `Thread: ${context.label || 'unknown'}`,
            ];
          },
        },
      },
    },
  };

  return (      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Parallel Execution Timeline</h3>
        <div className="text-sm text-muted-foreground">
          {threads.length} threads, {validItems.length} valid tests
        </div>
      </div>
      <div className="h-80">
        <Bar data={data} options={options} />
      </div>
        {/* Thread Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {threads.map((thread, index) => {
          const items = threadGroups[thread];
          const validItems = items.filter(item => item.time && item.time.duration);
          const totalDuration = validItems.reduce((sum, item) => sum + (item.time?.duration || 0), 0);
          const avgDuration = validItems.length > 0 ? totalDuration / validItems.length : 0;
          
          return (
            <div key={thread} className="p-3 bg-card border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="font-medium">Thread {thread}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Tests: {items.length}</div>
                <div>Total: {(totalDuration / 1000).toFixed(1)}s</div>
                <div>Avg: {(avgDuration / 1000).toFixed(1)}s</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineGanttChart;
