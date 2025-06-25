import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { validateFtpConfig, ftpService } from '../services/ftpService';
import { FtpConfig } from '../types/behaviors';
import { Save, TestTube, Wifi, HardDrive, AlertCircle, CheckCircle, Folder, ChevronRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Settings: React.FC = () => {
  const { dataSource, setDataSource } = useData();
    const [localConfig, setLocalConfig] = useState({
    type: dataSource.type,
    ftpConfig: dataSource.ftpConfig || {
      host: '',
      port: 21,
      user: '',
      password: '',
      remotePath: '',
    }
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConnectedForBrowsing, setIsConnectedForBrowsing] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [directories, setDirectories] = useState<string[]>([]);
  const [loadingDirectories, setLoadingDirectories] = useState(false);
  const handleFtpConfigChange = (field: keyof FtpConfig, value: string | number) => {
    setLocalConfig(prev => ({
      ...prev,
      ftpConfig: {
        ...prev.ftpConfig,
        [field]: value,
      }
    }));
    
    // Reset browsing state when configuration changes
    setIsConnectedForBrowsing(false);
    setShowFolderBrowser(false);
  };

  const handleSave = () => {
    setErrors([]);
    setSaveSuccess(false);

    if (localConfig.type === 'ftp') {
      const validationErrors = validateFtpConfig(localConfig.ftpConfig);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setDataSource({
      type: localConfig.type as 'local' | 'ftp',
      ftpConfig: localConfig.type === 'ftp' ? localConfig.ftpConfig : undefined,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };  const handleTestConnection = async () => {
    if (localConfig.type === 'ftp') {
      setErrors([]);
      const validationErrors = validateFtpConfig(localConfig.ftpConfig);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }      try {
        console.log('Testing FTP connection...');
        const connected = await ftpService.connect(localConfig.ftpConfig);
        console.log('Connection result:', connected);
        if (connected) {
          setIsConnectedForBrowsing(true);
          console.log('Setting isConnectedForBrowsing to true');
          alert('FTP connection test successful! (Mock implementation - your credentials are valid)\n\nYou can now browse folders to select the remote path.');
          await ftpService.disconnect();
        } else {
          setErrors(['FTP connection test failed']);
          setIsConnectedForBrowsing(false);
        }
      } catch (error) {
        console.log('Connection error:', error);
        setErrors([error instanceof Error ? error.message : 'Connection test failed']);
        setIsConnectedForBrowsing(false);
      }
    }
  };

  const loadDirectories = async (path: string) => {
    if (!isConnectedForBrowsing) return;
    
    setLoadingDirectories(true);
    try {
      const dirs = await ftpService.listDirectories(path);
      setDirectories(dirs);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load directories:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to load directories']);
    } finally {
      setLoadingDirectories(false);
    }
  };

  const navigateToDirectory = async (dirName: string) => {
    const newPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
    await loadDirectories(newPath);
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    loadDirectories(parentPath);
  };

  const selectCurrentPath = () => {
    handleFtpConfigChange('remotePath', currentPath);
    setShowFolderBrowser(false);
  };
  const startFolderBrowsing = async () => {
    setShowFolderBrowser(true);
    const startPath = localConfig.ftpConfig.remotePath || '/';
    setCurrentPath(startPath);
    await loadDirectories(startPath);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your data sources and application preferences
        </p>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Source Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
          <CardDescription>
            Choose how you want to load test data into the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={localConfig.type} 
            onValueChange={(value) => setLocalConfig(prev => ({ ...prev, type: value as 'local' | 'ftp' }))}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="flex items-center space-x-2 cursor-pointer">
                <HardDrive className="h-4 w-4" />
                <span>Local Filesystem</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ftp" id="ftp" />
              <Label htmlFor="ftp" className="flex items-center space-x-2 cursor-pointer">
                <Wifi className="h-4 w-4" />
                <span>FTP Server</span>
              </Label>
            </div>
          </RadioGroup>

          {localConfig.type === 'local' && (
            <Alert>
              <HardDrive className="h-4 w-4" />
              <AlertDescription>
                When using local filesystem, click "Open Folder" on the dashboard to select a directory. 
                The system will recursively scan for <code className="bg-gray-100 px-1 rounded">Data/behaviors.json</code> files.
                <br /><br />
                <strong>Note:</strong> This feature requires a modern browser with File System Access API support (Chrome, Edge, etc.).
              </AlertDescription>
            </Alert>
          )}

          {localConfig.type === 'ftp' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900">FTP Server Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    type="text"
                    placeholder="ftp.example.com"
                    value={localConfig.ftpConfig.host}
                    onChange={(e) => handleFtpConfigChange('host', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="21"
                    value={localConfig.ftpConfig.port}
                    onChange={(e) => handleFtpConfigChange('port', parseInt(e.target.value) || 21)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user">Username</Label>
                  <Input
                    id="user"
                    type="text"
                    placeholder="username"
                    value={localConfig.ftpConfig.user}
                    onChange={(e) => handleFtpConfigChange('user', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={localConfig.ftpConfig.password}
                    onChange={(e) => handleFtpConfigChange('password', e.target.value)}
                  />
                </div>
              </div>              <Button 
                onClick={handleTestConnection} 
                variant="outline"
                className="w-full md:w-auto"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Connection
              </Button>

              {/* Browse Path Button - Only shown after successful connection */}
              {isConnectedForBrowsing && (
                <div className="space-y-2">
                  <Button 
                    onClick={startFolderBrowsing}
                    variant="outline"
                    className="w-full md:w-auto bg-green-50 border-green-200 hover:bg-green-100"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Browse Path
                  </Button>
                  <div className="text-sm text-gray-600">
                    <span className="text-green-600 font-medium">✓ Connection successful!</span>
                    {localConfig.ftpConfig.remotePath && (
                      <div className="mt-1">
                        Selected path: <code className="bg-gray-100 px-1 rounded">{localConfig.ftpConfig.remotePath}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Real FTP Implementation:</strong> This connects to actual FTP servers via a backend service. 
                  <br /><br />
                  <strong>Setup Required:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Start the backend: <code>cd backend/nodejs && npm install && npm start</code></li>
                    <li>Or Python: <code>cd backend/python && pip install -r requirements.txt && python app.py</code></li>
                    <li>Enter your real FTP credentials below</li>
                    <li>Test connection to verify setup</li>
                  </ol>
                  <br />
                  See <code>backend/README.md</code> for detailed setup instructions.
                </AlertDescription>
              </Alert>

              {/* Folder Browser */}
              {showFolderBrowser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Browse FTP Folders</h3>
                      <Button 
                        onClick={() => setShowFolderBrowser(false)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span>Current path: <code className="bg-gray-100 px-1 rounded">{currentPath}</code></span>
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        {currentPath !== '/' && (
                          <Button 
                            onClick={navigateUp}
                            variant="outline"
                            size="sm"
                          >
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Up
                          </Button>
                        )}
                        <Button 
                          onClick={selectCurrentPath}
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Select This Path
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {loadingDirectories ? (
                        <div className="p-4 text-center text-gray-500">
                          Loading directories...
                        </div>
                      ) : directories.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No subdirectories found
                        </div>
                      ) : (
                        <div className="divide-y">
                          {directories.map((dir, index) => (
                            <button
                              key={index}
                              onClick={() => navigateToDirectory(dir)}
                              className="w-full p-3 text-left hover:bg-gray-50 flex items-center"
                            >
                              <Folder className="h-4 w-4 text-blue-500 mr-2" />
                              <span>{dir}</span>
                              <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Test Observatory</CardTitle>
          <CardDescription>
            Information about this dashboard application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Recursive scanning for behaviors.json files</li>
                <li>• Interactive charts and visualizations</li>
                <li>• Date range filtering</li>
                <li>• Test result analysis</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supported Formats</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Allure behaviors.json files</li>
                <li>• Local filesystem access</li>
                <li>• FTP server connectivity</li>
                <li>• Time-based filtering</li>
                <li>• Parameter-based searches</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Built with React, TypeScript, Tailwind CSS, and Chart.js for comprehensive test observability.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
