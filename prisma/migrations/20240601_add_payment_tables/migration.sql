-- Create payment_gateway_settings table
CREATE TABLE IF NOT EXISTS "payment_gateway_settings" (
    "id" SERIAL PRIMARY KEY,
    "gateway" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "supported_payment_methods" TEXT[],
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_gateway_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_gateway_settings_gateway_company_id_unique" UNIQUE ("gateway", "company_id")
);

-- Add payment_status column to invoices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'unpaid';
    END IF;
END $$;

-- Add payment_portal_token column to invoices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_portal_token'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "payment_portal_token" TEXT;
    END IF;
END $$;

-- Add payment_reminder_sent column to invoices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_reminder_sent'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "payment_reminder_sent" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add last_payment_date column to invoices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'last_payment_date'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "last_payment_date" TIMESTAMP(3);
    END IF;
END $$;

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payments" (
    "id" SERIAL PRIMARY KEY,
    "payment_number" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_method" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reference" TEXT,
    "description" TEXT,
    "payment_gateway" TEXT,
    "transaction_id" TEXT,
    "gateway_fee" DECIMAL(10,2),
    "refund_status" TEXT,
    "refund_amount" DECIMAL(10,2),
    "refund_date" TIMESTAMP(3),
    "refund_reason" TEXT,
    "related_document_type" TEXT NOT NULL,
    "related_document_id" INTEGER NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create payment_reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payment_reminders" (
    "id" SERIAL PRIMARY KEY,
    "invoice_id" INTEGER NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "sent_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_reminders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create payment_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payment_history" (
    "id" SERIAL PRIMARY KEY,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB NOT NULL DEFAULT '{}',
    "related_document_type" TEXT NOT NULL,
    "related_document_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create saved_payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS "saved_payment_methods" (
    "id" SERIAL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "contact_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_payment_methods_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "saved_payment_methods_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "payments_related_document_idx" ON "payments"("related_document_type", "related_document_id");
CREATE INDEX IF NOT EXISTS "payments_contact_id_idx" ON "payments"("contact_id");
CREATE INDEX IF NOT EXISTS "payment_reminders_invoice_id_idx" ON "payment_reminders"("invoice_id");
CREATE INDEX IF NOT EXISTS "payment_reminders_status_idx" ON "payment_reminders"("status");
CREATE INDEX IF NOT EXISTS "payment_history_related_document_idx" ON "payment_history"("related_document_type", "related_document_id");
CREATE INDEX IF NOT EXISTS "saved_payment_methods_contact_id_idx" ON "saved_payment_methods"("contact_id");