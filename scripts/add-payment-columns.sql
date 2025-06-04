-- Add payment_status column to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE invoices ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';
        RAISE NOTICE 'Added payment_status column to invoices table';
    ELSE
        RAISE NOTICE 'payment_status column already exists';
    END IF;
END $$;

-- Add payment_portal_token column to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_portal_token'
    ) THEN
        ALTER TABLE invoices ADD COLUMN payment_portal_token TEXT;
        RAISE NOTICE 'Added payment_portal_token column to invoices table';
    ELSE
        RAISE NOTICE 'payment_portal_token column already exists';
    END IF;
END $$;

-- Add payment_reminder_sent column to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_reminder_sent'
    ) THEN
        ALTER TABLE invoices ADD COLUMN payment_reminder_sent BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added payment_reminder_sent column to invoices table';
    ELSE
        RAISE NOTICE 'payment_reminder_sent column already exists';
    END IF;
END $$;

-- Add last_payment_date column to invoices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'last_payment_date'
    ) THEN
        ALTER TABLE invoices ADD COLUMN last_payment_date TIMESTAMP;
        RAISE NOTICE 'Added last_payment_date column to invoices table';
    ELSE
        RAISE NOTICE 'last_payment_date column already exists';
    END IF;
END $$;

-- Create payment_gateway_settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_gateway_settings'
    ) THEN
        CREATE TABLE payment_gateway_settings (
            id SERIAL PRIMARY KEY,
            gateway TEXT NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT false,
            is_default BOOLEAN NOT NULL DEFAULT false,
            display_name TEXT,
            config JSONB NOT NULL DEFAULT '{}',
            supported_payment_methods TEXT[],
            company_id INTEGER NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT payment_gateway_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT payment_gateway_settings_gateway_company_id_unique UNIQUE (gateway, company_id)
        );
        
        -- Insert default payment gateway settings
        INSERT INTO payment_gateway_settings (
            gateway, 
            is_enabled, 
            is_default, 
            display_name, 
            config, 
            supported_payment_methods, 
            company_id
        ) VALUES 
        ('stripe', true, true, 'Stripe', '{"secretKey": "sk_test_example", "publicKey": "pk_test_example"}', ARRAY['credit_card', 'debit_card'], 1),
        ('paypal', true, false, 'PayPal', '{"clientId": "test_client_id", "clientSecret": "test_client_secret"}', ARRAY['paypal'], 1),
        ('razorpay', true, false, 'Razorpay', '{"keyId": "test_key_id", "keySecret": "test_key_secret"}', ARRAY['credit_card', 'debit_card', 'upi'], 1);
        
        RAISE NOTICE 'Created payment_gateway_settings table and added default settings';
    ELSE
        RAISE NOTICE 'payment_gateway_settings table already exists';
    END IF;
END $$;