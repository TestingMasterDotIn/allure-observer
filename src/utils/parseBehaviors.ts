import { 
  BehaviorsData, 
  TestBehavior, 
  ParsedTestData, 
  TestData,
  CategoriesData, 
  CategoryItem, 
  CategoryChild,
  PackagesData,
  PackageChild,
  SuitesData,
  SuiteChild,
  TimelineData,
  TimelineItem,
  FlakyTest,
  Flakiness,
  RetryAnalysis,
  FailureClusterData,
  PerformanceMetrics
} from '../types/behaviors';

export const parseBehaviorsJson = (jsonContent: string): BehaviorsData | null => {
  try {
    return JSON.parse(jsonContent) as BehaviorsData;
  } catch (error) {
    console.error('Error parsing behaviors.json:', error);
    return null;
  }
};

export const parseCategoriesJson = (jsonContent: string): CategoriesData | null => {
  try {
    return JSON.parse(jsonContent) as CategoriesData;
  } catch (error) {
    console.error('Error parsing categories.json:', error);
    return null;
  }
};

export const parsePackagesJson = (jsonContent: string): PackagesData | null => {
  try {
    return JSON.parse(jsonContent) as PackagesData;
  } catch (error) {
    console.error('Error parsing packages.json:', error);
    return null;
  }
};

export const parseSuitesJson = (jsonContent: string): SuitesData | null => {
  try {
    return JSON.parse(jsonContent) as SuitesData;
  } catch (error) {
    console.error('Error parsing suites.json:', error);
    return null;
  }
};

export const parseTimelineJson = (jsonContent: string): TimelineData | null => {
  try {
    return JSON.parse(jsonContent) as TimelineData;
  } catch (error) {
    console.error('Error parsing timeline.json:', error);
    return null;
  }
};

export const aggregateTestData = (
  allBehaviors: BehaviorsData[], 
  allCategories: CategoriesData[] = [],
  allPackages: PackagesData[] = [],
  allSuites: SuitesData[] = [],
  allTimeline: TimelineData[] = []
): TestData => {
  const allTests: TestBehavior[] = [];
  
  allBehaviors.forEach(behaviors => {
    if (behaviors.children) {
      allTests.push(...behaviors.children);
    }
  });

  // Enhance test data with package and suite information
  if (allPackages.length > 0 && allSuites.length > 0) {
    allTests.forEach(test => {
      // Find package info
      const packageInfo = findTestInPackages(test.uid || '', allPackages);
      if (packageInfo) {
        test.packageName = packageInfo;
      }
      
      // Find suite info
      const suiteInfo = findTestInSuites(test.uid || '', allSuites);
      if (suiteInfo) {
        test.suiteName = suiteInfo;
      }
    });
  }

  // Enhance with timeline information
  if (allTimeline.length > 0) {
    const timelineItems = allTimeline.flatMap(t => t.children);
    allTests.forEach(test => {
      const timelineItem = timelineItems.find(item => item.uid === test.uid);
      if (timelineItem) {
        test.threadId = timelineItem.thread;
      }
    });
  }

  const totalTests = allTests.length;
  const passedTests = allTests.filter(test => test.status === 'passed').length;
  const failedTests = allTests.filter(test => test.status === 'failed').length;
  const brokenTests = allTests.filter(test => test.status === 'broken').length;
  const skippedTests = allTests.filter(test => test.status === 'skipped').length;
  
  const totalDuration = allTests.reduce((sum, test) => sum + (test.duration || 0), 0);
  
  const timestamps = allTests
    .map(test => test.time?.start)
    .filter(timestamp => timestamp)
    .sort((a, b) => a - b);
  
  const dateRange = {
    earliest: timestamps.length > 0 ? new Date(timestamps[0]) : new Date(),
    latest: timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]) : new Date(),
  };

  const categories = allCategories.length > 0 ? allCategories[0] : undefined;
  const packages = allPackages.length > 0 ? allPackages[0] : undefined;
  const suites = allSuites.length > 0 ? allSuites[0] : undefined;
  const timeline = allTimeline.length > 0 ? allTimeline[0] : undefined;

  // Calculate enhanced metrics
  const flakyTests = allTests.filter(test => test.flaky).length;
  const retriedTests = allTests.filter(test => (test.retryCount || 0) > 0).length;
  const uniqueThreads = new Set(allTests.map(test => test.threadId).filter(Boolean));
  const threadCount = uniqueThreads.size;

  // Calculate advanced analytics
  const flakiness = calculateFlakiness(allTests);
  const retryAnalysis = calculateRetryAnalysis(allTests);
  const failureClusters = calculateFailureClusters(allTests);
  const performanceMetrics = calculatePerformanceMetrics(allTests);

  return {
    tests: allTests,
    totalTests,
    passedTests,
    failedTests,
    brokenTests,
    skippedTests,
    totalDuration,
    dateRange,
    categories,
    packages,
    suites,
    timeline,
    flakyTests,
    retriedTests,
    threadCount,
    flakiness,
    retryAnalysis,
    failureClusters,
    performanceMetrics,
  };
};

