import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

let db: any;
let pool: any;

if (isDevelopment) {
  // Use mock database for development to avoid schema compatibility issues
  console.log('Using mock database for development');
  
  // Create a mock database object that returns empty results
  db = {
    query: () => Promise.resolve({ rows: [] }),
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
  
  // Mock pool for compatibility with existing code
  pool = {
    query: (sql: string, params?: any[]) => {
      console.log('Mock DB Query:', sql);
      return Promise.resolve({ rows: [] });
    }
  };
} else {
  // Use production Neon database
  console.log('Using Neon database for production');
  // Configure neon to use websockets
  neonConfig.webSocketConstructor = ws;

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // For production, we'll need to import schema statically
  db = drizzle(pool, {});
}

export { db, pool };