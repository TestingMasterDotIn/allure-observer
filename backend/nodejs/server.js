const express = require('express');
const ftp = require('basic-ftp');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// FTP Connection Test
app.post('/api/ftp/connect', async (req, res) => {
  const { host, port, user, password } = req.body;
  
  if (!host || !user || !password) {
    return res.status(400).json({ error: 'Host, username, and password are required' });
  }

  const client = new ftp.Client();
  
  try {
    console.log(`Testing FTP connection to ${host}:${port}`);
    
    await client.access({
      host: host,
      port: port || 21,
      user: user,
      password: password,
      secure: false // Set to true for FTPS
    });
    
    console.log('FTP connection successful');
    await client.close();
    
    res.json({ success: true, message: 'FTP connection successful' });
  } catch (error) {
    console.error('FTP connection failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// List FTP Directories with Files
app.post('/api/ftp/explore', async (req, res) => {
  const { host, port, user, password, remotePath, maxDepth = 2 } = req.body;
  
  if (!host || !user || !password) {
    return res.status(400).json({ error: 'FTP credentials are required' });
  }

  const client = new ftp.Client();
  
  async function exploreDirectory(path, depth = 0) {
    if (depth >= maxDepth) return null;
    
    try {
      const list = await client.list(path);
      const result = {
        path: path,
        directories: [],
        files: [],
        allureFiles: []
      };
      
      for (const item of list) {
        if (item.isDirectory) {
          result.directories.push(item.name);
        } else {
          result.files.push(item.name);
          // Check if it's an Allure file
          if (['behaviors.json', 'categories.json', 'packages.json', 'suites.json', 'timeline.json'].includes(item.name)) {
            result.allureFiles.push(item.name);
          }
        }
      }
      
      // Recursively explore subdirectories
      const subdirectories = {};
      for (const dirName of result.directories.slice(0, 10)) { // Limit to first 10 directories
        const subPath = path.endsWith('/') ? path + dirName : path + '/' + dirName;
        subdirectories[dirName] = await exploreDirectory(subPath, depth + 1);
      }
      
      if (Object.keys(subdirectories).length > 0) {
        result.subdirectories = subdirectories;
      }
      
      return result;
    } catch (error) {
      return { error: error.message, path: path };
    }
  }
  
  try {
    await client.access({
      host: host,
      port: port || 21,
      user: user,
      password: password,
      secure: false
    });
    
    const searchPath = remotePath || '/';
    const exploration = await exploreDirectory(searchPath);
    
    await client.close();
    res.json({ success: true, exploration });
    
  } catch (error) {
    console.error('Failed to explore directories:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// List FTP Directories
app.post('/api/ftp/directories', async (req, res) => {
  const { host, port, user, password, remotePath } = req.body;
  
  if (!host || !user || !password) {
    return res.status(400).json({ error: 'FTP credentials are required' });
  }

  const client = new ftp.Client();
  
  try {
    await client.access({
      host: host,
      port: port || 21,
      user: user,
      password: password,
      secure: false
    });
    
    // Change to the specified directory
    if (remotePath && remotePath !== '/') {
      await client.cd(remotePath);
    }
    
    // List directory contents
    const list = await client.list();
    
    // Filter only directories
    const directories = list
      .filter(item => item.isDirectory)
      .map(item => item.name)
      .sort();
    
    await client.close();
    
    res.json({ directories });
  } catch (error) {
    console.error('Failed to list directories:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Helper function to recursively search for Allure files
async function findAllureFilesRecursively(client, currentPath, allureFiles, maxDepth = 3, currentDepth = 0) {
  const foundFiles = {};
  
  if (currentDepth >= maxDepth) {
    return foundFiles;
  }
  
  try {
    console.log(`Searching in directory: ${currentPath} (depth: ${currentDepth})`);
    
    // Try to find Allure files in current directory
    for (const fileName of allureFiles) {
      try {
        const filePath = currentPath.endsWith('/') ? currentPath + fileName : currentPath + '/' + fileName;
        console.log(`Trying to download: ${filePath}`);
        const buffer = await client.downloadToBuffer(filePath);
        const content = buffer.toString('utf8');
        foundFiles[fileName] = JSON.parse(content);
        console.log(`✓ Found and downloaded ${fileName} from ${currentPath}`);
      } catch (fileError) {
        // File not found in this directory, continue searching
      }
    }
    
    // If we found some files, return them (assuming they're in the same directory)
    if (Object.keys(foundFiles).length > 0) {
      return foundFiles;
    }
    
    // Otherwise, search in subdirectories
    const list = await client.list(currentPath);
    const directories = list.filter(item => item.isDirectory);
    
    for (const dir of directories) {
      const subPath = currentPath.endsWith('/') ? currentPath + dir.name : currentPath + '/' + dir.name;
      const subFiles = await findAllureFilesRecursively(client, subPath, allureFiles, maxDepth, currentDepth + 1);
      
      // If we found files in a subdirectory, use those
      if (Object.keys(subFiles).length > 0) {
        Object.assign(foundFiles, subFiles);
        break; // Stop searching other directories once we find a complete set
      }
    }
    
  } catch (error) {
    console.warn(`Could not search directory ${currentPath}: ${error.message}`);
  }
  
  return foundFiles;
}

// Download Allure Files
app.post('/api/ftp/allure-data', async (req, res) => {
  const { host, port, user, password, remotePath } = req.body;
  
  if (!host || !user || !password) {
    return res.status(400).json({ error: 'FTP credentials are required' });
  }

  const client = new ftp.Client();
  
  try {
    await client.access({
      host: host,
      port: port || 21,
      user: user,
      password: password,
      secure: false
    });
    
    const searchPath = remotePath || '/';
    console.log(`Starting recursive search for Allure files in: ${searchPath}`);
    
    const allureFiles = ['behaviors.json', 'categories.json', 'packages.json', 'suites.json', 'timeline.json'];
    const data = await findAllureFilesRecursively(client, searchPath, allureFiles);
    
    await client.close();
    
    if (Object.keys(data).length === 0) {
      return res.status(404).json({ 
        error: 'No Allure files found in the specified directory or its subdirectories',
        searchPath: searchPath,
        expectedFiles: allureFiles
      });
    }
    
    res.json({ 
      success: true, 
      data,
      filesFound: Object.keys(data).length,
      searchPath: searchPath,
      message: `Found ${Object.keys(data).length} Allure files`
    });
    
  } catch (error) {
    console.error('Failed to download Allure files:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Allure FTP Backend', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Allure FTP Backend running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 FTP endpoints available:`);
  console.log(`   POST /api/ftp/connect - Test FTP connection`);
  console.log(`   POST /api/ftp/directories - List FTP directories`);
  console.log(`   POST /api/ftp/explore - Explore directory structure with files`);
  console.log(`   POST /api/ftp/allure-data - Download Allure files (with recursive search)`);
});

module.exports = app;
