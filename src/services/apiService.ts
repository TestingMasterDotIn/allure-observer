import { TestData, TestBehavior } from '../types/behaviors';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  brokenTests: number;
  skippedTests: number;
  totalDuration: number;
  passRate: number;
  avgDuration: number;
}

interface TestEndpoint {
  endpoint: string;
  method: string;
  description: string;
  example?: string;
}

class TestObservabilityAPI {
  private testData: TestData | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  // Set the current test data
  setTestData(data: TestData) {
    this.testData = data;
  }

  // Get test summary
  getSummary(): ApiResponse<TestSummary> {
    if (!this.testData) {
      return {
        success: false,
        error: 'No test data available',
        timestamp: new Date().toISOString(),
      };
    }

    const summary: TestSummary = {
      totalTests: this.testData.totalTests,
      passedTests: this.testData.passedTests,
      failedTests: this.testData.failedTests,
      brokenTests: this.testData.brokenTests,
      skippedTests: this.testData.skippedTests,
      totalDuration: this.testData.totalDuration,
      passRate: this.testData.totalTests > 0 ? (this.testData.passedTests / this.testData.totalTests) * 100 : 0,
      avgDuration: this.testData.totalTests > 0 ? this.testData.totalDuration / this.testData.totalTests : 0,
    };

    return {
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  // Get all tests
  getTests(filters?: {
    status?: string;
    package?: string;
    suite?: string;
    thread?: string;
    limit?: number;
    offset?: number;
  }): ApiResponse<TestBehavior[]> {
    if (!this.testData) {
      return {
        success: false,
        error: 'No test data available',
        timestamp: new Date().toISOString(),
      };
    }

    let tests = [...this.testData.tests];

    // Apply filters
    if (filters) {
      if (filters.status) {
        tests = tests.filter(test => test.status === filters.status);
      }
      if (filters.package) {
        tests = tests.filter(test => test.packageName === filters.package);
      }
      if (filters.suite) {
        tests = tests.filter(test => test.suiteName === filters.suite);
      }
      if (filters.thread) {
        tests = tests.filter(test => test.threadId === filters.thread);
      }

      // Apply pagination
      if (filters.offset) {
        tests = tests.slice(filters.offset);
      }
      if (filters.limit) {
        tests = tests.slice(0, filters.limit);
      }
    }

    return {
      success: true,
      data: tests,
      timestamp: new Date().toISOString(),
    };
  }

  // Get failed tests only
  getFailedTests(): ApiResponse<TestBehavior[]> {
    if (!this.testData) {
      return {
        success: false,
        error: 'No test data available',
        timestamp: new Date().toISOString(),
      };
    }

    const failedTests = this.testData.tests.filter(test => 
      test.status === 'failed' || test.status === 'broken'
    );

    return {
      success: true,
      data: failedTests,
      timestamp: new Date().toISOString(),
    };
  }

  // Get flaky tests
  getFlakyTests(): ApiResponse<typeof this.testData.flakiness> {
    if (!this.testData || !this.testData.flakiness) {
      return {
        success: false,
        error: 'No flaky test data available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: this.testData.flakiness,
      timestamp: new Date().toISOString(),
    };
  }

  // Get performance metrics
  getPerformanceMetrics(): ApiResponse<typeof this.testData.performanceMetrics> {
    if (!this.testData || !this.testData.performanceMetrics) {
      return {
        success: false,
        error: 'No performance metrics available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: this.testData.performanceMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  // Get retry analysis
  getRetryAnalysis(): ApiResponse<typeof this.testData.retryAnalysis> {
    if (!this.testData || !this.testData.retryAnalysis) {
      return {
        success: false,
        error: 'No retry analysis available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: this.testData.retryAnalysis,
      timestamp: new Date().toISOString(),
    };
  }

  // Get failure clusters
  getFailureClusters(): ApiResponse<typeof this.testData.failureClusters> {
    if (!this.testData || !this.testData.failureClusters) {
      return {
        success: false,
        error: 'No failure clusters available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: this.testData.failureClusters,
      timestamp: new Date().toISOString(),
    };
  }

  // Get timeline data
  getTimeline(): ApiResponse<typeof this.testData.timeline> {
    if (!this.testData || !this.testData.timeline) {
      return {
        success: false,
        error: 'No timeline data available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: this.testData.timeline,
      timestamp: new Date().toISOString(),
    };
  }

  // Get available endpoints documentation
  getEndpoints(): ApiResponse<TestEndpoint[]> {
    const endpoints: TestEndpoint[] = [
      {
        endpoint: '/api/summary',
        method: 'GET',
        description: 'Get test execution summary with pass rates and duration',
        example: `${this.baseUrl}/api/summary`,
      },
      {
        endpoint: '/api/tests',
        method: 'GET',
        description: 'Get all tests with optional filters',
        example: `${this.baseUrl}/api/tests?status=failed&limit=10`,
      },
      {
        endpoint: '/api/tests/failed',
        method: 'GET',
        description: 'Get only failed and broken tests',
        example: `${this.baseUrl}/api/tests/failed`,
      },
      {
        endpoint: '/api/flaky',
        method: 'GET',
        description: 'Get flaky test analysis',
        example: `${this.baseUrl}/api/flaky`,
      },
      {
        endpoint: '/api/performance',
        method: 'GET',
        description: 'Get performance metrics and duration analysis',
        example: `${this.baseUrl}/api/performance`,
      },
      {
        endpoint: '/api/retries',
        method: 'GET',
        description: 'Get retry analysis and statistics',
        example: `${this.baseUrl}/api/retries`,
      },
      {
        endpoint: '/api/failures',
        method: 'GET',
        description: 'Get failure clustering analysis',
        example: `${this.baseUrl}/api/failures`,
      },
      {
        endpoint: '/api/timeline',
        method: 'GET',
        description: 'Get parallel execution timeline data',
        example: `${this.baseUrl}/api/timeline`,
      },
    ];

    return {
      success: true,
      data: endpoints,
      timestamp: new Date().toISOString(),
    };
  }

  // Generate webhook payload for external systems
  generateWebhookPayload(includeTests: boolean = false): object {
    if (!this.testData) {
      return { error: 'No test data available' };
    }

    const payload = {
      timestamp: new Date().toISOString(),
      summary: this.getSummary().data,
      analytics: {
        flakiness: this.testData.flakiness,
        retryAnalysis: this.testData.retryAnalysis,
        failureClusters: this.testData.failureClusters,
        performanceMetrics: this.testData.performanceMetrics,
      },
      dateRange: this.testData.dateRange,
      ...(includeTests && { tests: this.testData.tests }),
    };

    return payload;
  }

  // Generate status for external monitoring
  getHealthStatus(): ApiResponse<{
    status: 'healthy' | 'warning' | 'critical';
    passRate: number;
    flakyTestCount: number;
    failedTestCount: number;
    lastUpdate: string;
  }> {
    if (!this.testData) {
      return {
        success: false,
        error: 'No test data available',
        timestamp: new Date().toISOString(),
      };
    }

    const passRate = this.testData.totalTests > 0 
      ? (this.testData.passedTests / this.testData.totalTests) * 100 
      : 0;
    
    const flakyTestCount = this.testData.flakiness?.flakyTests.length || 0;
    const failedTestCount = this.testData.failedTests + this.testData.brokenTests;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (passRate < 80 || failedTestCount > 10) {
      status = 'critical';
    } else if (passRate < 95 || flakyTestCount > 5 || failedTestCount > 0) {
      status = 'warning';
    }

    return {
      success: true,
      data: {
        status,
        passRate,
        flakyTestCount,
        failedTestCount,
        lastUpdate: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Global API instance
export const testObservabilityAPI = new TestObservabilityAPI();

// Make API methods available globally for external access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).TestObservabilityAPI = {
    getSummary: () => testObservabilityAPI.getSummary(),
    getTests: (filters?: {
      status?: string;
      package?: string;
      suite?: string;
      thread?: string;
      limit?: number;
      offset?: number;
    }) => testObservabilityAPI.getTests(filters),
    getFailedTests: () => testObservabilityAPI.getFailedTests(),
    getFlakyTests: () => testObservabilityAPI.getFlakyTests(),
    getPerformanceMetrics: () => testObservabilityAPI.getPerformanceMetrics(),
    getRetryAnalysis: () => testObservabilityAPI.getRetryAnalysis(),
    getFailureClusters: () => testObservabilityAPI.getFailureClusters(),
    getTimeline: () => testObservabilityAPI.getTimeline(),
    getEndpoints: () => testObservabilityAPI.getEndpoints(),
    getHealthStatus: () => testObservabilityAPI.getHealthStatus(),
    generateWebhookPayload: (includeTests?: boolean) => testObservabilityAPI.generateWebhookPayload(includeTests),
  };
}

export default TestObservabilityAPI;
