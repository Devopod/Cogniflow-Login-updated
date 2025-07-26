-- Migration to add missing columns to invoices table
-- This adds columns that are defined in the schema but missing from the database

-- Add payment_terms column
ALTER TABLE "invoices" ADD COLUMN "payment_terms" varchar(100) DEFAULT 'Net 30';

-- Add other missing columns that might be referenced in the code
ALTER TABLE "invoices" ADD COLUMN "payment_status" varchar(50) DEFAULT 'Unpaid';
ALTER TABLE "invoices" ADD COLUMN "last_payment_date" timestamp;
ALTER TABLE "invoices" ADD COLUMN "last_payment_amount" real;
ALTER TABLE "invoices" ADD COLUMN "last_payment_method" varchar(50);
ALTER TABLE "invoices" ADD COLUMN "payment_due_reminder_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "payment_overdue_reminder_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "payment_thank_you_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "allow_partial_payment" boolean DEFAULT true;
ALTER TABLE "invoices" ADD COLUMN "allow_online_payment" boolean DEFAULT true;
ALTER TABLE "invoices" ADD COLUMN "enabled_payment_methods" jsonb;
ALTER TABLE "invoices" ADD COLUMN "payment_instructions" text;

-- Add recurring invoice columns
ALTER TABLE "invoices" ADD COLUMN "is_recurring" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "recurring_frequency" varchar(50);
ALTER TABLE "invoices" ADD COLUMN "recurring_start_date" date;
ALTER TABLE "invoices" ADD COLUMN "recurring_end_date" date;
ALTER TABLE "invoices" ADD COLUMN "recurring_count" integer;
ALTER TABLE "invoices" ADD COLUMN "recurring_remaining" integer;
ALTER TABLE "invoices" ADD COLUMN "next_invoice_date" date;
ALTER TABLE "invoices" ADD COLUMN "parent_recurring_invoice_id" integer;

-- Add client portal and PDF columns
ALTER TABLE "invoices" ADD COLUMN "client_portal_url" varchar(500);
ALTER TABLE "invoices" ADD COLUMN "pdf_generated" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "pdf_url" varchar(500);
ALTER TABLE "invoices" ADD COLUMN "email_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "email_sent_date" timestamp;

-- Add tax calculation columns
ALTER TABLE "invoices" ADD COLUMN "tax_inclusive" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "tax_type" varchar(50);

-- Add multi-currency columns
ALTER TABLE "invoices" ADD COLUMN "exchange_rate" real DEFAULT 1.0;
ALTER TABLE "invoices" ADD COLUMN "base_currency" varchar(3) DEFAULT 'USD';

-- Add workflow and automation columns
ALTER TABLE "invoices" ADD COLUMN "auto_reminder_enabled" boolean DEFAULT true;
ALTER TABLE "invoices" ADD COLUMN "late_fee_enabled" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN "late_fee_amount" real;
ALTER TABLE "invoices" ADD COLUMN "late_fee_percentage" real;

-- Add other important columns
ALTER TABLE "invoices" ADD COLUMN "recurring_invoice_id" integer;
ALTER TABLE "invoices" ADD COLUMN "recurring_schedule" jsonb;
ALTER TABLE "invoices" ADD COLUMN "payment_portal_token" text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "payment_status_idx" ON "invoices" ("payment_status");
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoices" ("due_date");
CREATE INDEX IF NOT EXISTS "invoice_contact_id_idx" ON "invoices" ("contact_id");
CREATE INDEX IF NOT EXISTS "invoice_recurring_idx" ON "invoices" ("is_recurring");
CREATE INDEX IF NOT EXISTS "invoice_next_date_idx" ON "invoices" ("next_invoice_date");