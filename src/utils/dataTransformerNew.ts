import { 
  TestData, 
  BehaviorsData, 
  CategoriesData, 
  PackagesData, 
  SuitesData, 
  TimelineData,
  TestBehavior 
} from '../types/behaviors';

// Generic interface for nested data structures
interface AllureChild {
  name?: string;
  uid?: string;
  status?: 'passed' | 'failed' | 'broken' | 'skipped';
  time?: {
    start: number;
    stop: number;
    duration: number;
  };
  flaky?: boolean;
  retriesCount?: number;
  parameters?: string[];
  tags?: string[];
  children?: AllureChild[];
}

/**
 * Transform raw Allure data into the TestData format expected by the dashboard
 */
export const transformAllureData = (data: {
  behaviors: BehaviorsData[];
  categories: CategoriesData[];
  packages: PackagesData[];
  suites: SuitesData[];
  timeline: TimelineData[];
}): TestData => {
  // For now, let's create a simple transformation using the behaviors data
  // This can be enhanced later based on the actual data structure
  const allTests: TestBehavior[] = [];
  
  // Process behaviors data - these are already in the correct format
  data.behaviors.forEach(behaviorData => {
    if (behaviorData.children) {
      allTests.push(...behaviorData.children);
    }
  });

  // If we don't have behaviors data, try to extract from other sources
  if (allTests.length === 0) {
    // Process categories data
    data.categories.forEach(categoryData => {
      if (categoryData.children) {
        extractTestsFromGenericChildren(categoryData.children, allTests, 'categories');
      }
    });

    // Process packages data
    data.packages.forEach(packageData => {
      if (packageData.children) {
        extractTestsFromGenericChildren(packageData.children, allTests, 'packages');
      }
    });

    // Process suites data
    data.suites.forEach(suiteData => {
      if (suiteData.children) {
        extractTestsFromGenericChildren(suiteData.children, allTests, 'suites');
      }
    });
  }

  // Calculate statistics
  const totalTests = allTests.length;
  const passedTests = allTests.filter(test => test.status === 'passed').length;
  const failedTests = allTests.filter(test => test.status === 'failed').length;
  const brokenTests = allTests.filter(test => test.status === 'broken').length;
  const skippedTests = allTests.filter(test => test.status === 'skipped').length;
  const flakyTests = allTests.filter(test => test.flaky).length;
  const retriedTests = allTests.filter(test => (test.retryCount || 0) > 0).length;
  
  const totalDuration = allTests.reduce((sum, test) => sum + (test.duration || 0), 0);
  
  // Calculate date range
  const testTimes = allTests
    .map(test => test.time)
    .filter(time => time && time.start && time.stop);
  
  const earliest = testTimes.length > 0 
    ? new Date(Math.min(...testTimes.map(t => t.start)))
    : new Date();
  const latest = testTimes.length > 0
    ? new Date(Math.max(...testTimes.map(t => t.stop)))
    : new Date();

  // Extract thread information from timeline data
  const threadIds = new Set<string>();
  data.timeline.forEach(timelineData => {
    if (timelineData.children) {
      timelineData.children.forEach(child => {
        const timelineChild = child as AllureChild;
        if (timelineChild.name) {
          threadIds.add(timelineChild.name);
        }
      });
    }
  });

  const baseData = {
    tests: allTests,
    totalTests,
    passedTests,
    failedTests,
    brokenTests,
    skippedTests,
    totalDuration,
    dateRange: { earliest, latest },
    flakyTests,
    retriedTests,
    threadCount: threadIds.size || 1,
    categories: data.categories[0] || undefined,
    packages: data.packages[0] || undefined,
    suites: data.suites[0] || undefined,
    timeline: data.timeline[0] || undefined
  };

  // Add enhanced analytics
  const testData: TestData = {
    ...baseData,
    performanceMetrics: {
      averageDuration: totalTests > 0 ? totalDuration / totalTests : 0,
      slowestTest: allTests.reduce((slowest, test) => 
        (test.duration || 0) > (slowest?.duration || 0) ? test : slowest, allTests[0]
      ),
      fastestTest: allTests.reduce((fastest, test) => 
        (test.duration || 0) < (fastest?.duration || 0) ? test : fastest, allTests[0]
      )
    }
  };

  return testData;
};

/**
 * Extract tests from generic children structures (used for categories, packages, suites)
 */
function extractTestsFromGenericChildren(children: unknown[], tests: TestBehavior[], source: string, parentName = '') {
  children.forEach(child => {
    const childObj = child as AllureChild;
    
    // If this child has its own children, recurse into them
    if (childObj.children && childObj.children.length > 0) {
      extractTestsFromGenericChildren(childObj.children, tests, source, childObj.name || parentName);
    } else if (childObj.uid && childObj.status) {
      // This is a leaf node (actual test)
      tests.push({
        name: childObj.name || 'Unknown Test',
        status: childObj.status || 'skipped',
        time: childObj.time || { start: 0, stop: 0, duration: 0 },
        duration: childObj.time?.duration || 0,
        uid: childObj.uid,
        parameters: childObj.parameters?.map((p: string) => ({ name: p, value: '' })) || [],
        fullName: parentName ? `${parentName}.${childObj.name}` : childObj.name,
        packageName: source,
        suiteName: parentName,
        flaky: childObj.flaky || false,
        retryCount: childObj.retriesCount || 0,
        tags: childObj.tags || []
      });
    }
  });
}
