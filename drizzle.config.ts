import { defineConfig } from "drizzle-kit";

const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for production");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: isDevelopment ? "sqlite" : "postgresql",
  dbCredentials: isDevelopment 
    ? { url: "cogniflow-dev.db" }
    : { url: process.env.DATABASE_URL! },
});
