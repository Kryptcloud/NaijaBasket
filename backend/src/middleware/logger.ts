import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, "app.log");
const errorFile = path.join(logsDir, "errors.log");

// ============= LOGGING SERVICE =============
export class Logger {
  static log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}${
      data ? ` | ${JSON.stringify(data)}` : ""
    }\n`;

    // Console output
    if (level === "error") {
      console.error(logEntry);
    } else {
      console.log(logEntry);
    }

    // File output
    const targetFile = level === "error" ? errorFile : logFile;
    fs.appendFileSync(targetFile, logEntry);
  }

  static info(message: string, data?: any) {
    this.log("info", message, data);
  }

  static warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  static error(message: string, data?: any) {
    this.log("error", message, data);
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, data);
    }
  }
}

// ============= REQUEST LOGGING MIDDLEWARE =============
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const level = statusCode >= 400 ? "warn" : "info";

    Logger.log(level, `${req.method} ${req.path}`, {
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      ...(req.user && { userId: req.user.id }),
    });

    // Secure logging: Don't log sensitive data
    if (
      req.path.includes("/auth/login") ||
      req.path.includes("/auth/register")
    ) {
      Logger.debug(`Sensitive request to ${req.path}`);
    }

    res.send = originalSend;
    return res.send(data);
  };

  next();
};

export default Logger;
