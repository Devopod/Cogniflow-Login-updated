import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Starting migration: add_recurring_invoice_columns');
  try {
    // Add is_recurring column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='is_recurring'
        ) THEN
          ALTER TABLE invoices ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
        END IF;
      END$$;
    `);
    // Add recurring_frequency column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_frequency'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_frequency VARCHAR(50);
        END IF;
      END$$;
    `);
    // Add recurring_start_date column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_start_date'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_start_date DATE;
        END IF;
      END$$;
    `);
    // Add recurring_end_date column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_end_date'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_end_date DATE;
        END IF;
      END$$;
    `);
    // Add recurring_count column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_count'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_count INTEGER;
        END IF;
      END$$;
    `);
    // Add recurring_remaining column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_remaining'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_remaining INTEGER;
        END IF;
      END$$;
    `);
    // Add next_invoice_date column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='next_invoice_date'
        ) THEN
          ALTER TABLE invoices ADD COLUMN next_invoice_date DATE;
        END IF;
      END$$;
    `);
    // Add parent_recurring_invoice_id column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='parent_recurring_invoice_id'
        ) THEN
          ALTER TABLE invoices ADD COLUMN parent_recurring_invoice_id INTEGER;
        END IF;
      END$$;
    `);
    // Add recurring_invoice_id column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_invoice_id'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_invoice_id INTEGER;
        END IF;
      END$$;
    `);
    // Add recurring_schedule column
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='recurring_schedule'
        ) THEN
          ALTER TABLE invoices ADD COLUMN recurring_schedule JSONB;
        END IF;
      END$$;
    `);
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMigration().catch(console.error); 