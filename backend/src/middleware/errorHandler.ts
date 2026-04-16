import { Request, Response, NextFunction } from "express";

// Custom error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============= GLOBAL ERROR HANDLER =============
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Log error details
  console.error("❌ Error:", {
    message: error.message,
    statusCode: error.statusCode || 500,
    path: req.path,
    method: req.method,
    ...(isDevelopment && { stack: error.stack }),
  });

  // Handle custom app errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(isDevelopment && error.details && { details: error.details }),
      timestamp: new Date().toISOString(),
    });
  }

  // Handle database errors
  if (error.code === "23505") {
    // Unique constraint violation
    return res.status(409).json({
      error: "Conflict",
      message: "A record with this value already exists",
    });
  }

  if (error.code === "23502") {
    // Not null violation
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required field",
    });
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: error.message,
      ...(isDevelopment && { details: error.details }),
    });
  }

  // Generic error response (don't expose internals in production)
  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : "Internal Server Error",
    message: isDevelopment
      ? error.message
      : "An unexpected error occurred. Please try again later.",
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
};

// ============= ASYNC ROUTE WRAPPER =============
// Wrap async route handlers to catch errors
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
