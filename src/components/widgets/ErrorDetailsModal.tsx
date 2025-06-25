
import React from 'react';
import { TestBehavior, CategoriesData } from '../../types/behaviors';
import { getErrorInfoFromCategories, extractErrorInfo } from '../../utils/parseBehaviors';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDetailsModalProps {
  test: TestBehavior;
  categories?: CategoriesData;
  onClose: () => void;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ test, categories, onClose }) => {
  const errorInfo = getErrorInfoFromCategories(test, categories);
  const rawErrorInfo = extractErrorInfo(test);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Test Error Details
            </CardTitle>
            <CardDescription>
              {test.name}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Test Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  test.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {test.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Duration:</span>
                <span className="ml-2">{Math.round((test.duration || 0) / 1000)}s</span>
              </div>
              <div>
                <span className="font-medium">Start Time:</span>
                <span className="ml-2">{test.time?.start ? new Date(test.time.start).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">UID:</span>
                <span className="ml-2 font-mono text-xs">{test.uid || 'N/A'}</span>
              </div>
            </div>
          </div>

          {test.parameters && test.parameters.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Parameters</h4>
              <div className="flex flex-wrap gap-2">
                {test.parameters.map((param, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {param.name}: {param.value}
                  </span>
                ))}
              </div>
            </div>
          )}          {errorInfo && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Error Category</h4>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{errorInfo}</p>
              </div>
            </div>
          )}

          {rawErrorInfo && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Error Details</h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{rawErrorInfo}</p>
              </div>
            </div>
          )}

          {test.statusDetails?.message && test.statusDetails.message !== rawErrorInfo && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Status Message</h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{test.statusDetails.message}</p>
              </div>
            </div>
          )}

          {test.statusDetails?.trace && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Stack Trace</h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">{test.statusDetails.trace}</pre>
              </div>
            </div>
          )}          {!errorInfo && !rawErrorInfo && !test.statusDetails?.message && !test.statusDetails?.trace && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                No detailed error information available for this test.
              </p>
              {test.status === 'failed' && (
                <p className="text-yellow-700 text-xs mt-2">
                  This test failed but no error message or stack trace was captured.
                </p>
              )}
              {test.status === 'broken' && (
                <p className="text-yellow-700 text-xs mt-2">
                  This test is broken, likely due to a setup or configuration issue.
                </p>
              )}
            </div>
          )}{/* Additional Debug Information */}
          {(test.flaky || test.retryCount) && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Test Reliability</h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {test.flaky && (
                  <p className="text-blue-800 text-sm mb-1">
                    ⚠️ This test has been marked as flaky
                  </p>
                )}
                {test.retryCount && test.retryCount > 0 && (
                  <p className="text-blue-800 text-sm">
                    🔄 Retry count: {test.retryCount}
                  </p>
                )}
              </div>
            </div>
          )}          {/* Debug: Show raw error data if available */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Debug: Raw Test Data
            </summary>
            <div className="mt-2 p-3 bg-gray-100 border rounded-lg">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-40">
                {JSON.stringify({
                  uid: test.uid,
                  name: test.name,
                  status: test.status,
                  statusDetails: test.statusDetails,
                  hasCategories: !!categories,
                  categoriesCount: categories?.children?.length || 0,
                  // Show all properties that might contain error info
                  allProperties: Object.keys(test).filter(key => 
                    key.includes('error') || 
                    key.includes('message') || 
                    key.includes('trace') ||
                    key.includes('failure') ||
                    key.includes('exception')
                  ),
                  // Show full test object structure
                  testKeys: Object.keys(test)
                }, null, 2)}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDetailsModal;
