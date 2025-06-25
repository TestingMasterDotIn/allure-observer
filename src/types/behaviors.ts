export interface TestParameter {
  name: string;
  value: string;
}

export interface TestTime {
  start: number;
  stop: number;
  duration: number;
}

export interface TestBehavior {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  time: TestTime;
  duration: number;
  parameters?: TestParameter[];
  uid?: string;
  historyId?: string;
  fullName?: string;
  statusDetails?: {
    message?: string;
    trace?: string;
  };
  // Additional fields for enhanced observability
  retryCount?: number;
  flaky?: boolean;
  tags?: string[];
  packageName?: string;
  suiteName?: string;
  threadId?: string;
}

export interface CategoryChild {
  name: string;
  uid: string;
  parentUid?: string;
  status?: 'passed' | 'failed' | 'broken' | 'skipped';
  time?: TestTime;
  duration?: number;
  flaky?: boolean;
  newFailed?: boolean;
  newPassed?: boolean;
  newBroken?: boolean;
  retriesCount?: number;
  retriesStatusChange?: boolean;
  parameters?: string[];
  tags?: string[];
}

export interface CategoryItem {
  name: string;
  uid: string;
  children?: (CategoryItem | CategoryChild)[];
}

export interface CategoriesData {
  uid: string;
  name: string;
  children: CategoryItem[];
}

// New interfaces for additional Allure files
export interface PackageChild {
  name: string;
  uid: string;
  children?: PackageChild[];
}

export interface PackagesData {
  uid: string;
  name: string;
  children: PackageChild[];
}

export interface SuiteChild {
  name: string;
  uid: string;
  children?: SuiteChild[];
}

export interface SuitesData {
  uid: string;
  name: string;
  children: SuiteChild[];
}

export interface TimelineItem {
  uid: string;
  name: string;
  time: TestTime;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  thread: string;
  host: string;
}

export interface TimelineData {
  children: TimelineItem[];
}

export interface BehaviorsData {
  children: TestBehavior[];
}

export interface ParsedTestData {
  tests: TestBehavior[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  brokenTests: number;
  skippedTests: number;
  totalDuration: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  categories?: CategoriesData;
  packages?: PackagesData;
  suites?: SuitesData;
  timeline?: TimelineData;
  // Enhanced metrics
  flakyTests: number;
  retriedTests: number;
  threadCount: number;
}

export interface FtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  remotePath: string;
}

export interface DataSource {
  type: 'local' | 'ftp';
  ftpConfig?: FtpConfig;
}

// Export interfaces for advanced features
export interface TestHistoryEntry {
  testId: string;
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  duration: number;
  timestamp: Date;
  buildId?: string;
  retryCount: number;
}

export interface FailureCluster {
  errorType: string;
  count: number;
  tests: TestBehavior[];
  pattern: string;
}

// Enhanced analytics interfaces
export interface FlakyTest {
  testName: string;
  passCount: number;
  failCount: number;
  flakinessScore: number;
  lastExecution: Date;
}

export interface Flakiness {
  flakyTests: FlakyTest[];
  overallFlakinessScore: number;
}

export interface RetryAnalysis {
  totalRetries: number;
  retriedTests: number;
  successfulRetries: number;
  mostRetriedTests?: Array<{
    testName: string;
    retryCount: number;
  }>;
}

export interface FailureClusterData {
  clusters: Array<{
    commonError: string;
    tests: string[];
    similarity: number;
  }>;
  totalClusters: number;
}

export interface PerformanceMetrics {
  averageDuration: number;
  slowestTest?: {
    name: string;
    duration: number;
  };
  fastestTest?: {
    name: string;
    duration: number;
  };
  durationDistribution?: Record<string, number>;
}

// Enhanced ParsedTestData with analytics
export interface TestData extends ParsedTestData {
  flakiness?: Flakiness;
  failureClusters?: FailureClusterData;
  retryAnalysis?: RetryAnalysis;
  performanceMetrics?: PerformanceMetrics;
}
