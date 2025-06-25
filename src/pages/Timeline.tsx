import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock, Layers, Filter, Play, CheckCircle, XCircle, AlertCircle, MinusCircle } from "lucide-react";
import { useTestData } from "@/context/DataContext";
import { TestBehavior } from "@/types/behaviors";
import TimelineGanttChart from "@/components/charts/TimelineGanttChart";

export default function Timeline() {
  const { testData, loading } = useTestData();
  const [groupBy, setGroupBy] = useState<'thread' | 'suite' | 'status'>('thread');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConcurrency, setShowConcurrency] = useState(true);

  const calculateConcurrentPeaks = (tests: TestBehavior[]) => {
    const events: { time: number; type: 'start' | 'end' }[] = [];
    
    tests.forEach(test => {
      if (test.time && test.time.start && test.time.stop) {
        events.push({ time: test.time.start, type: 'start' });
        events.push({ time: test.time.stop, type: 'end' });
      }
    });

    events.sort((a, b) => a.time - b.time);

    let concurrent = 0;
    let maxConcurrent = 0;
    
    events.forEach(event => {
      if (event.type === 'start') {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
      } else {
        concurrent--;
      }
    });

    return maxConcurrent;
  };

  const timelineData = useMemo(() => {
    if (!testData?.tests) return { groups: [], stats: { totalDuration: 0, parallelEfficiency: 0 } };

    const tests = testData.tests.filter(test => {
      if (statusFilter === 'all') return true;
      return test.status === statusFilter;
    }).filter(test => test.time && test.time.start !== undefined && test.time.stop !== undefined); // Filter out tests with invalid time data

    // Group tests based on selected grouping
    const groups = new Map<string, TestBehavior[]>();
    
    tests.forEach(test => {
      let groupKey = 'Unknown';
      
      switch (groupBy) {
        case 'thread':
          groupKey = test.threadId || 'Thread 1';
          break;
        case 'suite':
          groupKey = test.suiteName || test.packageName || 'Unknown Suite';
          break;
        case 'status':
          groupKey = test.status;
          break;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(test);
    });    // Calculate timeline statistics
    const validTests = tests.filter(t => t.time && t.time.start && t.time.stop);
    if (validTests.length === 0) {
      return { groups: [], stats: { totalDuration: 0, parallelEfficiency: 0 } };
    }
    
    const allStartTimes = validTests.map(t => t.time.start);
    const allEndTimes = validTests.map(t => t.time.stop);
    const totalDuration = Math.max(...allEndTimes) - Math.min(...allStartTimes);
    const sumDuration = validTests.reduce((sum, t) => sum + (t.duration || 0), 0);
    const parallelEfficiency = totalDuration > 0 ? (sumDuration / totalDuration) * 100 : 0;    return {
      groups: Array.from(groups.entries()).map(([name, tests]) => {
        const validGroupTests = tests.filter(t => t.time && t.time.start && t.time.stop);
        if (validGroupTests.length === 0) {
          return { name, tests: [], duration: 0, count: 0 };
        }
        return {
          name,
          tests: validGroupTests.sort((a, b) => a.time.start - b.time.start),
          duration: Math.max(...validGroupTests.map(t => t.time.stop)) - Math.min(...validGroupTests.map(t => t.time.start)),
          count: validGroupTests.length
        };
      }),
      stats: {
        totalDuration,
        parallelEfficiency,
        threadCount: new Set(validTests.map(t => t.threadId || 'Thread 1')).size,
        concurrentPeaks: calculateConcurrentPeaks(validTests)      }
    };
  }, [testData?.tests, groupBy, statusFilter]);

  const formatDuration = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const statusIcons = {
    passed: <CheckCircle className="h-3 w-3 text-green-600" />,
    failed: <XCircle className="h-3 w-3 text-red-600" />,
    broken: <AlertCircle className="h-3 w-3 text-orange-600" />,
    skipped: <MinusCircle className="h-3 w-3 text-gray-600" />
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!testData || !testData.tests || testData.tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Clock className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">No Timeline Data</h3>
          <p className="text-muted-foreground">Load test data from Settings to view the execution timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Execution Timeline</h1>
          <p className="text-muted-foreground">Visualize test execution concurrency and patterns</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Timeline Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Group by:</label>
              <Select value={groupBy} onValueChange={(value: 'thread' | 'suite' | 'status') => setGroupBy(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thread">Thread</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-concurrency"
                checked={showConcurrency}
                onCheckedChange={setShowConcurrency}
              />
              <label htmlFor="show-concurrency" className="text-sm">
                Show concurrency
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(timelineData.stats.totalDuration)}
            </div>
            <p className="text-xs text-muted-foreground">
              Wall clock time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parallel Efficiency</CardTitle>
            <Layers className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {timelineData.stats.parallelEfficiency.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              CPU utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thread Count</CardTitle>
            <Play className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {timelineData.stats.threadCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Concurrent threads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Concurrency</CardTitle>
            <Layers className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {timelineData.stats.concurrentPeaks}
            </div>
            <p className="text-xs text-muted-foreground">
              Max simultaneous tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Timeline</CardTitle>
          <CardDescription>
            Visual representation of test execution over time
          </CardDescription>
        </CardHeader>        <CardContent>
          <TimelineGanttChart timelineItems={testData?.timeline?.children || []} />
        </CardContent>
      </Card>

      {/* Timeline Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Groups</CardTitle>
          <CardDescription>
            Breakdown by {groupBy}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineData.groups.map((group, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{group.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {group.count} tests
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatDuration(group.duration)}
                  </div>
                </div>

                <div className="space-y-2">
                  {group.tests.slice(0, 10).map((test: TestBehavior, testIndex: number) => (
                    <div key={testIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {statusIcons[test.status as keyof typeof statusIcons]}
                          <span className="truncate max-w-[300px]">{test.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDuration(test.duration)}</span>
                          <span>•</span>
                          <span>{new Date(test.time.start).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {group.tests.length > 10 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      ... and {group.tests.length - 10} more tests
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Concurrency Analysis */}
      {showConcurrency && (
        <Card>
          <CardHeader>
            <CardTitle>Concurrency Analysis</CardTitle>
            <CardDescription>
              Understanding parallel execution patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Thread Utilization</h4>
                <div className="space-y-2">
                  {Array.from(new Set(testData?.tests?.map(t => t.threadId || 'Thread 1') || [])).map(threadId => {
                    const threadTests = testData?.tests?.filter(t => (t.threadId || 'Thread 1') === threadId) || [];
                    const threadDuration = threadTests.reduce((sum, t) => sum + t.duration, 0);
                    const utilizationPercent = timelineData.stats.totalDuration > 0 ? 
                      (threadDuration / timelineData.stats.totalDuration) * 100 : 0;

                    return (
                      <div key={threadId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{threadId}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12">
                            {utilizationPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Execution Patterns</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sequential execution</span>
                    <span className="text-sm font-medium">
                      {timelineData.stats.threadCount === 1 ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Parallel execution</span>
                    <span className="text-sm font-medium">
                      {timelineData.stats.threadCount > 1 ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Optimal concurrency</span>
                    <span className="text-sm font-medium">
                      {timelineData.stats.parallelEfficiency > 75 ? 'High' : 
                       timelineData.stats.parallelEfficiency > 50 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
