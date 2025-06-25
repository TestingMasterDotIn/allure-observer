# FTP Implementation Guide

## Current State

The current FTP functionality is a **mock implementation with validation** because browsers cannot directly connect to FTP servers due to security restrictions. The FTP service validates settings and simulates connection behavior.

### Mock Validation Rules (for testing):
- ❌ **Will FAIL for**: 
  - Hosts containing: `example`, `test`, `localhost`
  - Usernames: `test`, `admin`, `user`
  - Passwords shorter than 3 characters
  - Invalid host formats (must contain dots or be IP address)
  - Invalid ports (must be 1-65535)

- ✅ **Will PASS for**:
  - Real-looking hostnames (e.g., `ftp.mycompany.com`, `192.168.1.100`)
  - Non-generic usernames (your actual FTP username)
  - Passwords 3+ characters long
  - Valid ports

### Testing the Mock Implementation:
1. Try with wrong credentials first to see validation errors
2. Use your real FTP credentials to see successful connection
3. After success, the "Browse Path" button should appear

## How to Implement Real FTP Functionality

To add working FTP functionality, you need to create a backend service that handles FTP operations.

### Option 1: Node.js Backend

1. **Install dependencies:**
```bash
npm install basic-ftp express cors
```

2. **Create a simple Express server:**
```javascript
const express = require('express');
const ftp = require('basic-ftp');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ftp/connect', async (req, res) => {
  const { host, port, user, password } = req.body;
  const client = new ftp.Client();
  
  try {
    await client.access({
      host,
      port,
      user,
      password
    });
    await client.close();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/ftp/allure-data', async (req, res) => {
  const { host, port, user, password, remotePath } = req.query;
  const client = new ftp.Client();
  
  try {
    await client.access({ host, port, user, password });
    await client.cd(remotePath);
    
    const files = ['behaviors.json', 'categories.json', 'packages.json', 'suites.json', 'timeline.json'];
    const data = {};
    
    for (const file of files) {
      try {
        const content = await client.downloadToBuffer(file);
        data[file] = JSON.parse(content.toString());
      } catch (err) {
        console.warn(`Could not download ${file}:`, err.message);
      }
    }
    
    await client.close();
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('FTP Backend running on port 3001');
});
```

3. **Update the frontend FTP service to call your backend:**
```typescript
async connect(config: FtpConfig): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/ftp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    if (response.ok) {
      this.config = config;
      this.connected = true;
      return true;
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  } catch (error) {
    console.error('FTP connection failed:', error);
    this.connected = false;
    return false;
  }
}
```

### Option 2: Python Backend (Flask)

1. **Install dependencies:**
```bash
pip install flask flask-cors ftplib
```

2. **Create Flask server:**
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import ftplib
import json

app = Flask(__name__)
CORS(app)

@app.route('/api/ftp/connect', methods=['POST'])
def test_connection():
    data = request.json
    try:
        ftp = ftplib.FTP()
        ftp.connect(data['host'], data['port'])
        ftp.login(data['user'], data['password'])
        ftp.quit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ftp/allure-data', methods=['GET'])
def get_allure_data():
    # Implementation similar to Node.js version
    pass

if __name__ == '__main__':
    app.run(port=3001)
```

### Option 3: Alternative - Upload via API

Instead of FTP, you could:
1. Create an API endpoint that accepts Allure report uploads
2. Upload reports from your CI/CD pipeline to your backend
3. Serve the data via REST API

## Frontend Updates Required

Once you have a backend, update these files:

1. **src/services/ftpService.ts** - Replace mock implementation with HTTP calls
2. **src/pages/Settings.tsx** - Update connection testing logic
3. **src/pages/Home.tsx** - Handle backend errors appropriately

## Security Considerations

- Never expose FTP credentials in client-side code
- Use HTTPS for all API communications
- Implement proper authentication and rate limiting
- Validate and sanitize all inputs on the backend
- Consider using environment variables for sensitive configuration

## Testing

1. Start your backend service
2. Configure FTP settings in the application
3. Test connection should now work with real validation
4. Loading data should fetch actual files from your FTP server
