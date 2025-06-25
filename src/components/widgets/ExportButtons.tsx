import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileImage } from 'lucide-react';
import { TestData, TestBehavior } from '../../types/behaviors';

interface ExportButtonsProps {
  testData: TestData;
  filteredTests: TestBehavior[];
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ testData, filteredTests }) => {
  const exportToCSV = () => {
    const headers = [
      'Name',
      'Status',
      'Duration (ms)',
      'Start Time',
      'Package',
      'Suite',
      'Thread',
      'Retry Count',
      'Error Message'
    ];

    const csvData = filteredTests.map(test => [
      test.name || test.fullName || '',
      test.status || '',
      test.duration || 0,
      test.time?.start ? new Date(test.time.start).toISOString() : '',
      test.packageName || '',
      test.suiteName || '',
      test.threadId || '',
      test.retryCount || 0,
      test.statusDetails?.message || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `test-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalTests: testData.totalTests,
        filteredTests: filteredTests.length,
        dateRange: testData.dateRange,
      },
      summary: {
        passed: testData.passedTests,
        failed: testData.failedTests,
        broken: testData.brokenTests,
        skipped: testData.skippedTests,
        duration: testData.totalDuration,
      },
      analytics: {
        flakiness: testData.flakiness,
        retryAnalysis: testData.retryAnalysis,
        failureClusters: testData.failureClusters,
        performanceMetrics: testData.performanceMetrics,
      },
      tests: filteredTests,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `test-results-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    // Create a comprehensive HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Results Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .summary-card h3 { margin: 0 0 10px 0; color: #333; }
          .summary-card .value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .passed { color: #22c55e; }
          .failed { color: #ef4444; }
          .broken { color: #f97316; }
          .skipped { color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-badge { padding: 2px 8px; border-radius: 3px; color: white; font-size: 12px; }
          .status-passed { background-color: #22c55e; }
          .status-failed { background-color: #ef4444; }
          .status-broken { background-color: #f97316; }
          .status-skipped { background-color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Test Results Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Tests: ${filteredTests.length} (${testData.totalTests} total)</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Passed Tests</h3>
            <div class="value passed">${testData.passedTests}</div>
            <div>${Math.round((testData.passedTests / testData.totalTests) * 100)}%</div>
          </div>
          <div class="summary-card">
            <h3>Failed Tests</h3>
            <div class="value failed">${testData.failedTests}</div>
            <div>${Math.round((testData.failedTests / testData.totalTests) * 100)}%</div>
          </div>
          <div class="summary-card">
            <h3>Broken Tests</h3>
            <div class="value broken">${testData.brokenTests}</div>
            <div>${Math.round((testData.brokenTests / testData.totalTests) * 100)}%</div>
          </div>
          <div class="summary-card">
            <h3>Total Duration</h3>
            <div class="value">${Math.round(testData.totalDuration / 1000 / 60)}m</div>
            <div>Average: ${Math.round(testData.totalDuration / testData.totalTests / 1000)}s</div>
          </div>
        </div>

        ${testData.flakiness && testData.flakiness.flakyTests.length > 0 ? `
        <h2>Flaky Tests (${testData.flakiness.flakyTests.length})</h2>
        <table>
          <tr>
            <th>Test Name</th>
            <th>Pass Count</th>
            <th>Fail Count</th>
            <th>Flakiness Score</th>
          </tr>
          ${testData.flakiness.flakyTests.slice(0, 10).map(test => `
            <tr>
              <td>${test.testName}</td>
              <td>${test.passCount}</td>
              <td>${test.failCount}</td>
              <td>${(test.flakinessScore * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </table>
        ` : ''}

        <h2>Test Results</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Package</th>
            <th>Suite</th>
          </tr>
          ${filteredTests.slice(0, 100).map(test => `
            <tr>
              <td>${test.name || test.fullName || 'Unknown'}</td>
              <td><span class="status-badge status-${test.status}">${test.status}</span></td>
              <td>${test.duration ? Math.round(test.duration / 1000) + 's' : 'N/A'}</td>
              <td>${test.packageName || 'N/A'}</td>
              <td>${test.suiteName || 'N/A'}</td>
            </tr>
          `).join('')}
          ${filteredTests.length > 100 ? `
            <tr>
              <td colspan="5" style="text-align: center; font-style: italic;">
                ... and ${filteredTests.length - 100} more tests
              </td>
            </tr>
          ` : ''}
        </table>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileImage className="mr-2 h-4 w-4" />
          Export as PDF Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
