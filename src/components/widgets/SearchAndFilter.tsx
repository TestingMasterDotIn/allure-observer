import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X, Clock, Package, Users } from 'lucide-react';
import { TestBehavior } from '../../types/behaviors';

interface SearchAndFilterProps {
  tests: TestBehavior[];
  onFilteredTestsChange: (tests: TestBehavior[]) => void;
}

interface FilterState {
  searchTerm: string;
  statuses: string[];
  packages: string[];
  suites: string[];
  threads: string[];
  durationRange: {
    min: number;
    max: number;
  };
  hasRetries: boolean | null;
  isFlaky: boolean | null;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ 
  tests, 
  onFilteredTestsChange 
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statuses: [],
    packages: [],
    suites: [],
    threads: [],
    durationRange: { min: 0, max: 0 },
    hasRetries: null,
    isFlaky: null,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const packages = [...new Set(tests.map(t => t.packageName).filter(Boolean))];
    const suites = [...new Set(tests.map(t => t.suiteName).filter(Boolean))];
    const threads = [...new Set(tests.map(t => t.threadId).filter(Boolean))];
    const durations = tests.map(t => t.duration || 0).filter(d => d > 0);
    const maxDuration = Math.max(...durations, 0);

    return {
      packages: packages.sort(),
      suites: suites.sort(),
      threads: threads.sort(),
      maxDuration,
    };
  }, [tests]);

  // Apply filters
  const filteredTests = useMemo(() => {
    let filtered = [...tests];

    // Search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        (test.name || '').toLowerCase().includes(term) ||
        (test.fullName || '').toLowerCase().includes(term) ||
        (test.packageName || '').toLowerCase().includes(term) ||
        (test.suiteName || '').toLowerCase().includes(term) ||
        (test.statusDetails?.message || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(test => filters.statuses.includes(test.status || ''));
    }

    // Package filter
    if (filters.packages.length > 0) {
      filtered = filtered.filter(test => 
        test.packageName && filters.packages.includes(test.packageName)
      );
    }

    // Suite filter
    if (filters.suites.length > 0) {
      filtered = filtered.filter(test => 
        test.suiteName && filters.suites.includes(test.suiteName)
      );
    }

    // Thread filter
    if (filters.threads.length > 0) {
      filtered = filtered.filter(test => 
        test.threadId && filters.threads.includes(test.threadId)
      );
    }

    // Duration range filter
    if (filters.durationRange.max > 0) {
      filtered = filtered.filter(test => {
        const duration = test.duration || 0;
        return duration >= filters.durationRange.min && duration <= filters.durationRange.max;
      });
    }

    // Retry filter
    if (filters.hasRetries !== null) {
      filtered = filtered.filter(test => {
        const hasRetries = (test.retryCount || 0) > 0;
        return hasRetries === filters.hasRetries;
      });
    }

    // Flaky filter
    if (filters.isFlaky !== null) {
      filtered = filtered.filter(test => (test.flaky || false) === filters.isFlaky);
    }

    return filtered;
  }, [tests, filters]);

  // Update parent component when filtered tests change
  React.useEffect(() => {
    onFilteredTestsChange(filteredTests);
  }, [filteredTests, onFilteredTestsChange]);
  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'statuses' | 'packages' | 'suites' | 'threads', value: string) => {
    setFilters(prev => {
      const currentArray = prev[key];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      statuses: [],
      packages: [],
      suites: [],
      threads: [],
      durationRange: { min: 0, max: 0 },
      hasRetries: null,
      isFlaky: null,
    });
  };

  const activeFilterCount = [
    filters.searchTerm ? 1 : 0,
    filters.statuses.length,
    filters.packages.length,
    filters.suites.length,
    filters.threads.length,
    filters.durationRange.max > 0 ? 1 : 0,
    filters.hasRetries !== null ? 1 : 0,
    filters.isFlaky !== null ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests by name, package, suite, or error message..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredTests.length} of {tests.length} tests
          </span>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['passed', 'failed', 'broken', 'skipped'].map(status => (
                  <Badge
                    key={status}
                    variant={filters.statuses.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('statuses', status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Package Filter */}
            {filterOptions.packages.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Packages
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {filterOptions.packages.map(pkg => (
                    <Badge
                      key={pkg}
                      variant={filters.packages.includes(pkg) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('packages', pkg)}
                    >
                      {pkg}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suite Filter */}
            {filterOptions.suites.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Suites</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {filterOptions.suites.map(suite => (
                    <Badge
                      key={suite}
                      variant={filters.suites.includes(suite) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('suites', suite)}
                    >
                      {suite}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Thread Filter */}
            {filterOptions.threads.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Threads
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.threads.map(thread => (
                    <Badge
                      key={thread}
                      variant={filters.threads.includes(thread) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter('threads', thread)}
                    >
                      Thread {thread}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Duration Range Filter */}
            {filterOptions.maxDuration > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration Range (seconds)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.durationRange.min || ''}
                    onChange={(e) => updateFilter('durationRange', {
                      ...filters.durationRange,
                      min: Number(e.target.value) * 1000 // Convert to milliseconds
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.durationRange.max ? filters.durationRange.max / 1000 : ''}
                    onChange={(e) => updateFilter('durationRange', {
                      ...filters.durationRange,
                      max: Number(e.target.value) * 1000 // Convert to milliseconds
                    })}
                  />
                </div>
              </div>
            )}

            {/* Special Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Special Filters</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-retries"
                    checked={filters.hasRetries === true}
                    onCheckedChange={(checked) => 
                      updateFilter('hasRetries', checked ? true : null)
                    }
                  />
                  <label htmlFor="has-retries" className="text-sm">
                    Tests with retries
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-flaky"
                    checked={filters.isFlaky === true}
                    onCheckedChange={(checked) => 
                      updateFilter('isFlaky', checked ? true : null)
                    }
                  />
                  <label htmlFor="is-flaky" className="text-sm">
                    Flaky tests
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchAndFilter;
