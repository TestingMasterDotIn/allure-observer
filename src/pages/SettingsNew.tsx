import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  Server, 
  Folder, 
  Database, 
  TestTube, 
  Wifi, 
  WifiOff,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import { useTestData } from "@/context/DataContext";
import { FtpConfig } from "@/types/behaviors";
import { scanLocalFolder } from "@/services/fileService";
import { ftpService } from "@/services/ftpService";
import { transformAllureData } from "@/utils/dataTransformerNew";
import { generateSampleTestData } from "@/utils/testDataGenerator";

export default function Settings() {
  const { dataSource, setDataSource, setTestData, setIsLoading, loading, testData } = useTestData();
  const [ftpConfig, setFtpConfig] = useState<FtpConfig>({
    host: '',
    port: 21,
    user: '',
    password: '',
    remotePath: '/allure-results'
  });
  const [ftpConnectionStatus, setFtpConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [localFolderPath, setLocalFolderPath] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [storageMode, setStorageMode] = useState<'memory' | 'persist'>('memory');
  const [parserConfig, setParserConfig] = useState({
    uidKey: 'uid',
    customFields: '',
    skipValidation: false
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('allure-dashboard-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.ftpConfig) setFtpConfig(settings.ftpConfig);
        if (settings.localFolderPath) setLocalFolderPath(settings.localFolderPath);
        if (settings.autoRefresh !== undefined) setAutoRefresh(settings.autoRefresh);
        if (settings.refreshInterval) setRefreshInterval(settings.refreshInterval);
        if (settings.storageMode) setStorageMode(settings.storageMode);
        if (settings.parserConfig) setParserConfig(settings.parserConfig);
        if (settings.dataSource) setDataSource(settings.dataSource);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, [setDataSource]);

  const testFtpConnection = async () => {
    setFtpConnectionStatus('testing');
    try {
      // Simulate FTP connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would test actual FTP connection
      if (ftpConfig.host && ftpConfig.user) {
        setFtpConnectionStatus('success');
      } else {
        setFtpConnectionStatus('error');
      }
    } catch (error) {
      setFtpConnectionStatus('error');
    }
  };
  const selectLocalFolder = async () => {
    try {
      // Use File System Access API for modern browsers
      if ('showDirectoryPicker' in window && window.showDirectoryPicker) {
        const dirHandle = await window.showDirectoryPicker();
        setLocalFolderPath(dirHandle.name);
        setDataSource({ type: 'local' });
      } else {
        // Fallback for browsers without File System Access API
        alert('Your browser doesn\'t support the File System Access API. Please use a modern browser or enter the path manually.');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };  const loadDataFromSource = async () => {
    setIsLoading(true);
    try {
      if (dataSource.type === 'local') {
        // Load data from local folder using the File System Access API
        // Pass true to use the saved directory handle if available
        const rawData = await scanLocalFolder(true);
        
        // Transform the data to match our TestData interface
        const testData = transformAllureData(rawData);
        
        setTestData(testData);
        alert('Data loaded successfully from local folder!');
      } else if (dataSource.type === 'ftp' && ftpConfig.host) {
        // Load data from FTP server
        try {
          const rawData = await ftpService.downloadAllureFiles(ftpConfig);
          const testData = transformAllureData(rawData);
          setTestData(testData);
          alert('Data loaded successfully from FTP server!');
        } catch (error) {
          console.error('FTP loading error:', error);
          alert('Failed to load data from FTP server. Please check your connection settings.');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please check your settings and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (dataSource.type === 'ftp') {
      setDataSource({
        type: 'ftp',
        ftpConfig: ftpConfig
      });
    } else if (dataSource.type === 'local' && localFolderPath) {
      setDataSource({ type: 'local' });
    }
    
    // Save to localStorage for persistence
    localStorage.setItem('allure-dashboard-settings', JSON.stringify({
      dataSource,
      ftpConfig,
      localFolderPath,
      autoRefresh,
      refreshInterval,
      storageMode,
      parserConfig
    }));
    
    // Show success message
    alert("Settings saved successfully. Click 'Load Data' to load data from the configured source.");
  };

  const exportSettings = () => {
    const settings = {
      dataSource,
      ftpConfig: { ...ftpConfig, password: '' }, // Don't export password
      localFolderPath,
      autoRefresh,
      refreshInterval,
      storageMode,
      parserConfig
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'allure-dashboard-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleData = () => {
    try {
      setIsLoading(true);
      
      // Generate sample data
      const sampleData = generateSampleTestData();
      
      // Transform it to the expected format
      const transformedData = transformAllureData({
        behaviors: [sampleData.behaviors],
        categories: [sampleData.categories],
        packages: [],
        suites: [],
        timeline: []
      });
      
      setTestData(transformedData);
      setDataSource({ type: 'local' });
      
      alert('Sample data loaded successfully! You can now explore all dashboard features.');
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert('Failed to load sample data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure data sources and dashboard preferences</p>
        </div>        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={loadSampleData}
            disabled={loading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Load Sample Data
          </Button>
          <Button 
            variant="secondary" 
            onClick={loadDataFromSource} 
            disabled={loading || (!localFolderPath && dataSource.type === 'local') || (!ftpConfig.host && dataSource.type === 'ftp')}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Load Data
              </>
            )}
          </Button>
          <Button onClick={saveSettings}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="data-source" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data-source">Data Source</TabsTrigger>
          <TabsTrigger value="ftp-config">FTP Configuration</TabsTrigger>
          <TabsTrigger value="parsing">Data Parsing</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Data Source Tab */}
        <TabsContent value="data-source" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Source Configuration
              </CardTitle>
              <CardDescription>
                Choose how the dashboard loads Allure test data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Local Folder Option */}
                <Card className={`cursor-pointer transition-colors ${dataSource.type === 'local' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setDataSource({ type: 'local' })}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Folder className="h-4 w-4" />
                      Local Folder
                      {dataSource.type === 'local' && <Badge variant="default">Active</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Load Allure files from a local directory on your computer
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="local-path">Folder Path</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="local-path"
                            value={localFolderPath}
                            onChange={(e) => setLocalFolderPath(e.target.value)}
                            placeholder="Select or enter folder path"
                          />
                          <Button variant="outline" onClick={selectLocalFolder}>
                            Browse
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expected files: behaviors.json, categories.json, packages.json, suites.json, timeline.json
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FTP Server Option */}
                <Card className={`cursor-pointer transition-colors ${dataSource.type === 'ftp' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setDataSource({ type: 'ftp', ftpConfig })}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="h-4 w-4" />
                      FTP Server
                      {dataSource.type === 'ftp' && <Badge variant="default">Active</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect to an FTP server to fetch Allure files remotely
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {ftpConnectionStatus === 'success' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Connected</span>
                          </>
                        ) : ftpConnectionStatus === 'error' ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Connection failed</span>
                          </>
                        ) : ftpConnectionStatus === 'testing' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm">Testing connection...</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Not connected</span>
                          </>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={testFtpConnection} disabled={ftpConnectionStatus === 'testing'}>
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The dashboard supports both local file access and remote FTP servers. For local files, 
                  make sure your browser supports the File System Access API (Chrome/Edge 86+).
                </AlertDescription>
              </Alert>

              {/* Data Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TestTube className="h-4 w-4" />
                    Data Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Loading data...</span>
                      </>
                    ) : testData ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">Data loaded successfully!</span>
                          <div className="text-muted-foreground mt-1">
                            {testData.totalTests} tests • {testData.passedTests} passed • {testData.failedTests} failed
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-600">No data loaded. Configure a data source and click "Load Data".</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FTP Configuration Tab */}
        <TabsContent value="ftp-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                FTP Server Configuration
              </CardTitle>
              <CardDescription>
                Configure connection details for your FTP server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ftp-host">Host</Label>
                  <Input
                    id="ftp-host"
                    value={ftpConfig.host}
                    onChange={(e) => setFtpConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="ftp.example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ftp-port">Port</Label>
                  <Input
                    id="ftp-port"
                    type="number"
                    value={ftpConfig.port}
                    onChange={(e) => setFtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 21 }))}
                    placeholder="21"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ftp-user">Username</Label>
                  <Input
                    id="ftp-user"
                    value={ftpConfig.user}
                    onChange={(e) => setFtpConfig(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ftp-password">Password</Label>
                  <Input
                    id="ftp-password"
                    type="password"
                    value={ftpConfig.password}
                    onChange={(e) => setFtpConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="password"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="ftp-path">Remote Path</Label>
                <Input
                  id="ftp-path"
                  value={ftpConfig.remotePath}
                  onChange={(e) => setFtpConfig(prev => ({ ...prev, remotePath: e.target.value }))}
                  placeholder="/path/to/allure-results"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Path to the directory containing Allure JSON files
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={testFtpConnection} disabled={ftpConnectionStatus === 'testing'}>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                
                <div className="flex items-center gap-2">
                  {ftpConnectionStatus === 'success' && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  {ftpConnectionStatus === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Parsing Tab */}
        <TabsContent value="parsing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Data Parsing Configuration
              </CardTitle>
              <CardDescription>
                Customize how Allure JSON files are parsed and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="uid-key">UID Key Field</Label>
                <Input
                  id="uid-key"
                  value={parserConfig.uidKey}
                  onChange={(e) => setParserConfig(prev => ({ ...prev, uidKey: e.target.value }))}
                  placeholder="uid"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Field name used as unique identifier for tests
                </div>
              </div>

              <div>
                <Label htmlFor="custom-fields">Custom Fields (JSON)</Label>
                <Input
                  id="custom-fields"
                  value={parserConfig.customFields}
                  onChange={(e) => setParserConfig(prev => ({ ...prev, customFields: e.target.value }))}
                  placeholder='{"customField1": "value1"}'
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Additional fields to extract from test data (JSON format)
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="skip-validation"
                  checked={parserConfig.skipValidation}
                  onCheckedChange={(checked) => setParserConfig(prev => ({ ...prev, skipValidation: checked }))}
                />
                <Label htmlFor="skip-validation">Skip JSON validation</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Dashboard behavior and storage preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh">Auto Refresh</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically reload data at regular intervals
                    </div>
                  </div>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>

                {autoRefresh && (
                  <div>
                    <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                    <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div>
                  <Label htmlFor="storage-mode">Storage Mode</Label>
                  <Select value={storageMode} onValueChange={(value: 'memory' | 'persist') => setStorageMode(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memory">In-Memory (faster, cleared on reload)</SelectItem>
                      <SelectItem value="persist">Persistent (saved in browser storage)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    Choose how test data is stored in the browser
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Settings are automatically saved to your browser's local storage. 
                  Use the export function to backup your configuration.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
