import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, TrendingUp, Bug, AlertCircle, XCircle } from "lucide-react";
import { useTestData } from "@/context/DataContext";
import { TestBehavior, FailureCluster } from "@/types/behaviors";

export default function Failures() {
  const { testData, loading } = useTestData();
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(new Set());

  const failureAnalysis = useMemo(() => {
    if (!testData?.tests) return { clusters: [], topFailedTests: [] };

    const failedTests = testData.tests.filter(test => 
      test.status === 'failed' || test.status === 'broken'
    );

    // Group by error message patterns
    const errorGroups = new Map<string, TestBehavior[]>();
    
    failedTests.forEach(test => {
      if (test.statusDetails?.message) {
        const errorKey = test.statusDetails.message.split('\n')[0].substring(0, 100);
        if (!errorGroups.has(errorKey)) {
          errorGroups.set(errorKey, []);
        }
        errorGroups.get(errorKey)!.push(test);
      }
    });

    const clusters: FailureCluster[] = Array.from(errorGroups.entries())
      .map(([pattern, tests]) => ({
        errorType: pattern,
        count: tests.length,
        tests,
        pattern
      }))
      .sort((a, b) => b.count - a.count);

    // Top failed tests by frequency
    const testFailureCounts = new Map<string, { test: TestBehavior, count: number }>();
    failedTests.forEach(test => {
      const key = test.name;
      if (!testFailureCounts.has(key)) {
        testFailureCounts.set(key, { test, count: 0 });
      }
      testFailureCounts.get(key)!.count++;
    });

    const topFailedTests = Array.from(testFailureCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { clusters, topFailedTests };
  }, [testData?.tests]);

  const toggleCluster = (index: number) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClusters(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalFailures = (testData?.failedTests || 0) + (testData?.brokenTests || 0);
  const failureRate = testData?.totalTests ? 
    ((totalFailures / testData.totalTests) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Failures & Defects</h1>
          <p className="text-muted-foreground">Analyze test failures and identify root causes</p>
        </div>
      </div>

      {/* Failure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Failures</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailures}</div>
            <p className="text-xs text-muted-foreground">
              {testData?.failedTests || 0} failed, {testData?.brokenTests || 0} broken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failureRate}%</div>
            <Progress value={parseFloat(failureRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Clusters</CardTitle>
            <Bug className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{failureAnalysis.clusters.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique error patterns identified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Failed Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Top 10 Failed Tests
          </CardTitle>
          <CardDescription>
            Tests with the highest failure frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {failureAnalysis.topFailedTests.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.test.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: <Badge variant="destructive">{item.test.status}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">{item.count}</div>
                  <div className="text-xs text-muted-foreground">failures</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Clusters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-orange-600" />
            Root Cause Clusters
          </CardTitle>
          <CardDescription>
            Common error patterns grouped by similarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {failureAnalysis.clusters.map((cluster, index) => (
              <Collapsible key={index}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto"
                      onClick={() => toggleCluster(index)}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-sm truncate max-w-[600px]">
                            {cluster.errorType}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="destructive">{cluster.count} tests</Badge>
                            <span className="text-xs text-muted-foreground">
                              {((cluster.count / totalFailures) * 100).toFixed(1)}% of failures
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        expandedClusters.has(index) ? 'rotate-180' : ''
                      }`} />
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t">
                      <div className="mt-3 space-y-2">
                        <h4 className="font-medium text-sm">Affected Tests:</h4>
                        {cluster.tests.slice(0, 10).map((test, testIndex) => (
                          <div key={testIndex} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{test.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Duration: {Math.round((test.duration || 0) / 1000)}s
                                {test.retryCount && test.retryCount > 0 && (
                                  <span className="ml-2">• Retries: {test.retryCount}</span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {test.status}
                            </Badge>
                          </div>
                        ))}
                        {cluster.tests.length > 10 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            ... and {cluster.tests.length - 10} more tests
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failure Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Failure Categories</CardTitle>
          <CardDescription>
            Breakdown of failure types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Failed Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{testData?.failedTests || 0}</span>
                <Progress value={testData?.totalTests ? ((testData.failedTests / testData.totalTests) * 100) : 0} className="w-20" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Broken Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{testData?.brokenTests || 0}</span>
                <Progress value={testData?.totalTests ? ((testData.brokenTests / testData.totalTests) * 100) : 0} className="w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
