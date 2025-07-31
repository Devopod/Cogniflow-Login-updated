import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

// Configure neon to use websockets
neonConfig.webSocketConstructor = ws;

// For development, use SQLite if no DATABASE_URL is provided
if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
  console.log('Using development SQLite database');
  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const Database = (await import('better-sqlite3')).default;
  
  const sqlite = new Database('cogniflow-dev.db');
  export const db = drizzle(sqlite, { schema });
  
  // Mock pool for compatibility
  export const pool = {
    query: (sql: string, params?: any[]) => {
      return { rows: [] };
    }
  };
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
}