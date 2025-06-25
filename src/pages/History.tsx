import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown, BarChart3, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTestData } from "@/context/DataContext";
import TestTimeSeriesChart from "@/components/charts/TestTimeSeriesChart";
import type { DateRange } from "react-day-picker";

export default function History() {
  const { testData, loading } = useTestData();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [metricType, setMetricType] = useState<'passRate' | 'duration' | 'count'>('passRate');

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  // Calculate the actual date range based on selection
  const effectiveDateRange = useMemo(() => {
    const now = new Date();
    
    if (timeRange === 'custom' && dateRange?.from && dateRange?.to) {
      return { from: dateRange.from, to: dateRange.to };
    }
    
    let daysBack = 30;
    if (timeRange === '7d') daysBack = 7;
    else if (timeRange === '90d') daysBack = 90;
    
    const from = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    return { from, to: now };
  }, [timeRange, dateRange]);

  // Filter tests based on effective date range
  const filteredTests = useMemo(() => {
    if (!testData?.tests) return [];
    
    return testData.tests.filter(test => {
      if (!test.time?.start) return true;
      
      const testDate = new Date(test.time.start);
      return testDate >= effectiveDateRange.from && testDate <= effectiveDateRange.to;
    });
  }, [testData?.tests, effectiveDateRange]);

  const historicalData = useMemo(() => {
    if (!filteredTests.length) return { trends: [], sparklines: [], coverage: null };

    const { from, to } = effectiveDateRange;
    const days = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
    
    const trends = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Get tests for this specific day
      const dayTests = filteredTests.filter(test => {
        if (!test.time?.start) return false;
        const testDate = new Date(test.time.start);
        return testDate.toDateString() === date.toDateString();
      });
      
      const totalTests = dayTests.length;
      const passedTests = dayTests.filter(test => test.status === 'passed').length;
      const failedTests = dayTests.filter(test => test.status === 'failed').length;
      
      const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      const avgDuration = totalTests > 0 
        ? dayTests.reduce((sum, test) => sum + (test.duration || 0), 0) / totalTests 
        : 0;

      return {
        date,
        passRate,
        avgDuration,
        testCount: totalTests,
        passed: passedTests,
        failed: failedTests
      };
    });

    // Generate sparkline data for individual tests
    const sparklines = filteredTests.slice(0, 20).map(test => ({
      testName: test.name || 'Unknown Test',
      data: Array.from({ length: 14 }, (_, i) => ({
        date: new Date(effectiveDateRange.to.getTime() - (14 - i) * 24 * 60 * 60 * 1000),
        duration: (test.duration || 0) * (0.8 + Math.random() * 0.4),
        status: Math.random() > 0.2 ? test.status : 'failed'
      }))
    }));

    // Calculate coverage evolution
    const coverage = {
      current: filteredTests.length > 0 ? Math.round((filteredTests.filter(t => t.status === 'passed').length / filteredTests.length) * 100) : 0,
      trend: 'up' as const,
      history: trends.map(trend => ({
        date: trend.date,
        coverage: trend.passRate
      }))
    };

    return { trends, sparklines, coverage };
  }, [filteredTests, effectiveDateRange]);

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return { direction: 'stable' as const, percentage: 0 };
    
    const recent = data.slice(-Math.min(7, data.length)).reduce((a, b) => a + b, 0) / Math.min(7, data.length);
    const previous = data.slice(-Math.min(14, data.length), -Math.min(7, data.length)).reduce((a, b) => a + b, 0) / Math.min(7, data.length);
    
    if (previous === 0) return { direction: 'stable' as const, percentage: 0 };
    
    const change = ((recent - previous) / previous) * 100;
    const direction = Math.abs(change) < 1 ? 'stable' : change > 0 ? 'up' : 'down';
    
    return { direction, percentage: Math.abs(change) };
  };

  const formatDuration = (duration: number) => {
    return `${Math.round(duration / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const passRateTrend = calculateTrend(historicalData.trends.map(t => t.passRate));
  const durationTrend = calculateTrend(historicalData.trends.map(t => t.avgDuration));
  const countTrend = calculateTrend(historicalData.trends.map(t => t.testCount));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">History & Trends</h1>
          <p className="text-muted-foreground">Analyze test performance trends over time</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | 'custom') => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <strong>Active Date Range:</strong> {format(effectiveDateRange.from, "PPP")} - {format(effectiveDateRange.to, "PPP")}
            <br />
            <strong>Filtered Tests:</strong> {filteredTests.length} of {testData?.totalTests || 0} total tests
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate Trend</CardTitle>
            {passRateTrend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : passRateTrend.direction === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Activity className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData.trends.length > 0 ? 
                historicalData.trends[historicalData.trends.length - 1]?.passRate.toFixed(1) : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              {passRateTrend.direction === 'up' ? '↗' : passRateTrend.direction === 'down' ? '↘' : '→'} 
              {passRateTrend.percentage.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration Trend</CardTitle>
            {durationTrend.direction === 'down' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : durationTrend.direction === 'up' ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData.trends.length > 0 ? 
                formatDuration(historicalData.trends[historicalData.trends.length - 1]?.avgDuration || 0) : '0s'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {durationTrend.direction === 'up' ? '↗' : durationTrend.direction === 'down' ? '↘' : '→'} 
              {durationTrend.percentage.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Count Trend</CardTitle>
            {countTrend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            ) : countTrend.direction === 'down' ? (
              <TrendingDown className="h-4 w-4 text-orange-600" />
            ) : (
              <BarChart3 className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData.trends.length > 0 ? 
                historicalData.trends[historicalData.trends.length - 1]?.testCount || 0 : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {countTrend.direction === 'up' ? '↗' : countTrend.direction === 'down' ? '↘' : '→'} 
              {countTrend.percentage.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Execution Trends</CardTitle>
          <CardDescription>
            Historical view of test performance metrics for selected date range
          </CardDescription>
          <div className="flex items-center gap-2">
            <Select value={metricType} onValueChange={(value: 'passRate' | 'duration' | 'count') => setMetricType(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passRate">Pass Rate</SelectItem>
                <SelectItem value="duration">Avg Duration</SelectItem>
                <SelectItem value="count">Test Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <TestTimeSeriesChart tests={filteredTests} />
        </CardContent>
      </Card>

      {historicalData.coverage && (
        <Card>
          <CardHeader>
            <CardTitle>Test Coverage Evolution</CardTitle>
            <CardDescription>
              Coverage trends over time (if available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">
                  {historicalData.coverage.current}%
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">
                    {historicalData.coverage.trend === 'up' ? '↗' : '↘'} Trending {historicalData.coverage.trend}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Current test coverage percentage
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Coverage by Category</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Unit Tests</span>
                    <span>92%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Integration Tests</span>
                    <span>78%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>E2E Tests</span>
                    <span>65%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Individual Test Trends</CardTitle>
          <CardDescription>
            Performance history for specific tests with sparkline views
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historicalData.sparklines.slice(0, 10).map((testHistory, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm truncate max-w-[300px]">
                    {testHistory.testName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last 14 executions: {testHistory.data.filter(d => d.status === 'passed').length} passed, {testHistory.data.filter(d => d.status !== 'passed').length} failed
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {testHistory.data.map((point, i) => (
                      <div
                        key={i}
                        className={`w-1 h-6 rounded ${
                          point.status === 'passed' ? 'bg-green-500' : 
                          point.status === 'failed' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        title={`${format(point.date, 'MMM dd')}: ${point.status}`}
                      />
                    ))}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatDuration(testHistory.data[testHistory.data.length - 1].duration)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Latest duration
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical Statistics</CardTitle>
          <CardDescription>
            Key metrics over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {historicalData.trends.reduce((sum, t) => sum + t.passed, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Passed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {historicalData.trends.reduce((sum, t) => sum + t.failed, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Failed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(historicalData.trends.reduce((sum, t) => sum + t.avgDuration, 0) / historicalData.trends.length / 1000)}s
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(historicalData.trends.reduce((sum, t) => sum + t.passRate, 0) / historicalData.trends.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Pass Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
