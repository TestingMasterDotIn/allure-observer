
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTestData } from "@/context/DataContext";
import TestStatusChart from "@/components/charts/TestStatusChart";
import TestTimeSeriesChart from "@/components/charts/TestTimeSeriesChart";
import type { DateRange } from "react-day-picker";

export default function Dashboard() {
  const { testData, loading } = useTestData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = testData ? {
    total: testData.totalTests,
    passed: testData.passedTests,
    failed: testData.failedTests,
    broken: testData.brokenTests,
    skipped: testData.skippedTests,
    flaky: testData.flakyTests || 0,
    avgDuration: testData.performanceMetrics?.averageDuration || 0,
    passRate: Math.round((testData.passedTests / testData.totalTests) * 100)
  } : {
    total: 0, passed: 0, failed: 0, broken: 0, skipped: 0, flaky: 0, avgDuration: 0, passRate: 0
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Dashboard</h1>
          <p className="text-muted-foreground">Overview of test execution results</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
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
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All test cases executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.passed} passed of {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed + stats.broken}</div>
            <p className="text-xs text-muted-foreground">
              {stats.failed} failed, {stats.broken} broken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flaky Tests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.flaky}</div>
            <p className="text-xs text-muted-foreground">
              Tests with inconsistent results
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Status Distribution</CardTitle>
            <CardDescription>
              Current test execution results breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TestStatusChart 
              passed={stats.passed}
              failed={stats.failed}
              broken={stats.broken}
              skipped={stats.skipped}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Trends</CardTitle>
            <CardDescription>
              Test results over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TestTimeSeriesChart tests={testData?.tests || []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.avgDuration / 1000)}s
            </div>
            <p className="text-sm text-muted-foreground">
              Per test execution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Functional</span>
                <Badge variant="outline">75%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Integration</span>
                <Badge variant="outline">20%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">UI</span>
                <Badge variant="outline">5%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Threads</span>
                <Badge variant="secondary">{testData?.threadCount || 1}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Parallel</span>
                <Badge variant="secondary">{testData?.threadCount > 1 ? 'Yes' : 'No'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
