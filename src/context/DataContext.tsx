
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TestData, DataSource, TestBehavior } from '../types/behaviors';

interface DataContextType {
  testData: TestData | null;
  setTestData: (data: TestData | null) => void;
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  filteredTests: TestBehavior[];
  setFilteredTests: (tests: TestBehavior[]) => void;
  dateRange: { start: Date | null; end: Date | null };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const useTestData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useTestData must be used within a DataProvider');
  }
  return {
    testData: context.testData,
    loading: context.isLoading,
    setTestData: context.setTestData,
    dataSource: context.dataSource,
    setDataSource: context.setDataSource,
    setIsLoading: context.setIsLoading
  };
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>({ type: 'local' });
  const [filteredTests, setFilteredTests] = useState<TestBehavior[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  return (
    <DataContext.Provider
      value={{
        testData,
        setTestData,
        dataSource,
        setDataSource,
        filteredTests,
        setFilteredTests,
        dateRange,
        setDateRange,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
