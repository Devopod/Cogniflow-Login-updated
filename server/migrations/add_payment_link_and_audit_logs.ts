import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Starting migration: add_payment_link_and_audit_logs');
  
  try {
    // Add payment_link column to invoices if not exists
    console.log('📋 Adding payment_link column to invoices table...');
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='invoices' AND column_name='payment_link'
          ) THEN
              ALTER TABLE invoices ADD COLUMN payment_link VARCHAR(1000);
          END IF;
      END$$;
    `);
    console.log('✅ payment_link column added successfully');

    // Create audit_logs table if not exists
    console.log('📋 Creating audit_logs table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          action VARCHAR(100) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ audit_logs table created successfully');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error); 