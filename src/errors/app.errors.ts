/**
 * Base class for all application-level errors.
 * Carries an HTTP status code so the error handler can respond correctly.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** 404 — resource not found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

/** 400 — invalid request payload or parameters */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

/** 409 — conflict (e.g. duplicate resource) */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(409, message, 'CONFLICT');
  }
}
