# Web Audit API Server

This is the API server for handling screenshot uploads from the browser extension.

## Deployment Instructions for Hostinger

### Step 1: Upload Files
1. Create a new subdomain (e.g., `api.webaudits.logiclaunch.in`)
2. Upload these files to the subdomain's root directory:
   - `server.js`
   - `package.json`
   - `.htaccess` (if needed)

### Step 2: Install Dependencies
Connect to your hosting via SSH or use Hostinger's Node.js app manager:

```bash
npm install
```

### Step 3: Start the Server
For Hostinger Node.js hosting:
```bash
npm start
```

### Step 4: Update Browser Extension
Update the browser extension to use your API URL:
- Change from `localhost:8081` to `https://api.webaudits.logiclaunch.in`

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Health status
- `POST /api/screenshot` - Upload screenshot file
- `POST /api/screenshot/base64` - Upload base64 screenshot
- `GET /uploads/:filename` - Serve uploaded files

## Environment Variables

- `PORT` - Server port (default: 8081)
- `NODE_ENV` - Environment (production/development)

## File Structure
```
api-server/
├── server.js          # Main server file
├── package.json       # Dependencies
├── uploads/           # Uploaded screenshots (auto-created)
└── README.md         # This file
```
