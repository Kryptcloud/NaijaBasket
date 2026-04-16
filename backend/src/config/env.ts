import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiry: string;
    refreshSecret: string;
    refreshExpiry: string;
  };
  paystack: {
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
  };
  server: {
    port: number;
    host: string;
    nodeEnv: "development" | "production" | "test";
    apiUrl: string;
  };
  security: {
    bcryptRounds: number;
    maxLoginAttempts: number;
    allowedOrigins: string[];
  };
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables check
  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "PAYSTACK_SECRET_KEY",
    "PAYSTACK_PUBLIC_KEY",
  ];

  for (const env of required) {
    if (!process.env[env]) {
      errors.push(`❌ Missing required environment variable: ${env}`);
    }
  }

  // Validate JWT Secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push("❌ JWT_SECRET must be at least 32 characters long");
  }

  if (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length < 32) {
    errors.push("❌ REFRESH_TOKEN_SECRET must be at least 32 characters long");
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://")) {
    errors.push("❌ DATABASE_URL must start with postgresql://");
  }

  // Throw error if validation fails
  if (errors.length > 0) {
    console.error("\n" + "=".repeat(50));
    console.error("ENVIRONMENT VALIDATION FAILED");
    console.error("=".repeat(50));
    errors.forEach((err) => console.error(err));
    console.error("=".repeat(50));
    console.error("\nCheck .env.example for required variables\n");
    process.exit(1);
  }

  // Log validation success
  console.log("✅ Environment variables validated successfully");

  return {
    database: {
      url: process.env.DATABASE_URL!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiry: process.env.JWT_EXPIRY || "7d",
      refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
      refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || "30d",
    },
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY!,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || "",
    },
    server: {
      port: parseInt(process.env.PORT || "3000", 10),
      host: process.env.HOST || "localhost",
      nodeEnv: (process.env.NODE_ENV || "development") as any,
      apiUrl: process.env.API_URL || "http://localhost:3000",
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:5173",
        "http://localhost:8080",
      ],
    },
  };
}

export const config = validateEnv();
