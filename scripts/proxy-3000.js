const http = require('http');

const TARGET_PORT = 3001;
const LISTEN_PORT = 3000;

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `127.0.0.1:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Proxy 3000 -> ${TARGET_PORT}] Error forwarding request:`, err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end(`Bad Gateway: Unable to connect to Next.js on port ${TARGET_PORT}`);
    }
  });

  clientReq.pipe(proxyReq, { end: true });
});

// Support WebSockets / HMR
server.on('upgrade', (req, socket, head) => {
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options);
  proxyReq.on('error', (err) => {
    console.error(`[Proxy 3000 -> ${TARGET_PORT}] WS upgrade error:`, err.message);
    socket.destroy();
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.keys(proxyRes.headers)
        .map((h) => `${h}: ${proxyRes.headers[h]}`)
        .join('\r\n') +
      '\r\n\r\n'
    );
    if (proxyHead && proxyHead.length) {
      socket.write(proxyHead);
    }
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.end();
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Forwarding all traffic from http://localhost:${LISTEN_PORT} -> http://localhost:${TARGET_PORT}`);
});
