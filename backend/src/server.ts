import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import accountingRoutes from "./routes/accounting";
import { authMiddleware } from "./middleware/auth";
import { securityMiddleware } from "./middleware/security";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";
import { db } from "./config/database";

dotenv.config();

const app: Application = express();
const httpServer = http.createServer(app as any);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
    credentials: true,
  },
});

// Attach io to express app for use in routes
(app as any).io = io;

const PORT = process.env.PORT || 3000;

// ============= SECURITY MIDDLEWARE =============
// Helmet: Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// CORS with strict configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600, // Pre-flight cache
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser with size limits to prevent DoS
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Request logging
app.use(requestLogger);

// Custom security middleware
app.use(securityMiddleware);

// ============= HEALTH CHECK =============
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============= ROUTES =============
// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Protected routes
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);

// Admin routes (role-based)
app.use("/api/admin", authMiddleware, adminRoutes);

// Accounting/Dashboard routes (with Socket.io)
app.use("/api/admin/accounting", accountingRoutes);

// ============= 404 HANDLER =============
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
    path: req.path,
  });
});

// ============= ERROR HANDLER =============
app.use(errorHandler);

// ============= DATABASE INITIALIZATION =============
async function initializeDatabase() {
  try {
    const client = await db.connect();
    console.log("✅ Database connected successfully");
    
    // Run migrations (optional)
    // await runMigrations();
    
    client.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

// ============= SERVER STARTUP =============
async function startServer() {
  try {
    await initializeDatabase();

    // Socket.io connection handling
    io.on("connection", (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔒 Security: Helmet, CORS, Rate Limiting, JWT enabled`);
      console.log(`🔌 Real-time: Socket.io enabled`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// ============= GRACEFUL SHUTDOWN =============
process.on("SIGTERM", async () => {
  console.log("⏸️  SIGTERM signal received: closing HTTP server");
  await db.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("⏸️  SIGINT signal received: closing HTTP server");
  await db.end();
  process.exit(0);
});

export default app;
