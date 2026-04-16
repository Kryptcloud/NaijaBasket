import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import {
  loginLimiter,
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/security";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import Logger from "../middleware/logger";

const router = Router();

// ============= INPUT VALIDATION SCHEMAS =============
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain at least one special character"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Invalid phone number"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ============= REGISTER =============
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      throw new AppError(409, "Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // BCRYPT_ROUNDS from env

    // Create user
    const userId = uuidv4();
    const result = await db.query(
      `INSERT INTO users (id, name, email, password, phone, role, created_at)
       VALUES ($1, $2, $3, $4, $5, 'customer', NOW())
       RETURNING id, email, name, role`,
      [userId, name, email, hashedPassword, phone || null]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    Logger.info("User registered successfully", { userId: user.id, email: user.email });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  })
);

// ============= LOGIN =============
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const result = await db.query(
      "SELECT id, email, name, password, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, "Invalid email or password");
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      Logger.warn("Failed login attempt", { email });
      throw new AppError(401, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database (optional, for token blacklisting)
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days', NOW())`,
      [user.id, refreshToken]
    );

    Logger.info("User logged in successfully", { userId: user.id, email: user.email });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  })
);

// ============= REFRESH TOKEN =============
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, "Refresh token is required");
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || ""
      ) as any;

      // Check if token is in database and not revoked
      const tokenResult = await db.query(
        "SELECT id FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()",
        [refreshToken, decoded.id]
      );

      if (tokenResult.rows.length === 0) {
        throw new AppError(401, "Invalid or expired refresh token");
      }

      // Fetch user
      const userResult = await db.query(
        "SELECT id, email, name, role FROM users WHERE id = $1",
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        throw new AppError(401, "User not found");
      }

      const user = userResult.rows[0];
      const newAccessToken = generateAccessToken(user);

      res.status(200).json({
        message: "Token refreshed",
        tokens: {
          accessToken: newAccessToken,
          refreshToken, // Same refresh token
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(401, "Invalid refresh token");
    }
  })
);

// ============= LOGOUT =============
router.post(
  "/logout",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke refresh token
      await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
        refreshToken,
      ]);
    }

    Logger.info("User logged out", { ip: req.ip });

    res.status(200).json({
      message: "Logout successful",
    });
  })
);

// ============= HELPER FUNCTIONS =============
function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "",
    {
      expiresIn: process.env.JWT_EXPIRY || "7d",
      issuer: "eggchain",
      subject: user.id,
    }
  );
}

function generateRefreshToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      type: "refresh",
    },
    process.env.REFRESH_TOKEN_SECRET || "",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "30d",
      issuer: "eggchain",
      subject: user.id,
    }
  );
}

export default router;