// Helper functions to find test information in packages and suites
const findTestInPackages = (uid: string, packages: PackagesData[]): string | null => {
  for (const pkg of packages) {
    const found = searchInPackageChildren(uid, pkg.children || [], pkg.name);
    if (found) return found;
  }
  return null;
};

const searchInPackageChildren = (uid: string, children: PackageChild[], parentName: string): string | null => {
  for (const child of children) {
    if (child.uid === uid) {
      return parentName;
    }
    if (child.children) {
      const found = searchInPackageChildren(uid, child.children, child.name);
      if (found) return found;
    }
  }
  return null;
};

const findTestInSuites = (uid: string, suites: SuitesData[]): string | null => {
  for (const suite of suites) {
    const found = searchInSuiteChildren(uid, suite.children || [], suite.name);
    if (found) return found;
  }
  return null;
};

const searchInSuiteChildren = (uid: string, children: SuiteChild[], parentName: string): string | null => {
  for (const child of children) {
    if (child.uid === uid) {
      return parentName;
    }
    if (child.children) {
      const found = searchInSuiteChildren(uid, child.children, child.name);
      if (found) return found;
    }
  }
  return null;
};

export const filterTestsByDateRange = (tests: TestBehavior[], startDate: Date | null, endDate: Date | null): TestBehavior[] => {
  return tests.filter(test => {
    if (!test.time?.start) return true;
    
    const testDate = new Date(test.time.start);
    
    if (startDate && testDate < startDate) return false;
    if (endDate && testDate > endDate) return false;
    
    return true;
  });
};

export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'passed':
      return 'text-green-600 bg-green-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    case 'broken':
      return 'text-orange-600 bg-orange-100';
    case 'skipped':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Advanced analytics functions
export const detectFlakyTests = (tests: TestBehavior[]): TestBehavior[] => {
  const testGroups = tests.reduce((acc, test) => {
    const key = test.name || test.fullName || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(test);
    return acc;
  }, {} as Record<string, TestBehavior[]>);

  const flakyTests: TestBehavior[] = [];
  
  Object.values(testGroups).forEach(group => {
    if (group.length > 1) {
      const statuses = new Set(group.map(t => t.status));
      if (statuses.size > 1) {
        // Mark all instances as flaky if they have different statuses
        group.forEach(test => {
          test.flaky = true;
          flakyTests.push(test);
        });
      }
    }
  });

  return flakyTests;
};

export const clusterFailures = (failedTests: TestBehavior[]): Record<string, TestBehavior[]> => {
  const clusters: Record<string, TestBehavior[]> = {};
  
  failedTests.forEach(test => {
    const errorMessage = test.statusDetails?.message || 'Unknown error';
    const errorType = extractErrorType(errorMessage);
    
    if (!clusters[errorType]) clusters[errorType] = [];
    clusters[errorType].push(test);
  });

  return clusters;
};

const extractErrorType = (message: string): string => {
  // Simple error type extraction - can be enhanced
  if (message.includes('AssertionError')) return 'Assertion Error';
  if (message.includes('TimeoutError')) return 'Timeout Error';
  if (message.includes('NullPointerException')) return 'Null Pointer';
  if (message.includes('ConnectionError')) return 'Connection Error';
  if (message.includes('ElementNotFound')) return 'Element Not Found';
  return 'Other Error';
};

