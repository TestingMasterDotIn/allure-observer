import { BehaviorsData, FtpConfig, CategoriesData, PackagesData, SuitesData, TimelineData } from '../types/behaviors';
import { parseBehaviorsJson } from '../utils/parseBehaviors';

/**
 * FTP Service for handling remote file operations via backend API
 * 
 * This service communicates with a backend API that handles actual FTP operations.
 * The backend can be either Node.js or Python - see /backend folder for implementations.
 * 
 * Make sure to start the backend service before using FTP functionality:
 * - Node.js: cd backend/nodejs && npm install && npm start
 * - Python: cd backend/python && pip install -r requirements.txt && python app.py
 */

const BACKEND_URL = 'http://localhost:3001';

// Helper function to clean host input
const cleanHost = (host: string): string => {
  // Remove protocol prefixes
  let cleanedHost = host.trim();
  if (cleanedHost.includes('://')) {
    cleanedHost = cleanedHost.split('://')[1];
  }
  
  // Remove trailing slashes
  cleanedHost = cleanedHost.replace(/\/+$/, '');
  
  return cleanedHost;
};

// Enhanced FTP service interface
export interface FtpServiceInterface {
  connect(config: FtpConfig): Promise<boolean>;
  listFiles(path: string): Promise<string[]>;
  listDirectories(path: string): Promise<string[]>;
  downloadFile(fileName: string): Promise<string>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  exploreDirectory(path?: string, maxDepth?: number): Promise<DirectoryExploration>;
}

export interface DirectoryExploration {
  path: string;
  directories: string[];
  files: string[];
  allureFiles: string[];
  subdirectories?: Record<string, DirectoryExploration>;
  error?: string;
}

