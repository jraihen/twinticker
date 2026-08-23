const http = require('node:http');
const { execFile } = require('node:child_process');
const { getAsset } = require('node:sea');

const files = {
  '/': { asset: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { asset: 'index.html', type: 'text/html; charset=utf-8' },
  '/styles.css': { asset: 'styles.css', type: 'text/css; charset=utf-8' },
  '/app.js': { asset: 'app.js', type: 'text/javascript; charset=utf-8' },
  '/core.js': { asset: 'core.js', type: 'text/javascript; charset=utf-8' }
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = files[pathname];
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': file.type, 'Cache-Control': 'no-store' });
  response.end(Buffer.from(getAsset(file.asset)));
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/`;
  if (!process.argv.includes('--no-open')) {
    if (process.platform === 'win32') {
      execFile('cmd.exe', ['/c', 'start', '', url]);
    } else if (process.platform === 'darwin') {
      execFile('open', [url]);
    } else {
      execFile('xdg-open', [url]);
    }
  }
  console.log(`TwinTicker Alpha is running at ${url}`);
  console.log('Close this window to stop the local app server.');
});
