import { Request, Response } from 'express';

/**
 * Catch-all handler for routes that don't match any registered route.
 * Must be registered after all routes but before the error handler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
