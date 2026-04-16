import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "customer" | "admin";
      };
    }
  }
}

// ============= JWT VERIFICATION =============
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No authentication token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ""
    ) as JwtPayload;

    if (!decoded.id || !decoded.email) {
      return res.status(401).json({
        error: "Invalid token",
        message: "Token missing required fields",
      });
    }

    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      role: decoded.role as "customer" | "admin",
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Please log in again",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "Token is malformed or invalid",
      });
    }

    res.status(500).json({
      error: "Authentication error",
      message: "An unexpected error occurred during authentication",
    });
  }
};

// ============= ADMIN ROLE CHECK =============
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin access required",
    });
  }

  next();
};

// ============= TOKEN EXTRACTION =============
// Extract JWT from Authorization header or cookies
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Also check for token in secure HTTP-only cookies (if configured)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

// ============= OPTIONAL AUTH =============
// For public routes that benefit from auth but don't require it
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as JwtPayload;

      if (decoded.id && decoded.email) {
        req.user = {
          id: decoded.id as string,
          email: decoded.email as string,
          role: decoded.role as "customer" | "admin",
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};
