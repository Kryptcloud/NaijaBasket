import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { validationResult } from "express-validator";
import crypto from "crypto";

// ============= RATE LIMITING =============
// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Stricter limits for auth endpoints
    if (req.path.includes("/auth/login") || req.path.includes("/auth/register")) {
      return 5; // 5 requests per 15 minutes
    }
    return 100; // 100 requests per 15 minutes for other endpoints
  },
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.path === "/health"; // Skip rate limiting for health check
  },
  keyGenerator: (req: Request) => {
    return req.ip || "unknown"; // Use IP address as key
  },
});

// Strict rate limiter for login attempts (prevents brute force)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again after 15 minutes",
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count all attempts
});

// ============= INPUT VALIDATION =============
// Middleware to check validation results
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: "param" in e ? e.param : "unknown",
        message: e.msg,
      })),
    });
  }
  next();
};

// ============= INPUT SANITIZATION =============
// Sanitize user inputs to prevent XSS and injection attacks
export const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/['";\\]/g, "") // Remove quotes and backslashes
    .substring(0, 1000); // Limit length
};

// ============= SECURITY HEADERS & PROTECTION =============
export const securityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Additional security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  
  // Prevent client-side caching of sensitive data
  if (req.path.includes("/admin") || req.path.includes("/auth")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

// ============= WEBHOOK SIGNATURE VERIFICATION =============
// For Paystack and other webhook providers
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
};

// ============= RATE LIMITING MIDDLEWARE =============
// Apply to all routes
export const applyRateLimiting = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  apiLimiter(req, res, next);
};
