import { BehaviorsData, ParsedTestData, TestBehavior } from '../types/behaviors';

interface AllureChild {
  name: string;
  status: string;
  time: { start: number; stop: number; duration: number };
  parameters?: string[];
  [key: string]: any;
}

interface AllureData {
  children: AllureChild[];
}

export const transformAllureData = (data: AllureData): ParsedTestData => {
  const tests: TestBehavior[] = data.children.map(child => ({
    name: child.name,
    status: child.status as 'passed' | 'failed' | 'broken' | 'skipped',
    time: child.time,
    duration: child.time.duration,
    parameters: child.parameters?.map(param => ({ name: '', value: param })) || [],
    uid: child.uid || '',
    fullName: child.fullName || child.name,
    statusDetails: child.statusDetails,
    retryCount: child.retryCount || 0,
    flaky: child.flaky || false,
    tags: child.tags || [],
    packageName: child.packageName || '',
    suiteName: child.suiteName || '',
    threadId: child.threadId || ''
  }));

  return {
    tests,
    totalTests: tests.length,
    passedTests: tests.filter(test => test.status === 'passed').length,
    failedTests: tests.filter(test => test.status === 'failed').length,
    brokenTests: tests.filter(test => test.status === 'broken').length,
    skippedTests: tests.filter(test => test.status === 'skipped').length,
    totalDuration: tests.reduce((sum, test) => sum + test.duration, 0),
    dateRange: {
      earliest: new Date(Math.min(...tests.map(test => test.time.start))),
      latest: new Date(Math.max(...tests.map(test => test.time.stop)))
    },
    flakyTests: tests.filter(test => test.flaky).length,
    retriedTests: tests.filter(test => (test.retryCount || 0) > 0).length,
    threadCount: new Set(tests.map(test => test.threadId).filter(Boolean)).size || 1
  };
};

// Keep the existing export for backwards compatibility
export const transformBehaviorsData = (data: BehaviorsData): TestBehavior[] => {
  return data.children;
};
