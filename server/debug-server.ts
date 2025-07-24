import express from "express";

console.log("1. Starting debug server...");

const app = express();
app.use(express.json());

console.log("2. Setting up basic route...");

app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Debug server working!', timestamp: new Date().toISOString() });
});

console.log("3. Setting up health check...");

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = 3001;

console.log("4. Starting server...");

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Debug server running on port ${port}`);
  console.log(`🌐 Try: http://localhost:${port}/api/health`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});