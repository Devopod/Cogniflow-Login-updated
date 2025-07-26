-- Add missing columns to invoices table
-- Run these commands in your Neon database console

-- Core payment and status columns
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_terms" varchar(100) DEFAULT 'Net 30';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_status" varchar(50) DEFAULT 'Unpaid';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_payment_date" timestamp;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_payment_amount" real;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_payment_method" varchar(50);

-- Payment reminder tracking
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_due_reminder_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_overdue_reminder_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_thank_you_sent" boolean DEFAULT false;

-- Payment settings
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "allow_partial_payment" boolean DEFAULT true;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "allow_online_payment" boolean DEFAULT true;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "enabled_payment_methods" jsonb;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_instructions" text;

-- Recurring invoice features
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_frequency" varchar(50);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_start_date" date;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_end_date" date;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_count" integer;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_remaining" integer;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "next_invoice_date" date;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "parent_recurring_invoice_id" integer;

-- Client portal and PDF features
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_portal_url" varchar(500);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_generated" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_url" varchar(500);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "email_sent" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "email_sent_date" timestamp;

-- Tax calculation features
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tax_inclusive" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tax_type" varchar(50);

-- Multi-currency support
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "exchange_rate" real DEFAULT 1.0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "base_currency" varchar(3) DEFAULT 'USD';

-- Workflow and automation
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "auto_reminder_enabled" boolean DEFAULT true;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "late_fee_enabled" boolean DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "late_fee_amount" real;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "late_fee_percentage" real;

-- Additional features
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_invoice_id" integer;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recurring_schedule" jsonb;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "payment_portal_token" text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "payment_status_idx" ON "invoices" ("payment_status");
CREATE INDEX IF NOT EXISTS "invoice_due_date_idx" ON "invoices" ("due_date");
CREATE INDEX IF NOT EXISTS "invoice_contact_id_idx" ON "invoices" ("contact_id");
CREATE INDEX IF NOT EXISTS "invoice_recurring_idx" ON "invoices" ("is_recurring");
CREATE INDEX IF NOT EXISTS "invoice_next_date_idx" ON "invoices" ("next_invoice_date");