// Advanced analytics calculation functions
export const calculateFlakiness = (tests: TestBehavior[]): Flakiness => {
  const testGroups = tests.reduce((acc, test) => {
    const key = test.name || test.fullName || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(test);
    return acc;
  }, {} as Record<string, TestBehavior[]>);

  const flakyTests: FlakyTest[] = [];
  
  Object.entries(testGroups).forEach(([testName, group]) => {
    if (group.length > 1) {
      const passCount = group.filter(t => t.status === 'passed').length;
      const failCount = group.filter(t => t.status === 'failed' || t.status === 'broken').length;
      
      if (passCount > 0 && failCount > 0) {
        const flakinessScore = failCount / (passCount + failCount);
        const lastExecution = new Date(Math.max(...group.map(t => t.time?.start || 0)));
        
        flakyTests.push({
          testName,
          passCount,
          failCount,
          flakinessScore,
          lastExecution,
        });
      }
    }
  });

  const overallFlakinessScore = flakyTests.length > 0 
    ? flakyTests.reduce((sum, test) => sum + test.flakinessScore, 0) / flakyTests.length 
    : 0;

  return {
    flakyTests: flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore),
    overallFlakinessScore,
  };
};

export const calculateRetryAnalysis = (tests: TestBehavior[]): RetryAnalysis => {
  const retriedTests = tests.filter(test => (test.retryCount || 0) > 0);
  const totalRetries = tests.reduce((sum, test) => sum + (test.retryCount || 0), 0);
  const successfulRetries = retriedTests.filter(test => test.status === 'passed').length;

  const testRetryMap = new Map<string, number>();
  tests.forEach(test => {
    const testName = test.name || test.fullName || 'unknown';
    const retryCount = test.retryCount || 0;
    if (retryCount > 0) {
      testRetryMap.set(testName, Math.max(testRetryMap.get(testName) || 0, retryCount));
    }
  });

  const mostRetriedTests = Array.from(testRetryMap.entries())
    .map(([testName, retryCount]) => ({ testName, retryCount }))
    .sort((a, b) => b.retryCount - a.retryCount)
    .slice(0, 10);

  return {
    totalRetries,
    retriedTests: retriedTests.length,
    successfulRetries,
    mostRetriedTests,
  };
};

export const calculateFailureClusters = (tests: TestBehavior[]): FailureClusterData => {
  const failedTests = tests.filter(test => test.status === 'failed' || test.status === 'broken');
  const errorGroups = new Map<string, string[]>();

  failedTests.forEach(test => {
    const errorMessage = test.statusDetails?.message || 'Unknown error';
    const errorType = extractErrorType(errorMessage);
    
    if (!errorGroups.has(errorType)) {
      errorGroups.set(errorType, []);
    }
    errorGroups.get(errorType)!.push(test.name || test.fullName || 'unknown');
  });

  const clusters = Array.from(errorGroups.entries())
    .filter(([_, tests]) => tests.length > 1) // Only cluster if multiple tests have same error
    .map(([errorType, testNames]) => ({
      commonError: errorType,
      tests: [...new Set(testNames)], // Remove duplicates
      similarity: testNames.length / failedTests.length,
    }))
    .sort((a, b) => b.tests.length - a.tests.length);

  return {
    clusters,
    totalClusters: clusters.length,
  };
};

