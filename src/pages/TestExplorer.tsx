
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, Eye, ChevronDown, Clock, RotateCcw, AlertCircle, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { useTestData } from "@/context/DataContext";
import { TestBehavior } from "@/types/behaviors";
import ExportButtons from "@/components/widgets/ExportButtons";

const statusIcons = {
  passed: <CheckCircle className="h-4 w-4 text-green-600" />,
  failed: <XCircle className="h-4 w-4 text-red-600" />,
  broken: <AlertCircle className="h-4 w-4 text-orange-600" />,
  skipped: <MinusCircle className="h-4 w-4 text-gray-600" />
};

const statusColors = {
  passed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  broken: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  skipped: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function TestExplorer() {
  const { testData, loading } = useTestData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedTest, setSelectedTest] = useState<TestBehavior | null>(null);

  const filteredAndSortedTests = useMemo(() => {
    if (!testData?.tests) return [];

    let filtered = [...testData.tests];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        (test.name || '').toLowerCase().includes(searchLower) ||
        (test.fullName || '').toLowerCase().includes(searchLower) ||
        (test.suiteName || '').toLowerCase().includes(searchLower) ||
        (test.packageName || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        case "status":
          return (a.status || '').localeCompare(b.status || '');
        case "duration":
          return (b.duration || 0) - (a.duration || 0);
        case "retries":
          return (b.retryCount || 0) - (a.retryCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [testData?.tests, searchTerm, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDuration = (duration: number) => {
    return `${Math.round(duration / 1000)}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Explorer</h1>
          <p className="text-muted-foreground">Browse and analyze individual test cases</p>
        </div>
        
        <div className="flex items-center gap-2">
          {testData && (
            <ExportButtons 
              testData={testData} 
              filteredTests={filteredAndSortedTests}
            />
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="broken">Broken</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="retries">Retries</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredAndSortedTests.length} of {testData?.totalTests || 0} tests
          </div>
        </CardContent>
      </Card>

      {/* Test Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
          <CardDescription>Detailed view of all test executions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Suite</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTests.map((test, index) => (
                  <TableRow key={test.uid || index}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{test.name}</div>
                        {test.fullName && test.fullName !== test.name && (
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {test.fullName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[test.status]} variant="secondary">
                        <div className="flex items-center gap-1">
                          {statusIcons[test.status]}
                          {test.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(test.duration || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {test.retryCount && test.retryCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          {test.retryCount}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {test.suiteName || test.packageName || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTest(test)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedTest?.name}</DialogTitle>
                            <DialogDescription>Test execution details</DialogDescription>
                          </DialogHeader>
                          
                          {selectedTest && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <div className="mt-1">
                                    <Badge className={statusColors[selectedTest.status]} variant="secondary">
                                      <div className="flex items-center gap-1">
                                        {statusIcons[selectedTest.status]}
                                        {selectedTest.status}
                                      </div>
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Duration</label>
                                  <div className="mt-1 text-sm">{formatDuration(selectedTest.duration || 0)}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">UID</label>
                                  <div className="mt-1 text-sm font-mono">{selectedTest.uid || "N/A"}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Thread</label>
                                  <div className="mt-1 text-sm">{selectedTest.threadId || "N/A"}</div>
                                </div>
                              </div>

                              {/* Full Name */}
                              {selectedTest.fullName && (
                                <div>
                                  <label className="text-sm font-medium">Full Name</label>
                                  <div className="mt-1 text-sm font-mono bg-muted p-2 rounded">
                                    {selectedTest.fullName}
                                  </div>
                                </div>
                              )}

                              {/* Parameters */}
                              {selectedTest.parameters && selectedTest.parameters.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium">Parameters</label>
                                  <div className="mt-1 space-y-1">
                                    {selectedTest.parameters.map((param, idx) => (
                                      <div key={idx} className="text-sm bg-muted p-2 rounded">
                                        <span className="font-medium">{param.name}:</span> {param.value}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Error Details */}
                              {selectedTest.statusDetails && (
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                      <ChevronDown className="h-4 w-4 mr-2" />
                                      Error Details
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    {selectedTest.statusDetails.message && (
                                      <div className="mb-4">
                                        <label className="text-sm font-medium">Message</label>
                                        <div className="mt-1 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border">
                                          {selectedTest.statusDetails.message}
                                        </div>
                                      </div>
                                    )}
                                    {selectedTest.statusDetails.trace && (
                                      <div>
                                        <label className="text-sm font-medium">Stack Trace</label>
                                        <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-x-auto">
                                          {selectedTest.statusDetails.trace}
                                        </pre>
                                      </div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}

                              {/* Tags */}
                              {selectedTest.tags && selectedTest.tags.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium">Tags</label>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {selectedTest.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
