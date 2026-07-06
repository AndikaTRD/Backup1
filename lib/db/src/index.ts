import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// SUPABASE_DATABASE_URL is used on Replit (since DATABASE_URL is Replit-managed).
// On Railway, DATABASE_URL is injected by the platform automatically.
const connectionString =
  process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set. " +
      "Add your Supabase connection string as a secret.",
  );
}

export const pool = new Pool({
  connectionString,
  // Supabase requires SSL. rejectUnauthorized:false handles self-signed
  // certs on the Supabase pooler without needing a CA certificate file.
  ssl: connectionString.includes("supabase") || connectionString.includes("sslmode")
    ? { rejectUnauthorized: false }
    : false,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
