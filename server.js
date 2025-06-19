// Simple API server to receive screenshots from browser extension
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 8081;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Middleware
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, path) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Web Audit API Server is running',
        timestamp: new Date().toISOString(),
        uploadsDir: uploadsDir
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Screenshot upload endpoint
app.post('/api/screenshot', upload.single('screenshot'), (req, res) => {
    try {
        console.log('Screenshot upload request received');
        console.log('Headers:', req.headers);
        console.log('Body keys:', Object.keys(req.body));
        console.log('File info:', req.file ? {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        } : 'No file received');

        if (!req.file) {
            console.error('No file received in upload request');
            return res.status(400).json({ 
                success: false, 
                error: 'No file received',
                received: {
                    body: req.body,
                    headers: req.headers
                }
            });
        }

        const response = {
            success: true,
            filename: req.file.filename,
            message: 'Screenshot uploaded successfully',
            url: `/uploads/${req.file.filename}`,
            size: req.file.size
        };

        console.log('Upload successful:', response);
        res.json(response);
    } catch (error) {
        console.error('Error in screenshot upload:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Handle base64 screenshot uploads
app.post('/api/screenshot/base64', (req, res) => {
    try {
        console.log('Base64 screenshot upload request received');
        
        const { image, filename } = req.body;
        
        if (!image) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image data received' 
            });
        }

        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Generate filename
        const timestamp = Date.now();
        const finalFilename = filename || `screenshot-${timestamp}.png`;
        const filepath = path.join(uploadsDir, finalFilename);
        
        // Write file
        fs.writeFileSync(filepath, base64Data, 'base64');
        
        const response = {
            success: true,
            filename: finalFilename,
            message: 'Screenshot uploaded successfully',
            url: `/uploads/${finalFilename}`,
            size: fs.statSync(filepath).size
        };

        console.log('Base64 upload successful:', response);
        res.json(response);
    } catch (error) {
        console.error('Error in base64 screenshot upload:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'File size should be less than 10MB'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            'GET /',
            'GET /api/health',
            'POST /api/screenshot',
            'POST /api/screenshot/base64',
            'GET /uploads/:filename'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Web Audit API Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🌐 Available endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   POST http://localhost:${PORT}/api/screenshot`);
    console.log(`   POST http://localhost:${PORT}/api/screenshot/base64`);
    console.log(`   GET  http://localhost:${PORT}/uploads/:filename`);
});
