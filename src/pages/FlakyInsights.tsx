import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, TrendingUp, RotateCcw, Target, Tag } from "lucide-react";
import { useTestData } from "@/context/DataContext";
import { TestBehavior, FlakyTest } from "@/types/behaviors";

export default function FlakyInsights() {
  const { testData, loading } = useTestData();
  const [showKnownFlaky, setShowKnownFlaky] = useState(false);
  const [knownFlakyTests, setKnownFlakyTests] = useState<Set<string>>(new Set());

  const flakyAnalysis = useMemo(() => {
    if (!testData?.tests) return { flakyTests: [], overallScore: 0, heatmapData: [] };

    // Identify potentially flaky tests based on retries and status patterns
    const testGroups = new Map<string, TestBehavior[]>();
    
    testData.tests.forEach(test => {
      const key = test.name;
      if (!testGroups.has(key)) {
        testGroups.set(key, []);
      }
      testGroups.get(key)!.push(test);
    });

    const flakyTests: FlakyTest[] = [];
    
    testGroups.forEach((executions, testName) => {
      const passCount = executions.filter(t => t.status === 'passed').length;
      const failCount = executions.filter(t => t.status === 'failed' || t.status === 'broken').length;
      const totalRetries = executions.reduce((sum, t) => sum + (t.retryCount || 0), 0);
      
      // Calculate flakiness score based on pass/fail ratio and retries
      let flakinessScore = 0;
      if (passCount > 0 && failCount > 0) {
        flakinessScore = Math.min(passCount, failCount) / (passCount + failCount);
      }
      if (totalRetries > 0) {
        flakinessScore = Math.max(flakinessScore, totalRetries / executions.length);
      }

      if (flakinessScore > 0.1 || totalRetries > 0) { // Threshold for flakiness
        flakyTests.push({
          testName,
          passCount,
          failCount,
          flakinessScore,
          lastExecution: new Date(Math.max(...executions.map(e => e.time.stop)))
        });
      }
    });

    flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore);

    const overallScore = flakyTests.length > 0 ? 
      flakyTests.reduce((sum, t) => sum + t.flakinessScore, 0) / flakyTests.length : 0;

    // Create heatmap data (simplified for demo)
    const heatmapData = flakyTests.slice(0, 20).map((test, index) => ({
      testName: test.testName,
      day: index % 7,
      hour: Math.floor(index / 7),
      flakinessScore: test.flakinessScore
    }));

    return { flakyTests, overallScore, heatmapData };
  }, [testData?.tests]);

  const toggleKnownFlaky = (testName: string) => {
    const newKnownFlaky = new Set(knownFlakyTests);
    if (newKnownFlaky.has(testName)) {
      newKnownFlaky.delete(testName);
    } else {
      newKnownFlaky.add(testName);
    }
    setKnownFlakyTests(newKnownFlaky);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredFlakyTests = showKnownFlaky ? 
    flakyAnalysis.flakyTests.filter(test => knownFlakyTests.has(test.testName)) :
    flakyAnalysis.flakyTests;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flaky Insights</h1>
          <p className="text-muted-foreground">Identify and analyze test instability patterns</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-known-flaky"
              checked={showKnownFlaky}
              onCheckedChange={setShowKnownFlaky}
            />
            <label htmlFor="show-known-flaky" className="text-sm">
              Show only known flaky
            </label>
          </div>
        </div>
      </div>

      {/* Flaky Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flaky Tests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {flakyAnalysis.flakyTests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tests showing instability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flakiness Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(flakyAnalysis.overallScore * 100).toFixed(1)}%
            </div>
            <Progress value={flakyAnalysis.overallScore * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Known Flaky</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {knownFlakyTests.size}
            </div>
            <p className="text-xs text-muted-foreground">
              Marked as known issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {flakyAnalysis.flakyTests.filter(t => t.flakinessScore > 0.5).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Score &gt; 50%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flaky Tests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Flaky Test Analysis
          </CardTitle>
          <CardDescription>
            Tests with inconsistent results and retry patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFlakyTests.slice(0, 20).map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{test.testName}</div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Pass: {test.passCount}</span>
                      <span>Fail: {test.failCount}</span>
                      <span>Last run: {test.lastExecution.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">
                        {(test.flakinessScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">flaky score</div>
                    </div>
                    
                    <Button
                      variant={knownFlakyTests.has(test.testName) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleKnownFlaky(test.testName)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {knownFlakyTests.has(test.testName) ? "Known" : "Mark"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-green-600 font-semibold">{test.passCount}</div>
                    <div className="text-xs text-muted-foreground">Passed</div>
                    <Progress 
                      value={(test.passCount / (test.passCount + test.failCount)) * 100} 
                      className="mt-1 h-2"
                    />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-red-600 font-semibold">{test.failCount}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                    <Progress 
                      value={(test.failCount / (test.passCount + test.failCount)) * 100} 
                      className="mt-1 h-2"
                    />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-yellow-600 font-semibold">
                      {(test.flakinessScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Flakiness</div>
                    <Progress 
                      value={test.flakinessScore * 100} 
                      className="mt-1 h-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flakiness Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Flakiness Heatmap</CardTitle>
          <CardDescription>
            Visual representation of test flakiness patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 p-4">
            {Array.from({ length: 7 }, (_, day) => (
              <div key={day} className="text-center text-xs font-medium p-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day]}
              </div>
            ))}
            
            {Array.from({ length: 24 }, (_, hour) => (
              Array.from({ length: 7 }, (_, day) => {
                const dataPoint = flakyAnalysis.heatmapData.find(d => d.day === day && d.hour === hour);
                const intensity = dataPoint ? dataPoint.flakinessScore : 0;
                
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-8 h-8 rounded border border-gray-300 ${
                      intensity > 0.7 ? 'bg-red-500' :
                      intensity > 0.4 ? 'bg-yellow-500' :
                      intensity > 0.1 ? 'bg-green-200' :
                      'bg-gray-100'
                    }`}
                    title={dataPoint ? `${dataPoint.testName}: ${(intensity * 100).toFixed(1)}%` : ''}
                  />
                );
              })
            )).flat()}
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>No flakiness</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 border border-gray-300 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 border border-gray-300 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 border border-gray-300 rounded"></div>
              <span>High</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retry Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            Retry Analysis
          </CardTitle>
          <CardDescription>
            Understanding retry patterns and success rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Most Retried Tests</h4>
              <div className="space-y-2">
                {testData?.tests
                  ?.filter(test => (test.retryCount || 0) > 0)
                  .sort((a, b) => (b.retryCount || 0) - (a.retryCount || 0))
                  .slice(0, 5)
                  .map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm truncate flex-1">{test.name}</span>
                      <Badge variant="outline">{test.retryCount} retries</Badge>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Retry Success Patterns</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tests with successful retries</span>
                  <span className="font-medium">
                    {testData?.tests?.filter(t => (t.retryCount || 0) > 0 && t.status === 'passed').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tests with failed retries</span>
                  <span className="font-medium">
                    {testData?.tests?.filter(t => (t.retryCount || 0) > 0 && t.status !== 'passed').length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average retries per test</span>
                  <span className="font-medium">
                    {testData?.tests ? 
                      (testData.tests.reduce((sum, t) => sum + (t.retryCount || 0), 0) / testData.tests.length).toFixed(1) :
                      '0'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