export class FtpService implements FtpServiceInterface {
  private connected = false;
  private config: FtpConfig | null = null;  async connect(config: FtpConfig): Promise<boolean> {
    try {
      const cleanedHost = cleanHost(config.host);
      console.log('Testing FTP connection via backend:', cleanedHost);
      
      const response = await fetch(`${BACKEND_URL}/api/ftp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: cleanedHost,
          port: config.port,
          user: config.user,
          password: config.password,
        }),
      });

      if (response.ok) {
        this.config = { ...config, host: cleanedHost };
        this.connected = true;
        console.log('FTP connection successful');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Connection failed');
      }
    } catch (error) {
      console.error('FTP connection failed:', error);
      this.connected = false;
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Backend server not running. Please start the backend service first.');
      }
      throw error;
    }
  }

  async listFiles(path: string = '/'): Promise<string[]> {
    if (!this.connected || !this.config) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const allureFiles = [
        'behaviors.json',
        'categories.json',
        'packages.json',
        'suites.json',
        'timeline.json'
      ];
      
      return allureFiles;
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }
  async listDirectories(path: string = '/'): Promise<string[]> {
    if (!this.config) {
      throw new Error('Not connected to FTP server');
    }

    try {
      console.log('Listing directories via backend:', path);
      
      const response = await fetch(`${BACKEND_URL}/api/ftp/directories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          user: this.config.user,
          password: this.config.password,
          remotePath: path,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.directories || [];
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list directories');
      }
    } catch (error) {
      console.error('Failed to list directories:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Backend server not running. Please start the backend service first.');
      }
      throw error;
    }
  }

  async downloadFile(fileName: string): Promise<string> {
    if (!this.connected || !this.config) {
      throw new Error('Not connected to FTP server');
    }

    try {
      console.log('Downloading file:', fileName);
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return realistic mock data based on file type
      switch (fileName) {
        case 'behaviors.json':
          return JSON.stringify({
            children: [
              {
                name: 'Login Test Suite',
                status: 'passed',
                time: { start: Date.now() - 300000, stop: Date.now() - 295000, duration: 5000 },
                duration: 5000,
                uid: 'ftp-login-test-1',
                parameters: [
                  { name: 'browser', value: 'chrome' },
                  { name: 'environment', value: 'staging' },
                  { name: 'user', value: 'test_user' }
                ]
              },
              {
                name: 'API Authentication Test',
                status: 'passed',
                time: { start: Date.now() - 250000, stop: Date.now() - 247000, duration: 3000 },
                duration: 3000,
                uid: 'ftp-api-test-1',
                parameters: [
                  { name: 'endpoint', value: '/api/auth' },
                  { name: 'method', value: 'POST' }
                ]
              },
              {
                name: 'Database Connection Test',
                status: 'failed',
                time: { start: Date.now() - 200000, stop: Date.now() - 195000, duration: 5000 },
                duration: 5000,
                uid: 'ftp-db-test-1',
                statusDetails: {
                  message: 'Connection timeout',
                  trace: 'org.postgresql.util.PSQLException: Connection timeout'
                },
                parameters: [
                  { name: 'database', value: 'test_db' },
                  { name: 'host', value: 'db.example.com' }
                ]
              },
              {
                name: 'File Upload Test',
                status: 'broken',
                time: { start: Date.now() - 150000, stop: Date.now() - 148000, duration: 2000 },
                duration: 2000,
                uid: 'ftp-upload-test-1',
                statusDetails: {
                  message: 'File system error',
                  trace: 'java.io.IOException: Permission denied'
                },
                parameters: [
                  { name: 'file_size', value: '10MB' },
                  { name: 'file_type', value: 'pdf' }
                ]
              }
            ]
          });
          
        case 'categories.json':
          return JSON.stringify({
            uid: 'categories-root',
            name: 'Test Categories',
            children: [
              {
                name: 'Smoke Tests',
                uid: 'smoke-category',
                children: [
                  { name: 'Login Test Suite', uid: 'ftp-login-test-1' },
                  { name: 'API Authentication Test', uid: 'ftp-api-test-1' }
                ]
              },
              {
                name: 'Integration Tests',
                uid: 'integration-category',
                children: [
                  { name: 'Database Connection Test', uid: 'ftp-db-test-1' },
                  { name: 'File Upload Test', uid: 'ftp-upload-test-1' }
                ]
              }
            ]
          });
          
        case 'packages.json':
          return JSON.stringify({
            uid: 'packages-root',
            name: 'Test Packages',
            children: [
              {
                name: 'com.example.auth',
                uid: 'auth-package',
                children: [
                  { name: 'LoginTests', uid: 'login-tests' },
                  { name: 'ApiTests', uid: 'api-tests' }
                ]
              },
              {
                name: 'com.example.integration',
                uid: 'integration-package',
                children: [
                  { name: 'DatabaseTests', uid: 'db-tests' },
                  { name: 'FileTests', uid: 'file-tests' }
                ]
              }
            ]
          });
          
        case 'suites.json':
          return JSON.stringify({
            uid: 'suites-root',
            name: 'Test Suites',
            children: [
              {
                name: 'Regression Suite',
                uid: 'regression-suite',
                children: [
                  { name: 'Login Test Suite', uid: 'ftp-login-test-1' },
                  { name: 'API Authentication Test', uid: 'ftp-api-test-1' }
                ]
              },
              {
                name: 'Critical Path Suite',
                uid: 'critical-suite',
                children: [
                  { name: 'Database Connection Test', uid: 'ftp-db-test-1' },
                  { name: 'File Upload Test', uid: 'ftp-upload-test-1' }
                ]
              }
            ]
          });
          
        case 'timeline.json':
          return JSON.stringify({
            children: [
              {
                uid: 'ftp-login-test-1',
                name: 'Login Test Suite',
                time: { start: Date.now() - 300000, stop: Date.now() - 295000, duration: 5000 },
                status: 'passed',
                thread: 'TestThread-1',
                host: 'test-runner-01'
              },
              {
                uid: 'ftp-api-test-1',
                name: 'API Authentication Test',
                time: { start: Date.now() - 250000, stop: Date.now() - 247000, duration: 3000 },
                status: 'passed',
                thread: 'TestThread-2',
                host: 'test-runner-01'
              },
              {
                uid: 'ftp-db-test-1',
                name: 'Database Connection Test',
                time: { start: Date.now() - 200000, stop: Date.now() - 195000, duration: 5000 },
                status: 'failed',
                thread: 'TestThread-1',
                host: 'test-runner-02'
              },
              {
                uid: 'ftp-upload-test-1',
                name: 'File Upload Test',
                time: { start: Date.now() - 150000, stop: Date.now() - 148000, duration: 2000 },
                status: 'broken',
                thread: 'TestThread-3',
                host: 'test-runner-02'
              }
            ]
          });
          
        default:
          return JSON.stringify({ children: [] });
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      console.log('Disconnecting from FTP server');
      this.connected = false;
      this.config = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }  async downloadAllureFiles(config: FtpConfig): Promise<{
    behaviors: BehaviorsData[];
    categories: CategoriesData[];
    packages: PackagesData[];
    suites: SuitesData[];
    timeline: TimelineData[];
  }> {
    try {
      const cleanedHost = cleanHost(config.host);
      console.log('Downloading Allure files via backend from:', cleanedHost);
      
      const response = await fetch(`${BACKEND_URL}/api/ftp/allure-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: cleanedHost,
          port: config.port,
          user: config.user,
          password: config.password,
          remotePath: config.remotePath || '/',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        
        const processedResult = {
          behaviors: [] as BehaviorsData[],
          categories: [] as CategoriesData[],
          packages: [] as PackagesData[],
          suites: [] as SuitesData[],
          timeline: [] as TimelineData[]
        };

        // Process each file type
        if (data['behaviors.json']) {
          processedResult.behaviors.push(data['behaviors.json']);
        }
        if (data['categories.json']) {
          processedResult.categories.push(data['categories.json']);
        }
        if (data['packages.json']) {
          processedResult.packages.push(data['packages.json']);
        }
        if (data['suites.json']) {
          processedResult.suites.push(data['suites.json']);
        }
        if (data['timeline.json']) {
          processedResult.timeline.push(data['timeline.json']);
        }

        return processedResult;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download Allure files');
      }
    } catch (error) {
      console.error('Failed to download Allure files:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Backend server not running. Please start the backend service first.');
      }
      throw error;
    }
  }

  async exploreDirectory(path: string = '/', maxDepth: number = 2): Promise<DirectoryExploration> {
    if (!this.config) {
      throw new Error('Not connected to FTP server');
    }

    try {
      console.log('Exploring directory structure via backend:', path);
      
      const response = await fetch(`${BACKEND_URL}/api/ftp/explore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: this.config.host,
          port: this.config.port,
          user: this.config.user,
          password: this.config.password,
          remotePath: path,
          maxDepth: maxDepth,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.exploration;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to explore directory structure');
      }
    } catch (error) {
      console.error('Failed to explore directory structure:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Backend server not running. Please start the backend service first.');
      }
      throw error;
    }
  }
}

export const validateFtpConfig = (config: FtpConfig): string[] => {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === '') {
    errors.push('Host is required');
  }

  // Check if host contains protocol prefix
  if (config.host && config.host.includes('://')) {
    errors.push('Host should not include protocol (ftp://, http://, etc.). Use only the domain name.');
  }

  if (!config.user || config.user.trim() === '') {
    errors.push('Username is required');
  }

  if (!config.password || config.password.trim() === '') {
    errors.push('Password is required');
  }

  if (config.port <= 0 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  // Remote path is optional - can be selected through browsing
  // if (!config.remotePath || config.remotePath.trim() === '') {
  //   errors.push('Remote path is required');
  // }

  return errors;
};

// Export a singleton instance
export const ftpService = new FtpService();
