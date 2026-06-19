const express = require('express');
const path = require('path');

const app = express();
const startPort = Number(process.env.PORT) || 3000;
const maxPort = startPort + 10;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`Server running at http://localhost:${portToTry}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && portToTry < maxPort) {
      startServer(portToTry + 1);
    } else {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  });
}

startServer(startPort);
