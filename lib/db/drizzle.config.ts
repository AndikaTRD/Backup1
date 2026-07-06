import { defineConfig } from "drizzle-kit";
import path from "path";

const connectionString =
  process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL (or DATABASE_URL) must be set before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: connectionString.includes("supabase") || connectionString.includes("sslmode")
      ? { rejectUnauthorized: false }
      : false,
  },
});
