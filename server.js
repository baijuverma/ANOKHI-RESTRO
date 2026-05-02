const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff2',
    '.ttf': 'application/font-ttf',
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Remove query strings for file lookup
    const url = req.url.split('?')[0];
    let filePath = path.join(process.cwd(), url === '/' ? 'index.html' : url);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.warn(`File not found: ${filePath}`);
                res.writeHead(404);
                res.end('404 File Not Found');
            } else {
                console.error(`Server error: ${error.code}`);
                res.writeHead(500);
                res.end(`500 Internal Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*' // Enable CORS just in case
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('   ANOKHI RESTRO - LOCAL SERVER ACTIVE');
    console.log(`   Running at: http://localhost:${PORT}/`);
    console.log('==========================================');
    console.log('Keep this window open while using the app.');
});
