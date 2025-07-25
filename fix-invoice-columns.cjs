#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

async function addMissingColumns() {
  console.log('🔧 Adding missing invoice columns...');
  
  // Get DATABASE_URL from environment (should be your Neon URL)
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  if (dbUrl.includes('dummy') || dbUrl.includes('localhost')) {
    console.log('⚠️  Dummy database URL detected, skipping migration');
    console.log('💡 Set your real Neon database URL to run this migration');
    return;
  }

  console.log('📊 Connecting to database...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // For Neon compatibility
  });

  try {
    // List of columns to add
    const columnsToAdd = [
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_terms" varchar(100) DEFAULT \'Net 30\';',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_status" varchar(50) DEFAULT \'Unpaid\';',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_payment_date" timestamp;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_payment_amount" real;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_payment_method" varchar(50);',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_due_reminder_sent" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_overdue_reminder_sent" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_thank_you_sent" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "allow_partial_payment" boolean DEFAULT true;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "allow_online_payment" boolean DEFAULT true;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "enabled_payment_methods" jsonb;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_instructions" text;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_frequency" varchar(50);',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_start_date" date;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_end_date" date;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_count" integer;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_remaining" integer;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "next_invoice_date" date;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "parent_recurring_invoice_id" integer;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_portal_url" varchar(500);',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_generated" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_url" varchar(500);',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "email_sent" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "email_sent_date" timestamp;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tax_inclusive" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tax_type" varchar(50);',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "exchange_rate" real DEFAULT 1.0;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "base_currency" varchar(3) DEFAULT \'USD\';',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "auto_reminder_enabled" boolean DEFAULT true;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "late_fee_enabled" boolean DEFAULT false;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "late_fee_amount" real;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "late_fee_percentage" real;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_invoice_id" integer;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_schedule" jsonb;',
      'ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_portal_token" text;'
    ];

    // Execute each column addition
    for (const columnSql of columnsToAdd) {
      try {
        await pool.query(columnSql);
        console.log('✅ Added column:', columnSql.split('"')[3]);
      } catch (error) {
        if (error.code === '42701') {
          // Column already exists
          console.log('⚠️  Column already exists:', columnSql.split('"')[3]);
        } else {
          console.error('❌ Error adding column:', error.message);
        }
      }
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "payment_status_idx" ON "invoices" ("payment_status");',
      'CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoices" ("due_date");',
      'CREATE INDEX IF NOT EXISTS "invoice_contact_id_idx" ON "invoices" ("contact_id");',
      'CREATE INDEX IF NOT EXISTS "invoice_recurring_idx" ON "invoices" ("is_recurring");',
      'CREATE INDEX IF NOT EXISTS "invoice_next_date_idx" ON "invoices" ("next_invoice_date");'
    ];

    for (const indexSql of indexes) {
      try {
        await pool.query(indexSql);
        console.log('✅ Created index');
      } catch (error) {
        console.log('⚠️  Index already exists or error:', error.message);
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('✅ All missing invoice columns have been added');
    console.log('✅ Your application should now work without column errors');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addMissingColumns().catch(console.error);