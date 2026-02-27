import express, { Application } from 'express';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import noteRoutes from './routes/note.routes';

/**
 * Creates and configures the Express application.
 * Exported as a factory so tests can create isolated instances.
 */
export function createApp(): Application {
  const app = express();

  // ── Global middleware ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(requestLogger);

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use('/notes', noteRoutes);

  // ── 404 handler (must come after routes) ──────────────────────────────────
  app.use(notFoundHandler);

  // ── Centralised error handler (must be last) ───────────────────────────────
  app.use(errorHandler);

  return app;
}
