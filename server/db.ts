import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

// Use SQLite for development - simpler and doesn't require external database
const sqlite = new Database('erp-dev.db');
export const db = drizzle(sqlite, { schema });

// Mock pool for compatibility with existing code
export const pool = {
  query: (sql: string, params?: any[]) => {
    // This is a simplified mock - in real usage you'd want proper query handling
    return { rows: [] };
  }
};