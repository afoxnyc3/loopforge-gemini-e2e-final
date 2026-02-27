import { createApp } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST ?? '0.0.0.0';

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  console.log(`[INFO] Notes API listening on http://${HOST}:${PORT}`);
  console.log(`[INFO] Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received — shutting down gracefully');
  server.close(() => {
    console.log('[INFO] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT received — shutting down gracefully');
  server.close(() => {
    console.log('[INFO] Server closed');
    process.exit(0);
  });
});

export default app;
