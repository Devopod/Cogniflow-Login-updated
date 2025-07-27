-- Add payment_link column to invoices if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='invoices' AND column_name='payment_link'
    ) THEN
        ALTER TABLE invoices ADD COLUMN payment_link VARCHAR(1000);
    END IF;
END$$;

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
); 