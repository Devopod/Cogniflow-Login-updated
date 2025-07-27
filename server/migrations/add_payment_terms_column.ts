import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Starting migration: add_payment_terms_column');
  
  try {
    // Add payment_terms column to invoices if not exists
    console.log('📋 Adding payment_terms column to invoices table...');
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='invoices' AND column_name='payment_terms'
          ) THEN
              ALTER TABLE invoices ADD COLUMN payment_terms VARCHAR(100) DEFAULT 'Net 30';
          END IF;
      END$$;
    `);
    console.log('✅ payment_terms column added successfully');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMigration().catch(console.error); 