export const calculatePerformanceMetrics = (tests: TestBehavior[]): PerformanceMetrics => {
  const durations = tests.map(test => test.duration || 0).filter(d => d > 0);
  
  if (durations.length === 0) {
    return {
      averageDuration: 0,
    };
  }

  const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const slowestDuration = Math.max(...durations);
  const fastestDuration = Math.min(...durations);

  const slowestTest = tests.find(test => test.duration === slowestDuration);
  const fastestTest = tests.find(test => test.duration === fastestDuration);

  // Create duration distribution buckets
  const durationDistribution: Record<string, number> = {
    '< 1s': 0,
    '1-5s': 0,
    '5-15s': 0,
    '15-60s': 0,
    '> 60s': 0,
  };

  durations.forEach(duration => {
    const seconds = duration / 1000;
    if (seconds < 1) durationDistribution['< 1s']++;
    else if (seconds < 5) durationDistribution['1-5s']++;
    else if (seconds < 15) durationDistribution['5-15s']++;
    else if (seconds < 60) durationDistribution['15-60s']++;
    else durationDistribution['> 60s']++;
  });

  return {
    averageDuration,
    slowestTest: slowestTest ? {
      name: slowestTest.name || slowestTest.fullName || 'unknown',
      duration: slowestTest.duration || 0,
    } : undefined,
    fastestTest: fastestTest ? {
      name: fastestTest.name || fastestTest.fullName || 'unknown',
      duration: fastestTest.duration || 0,
    } : undefined,
    durationDistribution,
  };
};

// Helper function for error details from categories
export const getErrorInfoFromCategories = (
  test: TestBehavior, 
  categories?: CategoriesData
): string | null => {
  // First, try to extract error information from various possible locations
  const errorInfo = extractErrorInfo(test);
  
  if (!categories) {
    return errorInfo ? `Error: ${errorInfo}` : null;
  }

  // Find matching category based on error message or trace
  const errorMessage = errorInfo?.toLowerCase() || '';
  
  for (const category of categories.children || []) {
    const categoryName = category.name.toLowerCase();
    
    // Simple name-based matching
    if (errorMessage.includes(categoryName) || 
        categoryName.includes('defect') || 
        categoryName.includes('error') ||
        categoryName.includes('failure') ||
        categoryName.includes('broken') ||
        categoryName.includes('flaky')) {
      return `Category: ${category.name}`;
    }
    
    // Check if the test has matching entries in category's children
    if (category.children) {
      for (const child of category.children) {
        const childName = child.name.toLowerCase();
        if (errorMessage.includes(childName) || 
            childName.includes('defect') ||
            childName.includes('error') ||
            childName.includes('failure')) {
          return `Category: ${category.name} > ${child.name}`;
        }
      }
    }
  }

  // Fallback: try to match based on status
  if (test.status === 'failed') {
    for (const category of categories.children || []) {
      if (category.name.toLowerCase().includes('fail')) {
        return `Category: ${category.name}`;
      }
    }
  }
  
  if (test.status === 'broken') {
    for (const category of categories.children || []) {
      if (category.name.toLowerCase().includes('broken')) {
        return `Category: ${category.name}`;
      }
    }
  }

  return errorInfo ? `Error: ${errorInfo}` : null;
};

// Helper function to extract error information from test object
export const extractErrorInfo = (test: TestBehavior): string | null => {
  // Check statusDetails first
  if (test.statusDetails?.message) {
    return test.statusDetails.message;
  }
  
  if (test.statusDetails?.trace) {
    return test.statusDetails.trace;
  }
  
  // Check if test object has other error properties (common in different Allure versions)
  const testRecord = test as unknown as Record<string, unknown>;
  
  // Check for common error property names
  const errorFields = [
    'message', 'errorMessage', 'failureMessage', 'exception', 
    'trace', 'stackTrace', 'errorTrace', 'failure', 'error',
    'statusMessage', 'statusTrace', 'description'
  ];
  
  for (const field of errorFields) {
    if (testRecord[field] && typeof testRecord[field] === 'string') {
      return testRecord[field] as string;
    }
  }
  
  // Check nested objects for error info
  if (testRecord.status && typeof testRecord.status === 'object') {
    const statusObj = testRecord.status as Record<string, unknown>;
    if (statusObj.message && typeof statusObj.message === 'string') return statusObj.message;
    if (statusObj.trace && typeof statusObj.trace === 'string') return statusObj.trace;
  }
  
  if (testRecord.result && typeof testRecord.result === 'object') {
    const resultObj = testRecord.result as Record<string, unknown>;
    if (resultObj.message && typeof resultObj.message === 'string') return resultObj.message;
    if (resultObj.trace && typeof resultObj.trace === 'string') return resultObj.trace;
  }
  
  return null;
};
