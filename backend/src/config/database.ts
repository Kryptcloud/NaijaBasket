import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL support for production
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: true } 
    : false,
});

// Connection error handling
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client:", err);
  process.exit(-1);
});

// Query wrapper with proper error handling
export const query = async (
  text: string,
  params?: any[]
): Promise<any> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✓ Query executed (${duration}ms): ${text.substring(0, 50)}...`);
    return result;
  } catch (error) {
    console.error("❌ Database query error:", error);
    throw error;
  }
};

// Transaction support
export const transaction = async (
  callback: (client: PoolClient) => Promise<any>
): Promise<any> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const db = {
  query,
  transaction,
  connect: () => pool.connect(),
  end: () => pool.end(),
  pool,
};

export default db;
