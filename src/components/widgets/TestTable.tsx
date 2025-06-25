
import React, { useState, useMemo } from 'react';
import { TestBehavior, CategoriesData } from '../../types/behaviors';
import { formatDuration, getStatusColor } from '../../utils/parseBehaviors';
import { ChevronDown, ChevronUp, Search, AlertTriangle } from 'lucide-react';
import ErrorDetailsModal from './ErrorDetailsModal';

interface TestTableProps {
  tests: TestBehavior[];
  categories?: CategoriesData;
}

type SortField = 'name' | 'status' | 'duration' | 'start';
type SortDirection = 'asc' | 'desc';

const TestTable: React.FC<TestTableProps> = ({ tests, categories }) => {
  const [sortField, setSortField] = useState<SortField>('start');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<TestBehavior | null>(null);

  const filteredAndSortedTests = useMemo(() => {
    let filtered = tests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.parameters?.some(param =>
          param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          param.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter);
    }    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'start':
          aValue = a.time?.start || 0;
          bValue = b.time?.start || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tests, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTestClick = (test: TestBehavior) => {
    if (test.status === 'failed' || test.status === 'broken') {
      setSelectedTest(test);
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-0" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search tests or parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="broken">Broken</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Test Name</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('duration')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Duration</span>
                    <SortIcon field="duration" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('start')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Execution Time</span>
                    <SortIcon field="start" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameters
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedTests.map((test, index) => (                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 ${
                    (test.status === 'failed' || test.status === 'broken') 
                      ? 'cursor-pointer hover:bg-red-50' 
                      : ''
                  }`}
                  onClick={() => handleTestClick(test)}
                  title={
                    (test.status === 'failed' || test.status === 'broken') 
                      ? 'Click to view error details' 
                      : undefined
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={test.name}>
                        {test.name}
                      </div>
                      {(test.status === 'failed' || test.status === 'broken') && (
                        <AlertTriangle className="h-4 w-4 text-red-500 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(test.duration || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {test.time?.start ? new Date(test.time.start).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {test.parameters && test.parameters.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {test.parameters.slice(0, 3).map((param, paramIndex) => (
                          <span
                            key={paramIndex}
                            className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            title={`${param.name}: ${param.value}`}
                          >
                            {param.name}: {param.value}
                          </span>
                        ))}
                        {test.parameters.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{test.parameters.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No parameters</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedTests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tests found matching your criteria.
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      {selectedTest && (
        <ErrorDetailsModal
          test={selectedTest}
          categories={categories}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </div>
  );
};

export default TestTable;
