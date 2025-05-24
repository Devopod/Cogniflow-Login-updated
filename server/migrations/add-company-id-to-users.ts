import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Adding company_id column to users table...');
  
  try {
    // Check if the column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      // Add the company_id column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN company_id INTEGER REFERENCES companies(id)
      `);
      console.log('Successfully added company_id column to users table');
    } else {
      console.log('company_id column already exists in users table');
    }
  } catch (error) {
    console.error('Error adding company_id column:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();