import { TestBehavior, CategoriesData, BehaviorsData } from '../types/behaviors';

// Generate sample test data with various error scenarios for testing
export const generateSampleTestData = (): { behaviors: BehaviorsData; categories: CategoriesData } => {
  const now = Date.now();
    const behaviors: BehaviorsData = {
    children: [
      // Test with statusDetails.message
      {
        name: 'Test with Status Details Message',
        status: 'failed',
        time: {
          start: now - 5000,
          stop: now - 2000,
          duration: 3000
        },
        duration: 3000,
        uid: 'test-1',
        statusDetails: {
          message: 'AssertionError: Expected value to be 42 but was 24',
          trace: 'at TestClass.testMethod(TestClass.java:15)\n\tat org.junit.Assert.assertEquals(Assert.java:115)'
        }
      },
      
      // Test with broken status
      {
        name: 'Test with Configuration Error',
        status: 'broken',
        time: {
          start: now - 8000,
          stop: now - 6000,
          duration: 2000
        },
        duration: 2000,
        uid: 'test-2',
        statusDetails: {
          message: 'NullPointerException: Database connection is null',
          trace: 'at DatabaseService.connect(DatabaseService.java:23)\n\tat TestSetup.setUp(TestSetup.java:45)'
        }
      },
        // Test with alternative error structure (simulate different Allure versions)
      {
        name: 'Test with Alternative Error Structure',
        status: 'failed',
        time: {
          start: now - 12000,
          stop: now - 9000,
          duration: 3000
        },
        duration: 3000,
        uid: 'test-3',
        statusDetails: {
          message: 'Timeout: Element not found within 30 seconds',
          trace: 'at WebDriverWait.until(WebDriverWait.java:80)\n\tat PageObject.findElement(PageObject.java:12)'
        }
      } as TestBehavior,
      
      // Test with minimal error info
      {
        name: 'Test with Minimal Error Info',
        status: 'failed',
        time: {
          start: now - 15000,
          stop: now - 12000,
          duration: 3000
        },
        duration: 3000,
        uid: 'test-4',
        // No statusDetails, just status
      },
      
      // Passing test (should not show error modal)
      {
        name: 'Passing Test',
        status: 'passed',
        time: {
          start: now - 18000,
          stop: now - 15000,
          duration: 3000
        },
        duration: 3000,
        uid: 'test-5'
      }
    ]
  };
  
  const categories: CategoriesData = {
    uid: 'categories-uid',
    name: 'Test Categories',
    children: [
      {
        name: 'Product defects',
        uid: 'defects-uid',
        children: [
          {
            name: 'Assertion failures',
            uid: 'assertion-uid'
          },
          {
            name: 'Logic errors',
            uid: 'logic-uid'
          }
        ]
      },
      {
        name: 'Test defects',
        uid: 'test-defects-uid',
        children: [
          {
            name: 'Configuration issues',
            uid: 'config-uid'
          },
          {
            name: 'Test data problems',
            uid: 'data-uid'
          }
        ]
      },
      {
        name: 'Infrastructure defects',
        uid: 'infra-uid',
        children: [
          {
            name: 'Network timeouts',
            uid: 'timeout-uid'
          },
          {
            name: 'Database connectivity',
            uid: 'db-uid'
          }
        ]
      }
    ]
  };
  
  return { behaviors, categories };
};

// Function to load sample data into the application (for testing purposes)
export const loadSampleData = () => {
  const { behaviors, categories } = generateSampleTestData();
  
  console.log('Sample test data generated:');
  console.log('Behaviors:', behaviors);
  console.log('Categories:', categories);
  
  return {
    behaviors: JSON.stringify(behaviors, null, 2),
    categories: JSON.stringify(categories, null, 2)
  };
};
