import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { scanLocalFolder, isFileSystemAccessSupported, uploadBehaviorsFiles } from '../services/fileService';
import { ftpService } from '../services/ftpService';
import { aggregateTestData, filterTestsByDateRange } from '../utils/parseBehaviors';
import { loadSampleData } from '../utils/testDataGenerator';
import { testObservabilityAPI } from '../services/apiService';
import { TestBehavior } from '../types/behaviors';
import TestStatusChart from '../components/charts/TestStatusChart';
import TestTimeSeriesChart from '../components/charts/TestTimeSeriesChart';
import TimelineGanttChart from '../components/charts/TimelineGanttChart';
import TestTable from '../components/widgets/TestTable';
import AdvancedAnalytics from '../components/widgets/AdvancedAnalytics';
import ExportButtons from '../components/widgets/ExportButtons';
import SearchAndFilter from '../components/widgets/SearchAndFilter';
import { FolderOpen, Calendar, Loader2, AlertCircle, BarChart2, Clock, CheckCircle, XCircle, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Home: React.FC = () => {
  const {
    testData,
    setTestData,
    dataSource,
    filteredTests,
    setFilteredTests,
    dateRange,
    setDateRange,
    isLoading,
    setIsLoading,
  } = useData();

  const [error, setError] = React.useState<string | null>(null);
  const [searchFilteredTests, setSearchFilteredTests] = React.useState<TestBehavior[]>([]);

  useEffect(() => {
    if (testData) {
      const filtered = filterTestsByDateRange(testData.tests, dateRange.start, dateRange.end);
      setFilteredTests(filtered);
    }
  }, [testData, dateRange, setFilteredTests]);

  const handleLoadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (dataSource.type === 'local') {
        if (isFileSystemAccessSupported()) {
          result = await scanLocalFolder();
        } else {
          // Fallback to file input for iframe environments
          result = await uploadBehaviorsFiles();
        }      } else if (dataSource.type === 'ftp' && dataSource.ftpConfig) {
        result = await ftpService.downloadAllureFiles(dataSource.ftpConfig);
      } else {
        throw new Error('Invalid data source configuration');
      }      const aggregated = aggregateTestData(
        result.behaviors, 
        result.categories, 
        result.packages, 
        result.suites, 
        result.timeline
      );
      setTestData(aggregated);

      // Update API service with new data
      testObservabilityAPI.setTestData(aggregated);

      // Set default date range to show all data
      setDateRange({
        start: aggregated.dateRange.earliest,
        end: aggregated.dateRange.latest,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  // Update search filtered tests when filtered tests change
  useEffect(() => {
    setSearchFilteredTests(filteredTests);
  }, [filteredTests]);

  const getFilteredStats = () => {
    if (!searchFilteredTests.length) {
      return { passed: 0, failed: 0, broken: 0, skipped: 0, total: 0, duration: 0 };
    }

    const stats = {
      passed: searchFilteredTests.filter(t => t.status === 'passed').length,
      failed: searchFilteredTests.filter(t => t.status === 'failed').length,
      broken: searchFilteredTests.filter(t => t.status === 'broken').length,
      skipped: searchFilteredTests.filter(t => t.status === 'skipped').length,
      total: searchFilteredTests.length,
      duration: searchFilteredTests.reduce((sum, test) => sum + (test.duration || 0), 0),
    };

    return stats;
  };

  const stats = getFilteredStats();

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sampleData = loadSampleData();
      const result = {
        behaviors: JSON.parse(sampleData.behaviors),
        categories: JSON.parse(sampleData.categories),
        packages: null,
        suites: null,
        timeline: null
      };

      const aggregated = aggregateTestData(
        result.behaviors, 
        result.categories, 
        result.packages, 
        result.suites, 
        result.timeline
      );
      setTestData(aggregated);

      // Update API service with new data
      testObservabilityAPI.setTestData(aggregated);

      // Set default date range to show all data
      setDateRange({
        start: aggregated.dateRange.earliest,
        end: aggregated.dateRange.latest,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visualize and analyze your test execution data
          </p>
        </div>        <div className="flex flex-col sm:flex-row gap-3">          {/* Export Buttons */}
          {testData && (
            <ExportButtons testData={testData} filteredTests={searchFilteredTests} />
          )}
          
          {/* Date Range Picker */}
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.start && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.start ? format(dateRange.start, "MMM dd, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.start || undefined}
                  onSelect={(date) => setDateRange({ ...dateRange, start: date || null })}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.end && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.end ? format(dateRange.end, "MMM dd, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.end || undefined}
                  onSelect={(date) => setDateRange({ ...dateRange, end: date || null })}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>          <Button
            onClick={handleLoadData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            {dataSource.type === 'local' 
              ? (isFileSystemAccessSupported() ? 'Open Folder' : 'Upload Files')
              : 'Load from FTP'
            }
          </Button>
          
          {/* Sample Data Button for Testing */}
          <Button
            onClick={handleLoadSampleData}
            disabled={isLoading}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="mr-2 h-4 w-4" />
            )}
            Load Sample Data
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {!isFileSystemAccessSupported() && error.includes('iframe') && (
              <div className="mt-2">
                <strong>Tip:</strong> Open this app in a new tab for full folder access, or use the file upload option.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">
                {dataSource.type === 'local' 
                  ? (isFileSystemAccessSupported() 
                      ? 'Scanning folders for behaviors.json and categories.json files...' 
                      : 'Processing uploaded files...')
                  : 'Connecting to FTP server...'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {!isLoading && testData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange.start || dateRange.end ? 'Filtered results' : 'All time'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.passed} of {stats.total} passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.broken} broken, {stats.skipped} skipped
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats.duration / 1000 / 60)}m
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {stats.total > 0 ? Math.round(stats.duration / stats.total / 1000) : 0}s per test
                </p>
              </CardContent>
            </Card>
          </div>          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Status Distribution</CardTitle>
                <CardDescription>Breakdown of test results</CardDescription>
              </CardHeader>
              <CardContent>
                <TestStatusChart
                  passed={stats.passed}
                  failed={stats.failed}
                  broken={stats.broken}
                  skipped={stats.skipped}
                  chartType="pie"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execution Trends</CardTitle>
                <CardDescription>Pass rate and duration over time</CardDescription>
              </CardHeader>
              <CardContent>
                <TestTimeSeriesChart tests={filteredTests} />
              </CardContent>
            </Card>
          </div>          {/* Timeline Chart */}
          {testData.timeline && 
           testData.timeline.children && 
           testData.timeline.children.length > 0 && 
           testData.timeline.children.some(item => item.time && item.time.start && item.time.stop) && (
            <Card>
              <CardHeader>
                <CardTitle>Parallel Execution Timeline</CardTitle>
                <CardDescription>
                  Visual representation of test execution across different threads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimelineGanttChart timelineItems={testData.timeline.children} />
              </CardContent>
            </Card>
          )}{/* Advanced Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                In-depth analysis of test patterns, performance, and reliability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedAnalytics testData={testData} />
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <SearchAndFilter 
            tests={filteredTests} 
            onFilteredTestsChange={setSearchFilteredTests}
          />

          {/* Test Table */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Detailed view of all test executions ({searchFilteredTests.length} results)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestTable tests={searchFilteredTests} categories={testData.categories} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !testData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Loaded</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              {isFileSystemAccessSupported() 
                ? "Load test data from your local filesystem or configure an FTP connection in Settings to get started."
                : "Upload test data files or configure an FTP connection in Settings to get started. For full folder access, open this app in a new browser tab."
              }
            </p>
            <Button onClick={handleLoadData} className="bg-blue-600 hover:bg-blue-700">
              <FolderOpen className="mr-2 h-4 w-4" />
              {dataSource.type === 'local' 
                ? (isFileSystemAccessSupported() ? 'Open Folder' : 'Upload Files')
                : 'Load from FTP'
              }
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Home;
