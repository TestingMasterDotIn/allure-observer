import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  RefreshCw, 
  TrendingDown, 
  Clock, 
  GitBranch,
  Zap
} from 'lucide-react';
import { TestData } from '../../types/behaviors';

interface AdvancedAnalyticsProps {
  testData: TestData;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ testData }) => {
  const {
    flakiness,
    failureClusters,
    retryAnalysis,
    performanceMetrics
  } = testData;

  // Calculate flaky test statistics
  const flakyTests = flakiness?.flakyTests || [];
  const totalFlakyTests = flakyTests.length;
  const averageFlakiness = flakyTests.length > 0 
    ? flakyTests.reduce((sum, test) => sum + test.flakinessScore, 0) / flakyTests.length 
    : 0;

  // Calculate retry statistics
  const totalRetries = retryAnalysis?.totalRetries || 0;
  const retriedTests = retryAnalysis?.retriedTests || 0;
  const retryRate = testData.tests.length > 0 ? (retriedTests / testData.tests.length) * 100 : 0;

  // Performance metrics
  const avgDuration = performanceMetrics?.averageDuration || 0;
  const slowestTest = performanceMetrics?.slowestTest;
  const fastestTest = performanceMetrics?.fastestTest;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flaky Tests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalFlakyTests}</div>
            <p className="text-xs text-muted-foreground">
              Avg Score: {averageFlakiness.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Retries</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalRetries}</div>
            <p className="text-xs text-muted-foreground">
              {retryRate.toFixed(1)}% of tests retried
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failure Clusters</CardTitle>
            <GitBranch className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failureClusters?.clusters?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Common failure patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(avgDuration / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Per test execution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="flaky" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flaky">Flaky Tests</TabsTrigger>
          <TabsTrigger value="retries">Retries</TabsTrigger>
          <TabsTrigger value="clusters">Failure Clusters</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="flaky" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flaky Test Analysis</CardTitle>
              <CardDescription>
                Tests showing inconsistent behavior across executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flakyTests.length > 0 ? (
                <div className="space-y-3">
                  {flakyTests.slice(0, 10).map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium truncate">{test.testName}</div>
                        <div className="text-sm text-muted-foreground">
                          {test.passCount} passes, {test.failCount} failures
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={test.flakinessScore > 0.7 ? "destructive" : 
                                  test.flakinessScore > 0.4 ? "secondary" : "outline"}
                        >
                          {(test.flakinessScore * 100).toFixed(0)}% flaky
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {flakyTests.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {flakyTests.length - 10} more flaky tests...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No flaky tests detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retry Analysis</CardTitle>
              <CardDescription>
                Understanding test retry patterns and success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retryAnalysis && retryAnalysis.retriedTests > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{retryAnalysis.retriedTests}</div>
                      <div className="text-sm text-muted-foreground">Tests with retries</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{retryAnalysis.totalRetries}</div>
                      <div className="text-sm text-muted-foreground">Total retry attempts</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">
                        {((retryAnalysis.successfulRetries / retryAnalysis.totalRetries) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Retry success rate</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Most Retried Tests</h4>
                    {retryAnalysis.mostRetriedTests?.slice(0, 5).map((test, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <span className="font-medium truncate">{test.testName}</span>
                        <Badge variant="outline">{test.retryCount} retries</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No test retries detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failure Clustering</CardTitle>
              <CardDescription>
                Common failure patterns and error groupings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failureClusters && failureClusters.clusters && failureClusters.clusters.length > 0 ? (
                <div className="space-y-4">
                  {failureClusters.clusters.map((cluster, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Cluster #{index + 1}</h4>
                        <Badge variant="outline">{cluster.tests.length} tests</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Common Error:</strong> {cluster.commonError}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Similarity Score: {(cluster.similarity * 100).toFixed(1)}%
                      </div>
                      <div className="mt-2">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium">
                            View affected tests ({cluster.tests.length})
                          </summary>
                          <div className="mt-2 pl-4 space-y-1">
                            {cluster.tests.slice(0, 5).map((testName, testIndex) => (
                              <div key={testIndex} className="text-sm text-muted-foreground">
                                • {testName}
                              </div>
                            ))}
                            {cluster.tests.length > 5 && (
                              <div className="text-sm text-muted-foreground">
                                ... and {cluster.tests.length - 5} more
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No failure clusters detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>
                Test execution performance insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-lg font-bold">
                      {fastestTest ? (fastestTest.duration / 1000).toFixed(2) : 'N/A'}s
                    </div>
                    <div className="text-sm text-muted-foreground">Fastest Test</div>
                    {fastestTest && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {fastestTest.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center p-4 border rounded">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-lg font-bold">
                      {(avgDuration / 1000).toFixed(2)}s
                    </div>
                    <div className="text-sm text-muted-foreground">Average Duration</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded">
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <div className="text-lg font-bold">
                      {slowestTest ? (slowestTest.duration / 1000).toFixed(2) : 'N/A'}s
                    </div>
                    <div className="text-sm text-muted-foreground">Slowest Test</div>
                    {slowestTest && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {slowestTest.name}
                      </div>
                    )}
                  </div>
                </div>                {performanceMetrics?.durationDistribution && (
                  <div>
                    <h4 className="font-medium mb-2">Duration Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(performanceMetrics.durationDistribution).map(([range, count]) => {
                        const countNum = typeof count === 'number' ? count : 0;
                        const percentage = (countNum / testData.tests.length) * 100;
                        return (
                          <div key={range} className="flex items-center space-x-3">
                            <div className="w-20 text-sm font-medium">{range}</div>
                            <div className="flex-1">
                              <Progress value={percentage} className="h-2" />
                            </div>
                            <div className="w-16 text-sm text-muted-foreground text-right">
                              {countNum} ({percentage.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
