const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addPaymentColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database updates...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Add payment_status column to invoices if it doesn't exist
    const checkPaymentStatusResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_status'
    `);
    
    if (checkPaymentStatusResult.rows.length === 0) {
      console.log('Adding payment_status column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'
      `);
    } else {
      console.log('payment_status column already exists');
    }
    
    // Add payment_portal_token column to invoices if it doesn't exist
    const checkTokenResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_portal_token'
    `);
    
    if (checkTokenResult.rows.length === 0) {
      console.log('Adding payment_portal_token column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_portal_token TEXT
      `);
    } else {
      console.log('payment_portal_token column already exists');
    }
    
    // Add payment_reminder_sent column to invoices if it doesn't exist
    const checkReminderResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_reminder_sent'
    `);
    
    if (checkReminderResult.rows.length === 0) {
      console.log('Adding payment_reminder_sent column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_reminder_sent BOOLEAN NOT NULL DEFAULT false
      `);
    } else {
      console.log('payment_reminder_sent column already exists');
    }
    
    // Add last_payment_date column to invoices if it doesn't exist
    const checkLastPaymentResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'last_payment_date'
    `);
    
    if (checkLastPaymentResult.rows.length === 0) {
      console.log('Adding last_payment_date column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN last_payment_date TIMESTAMP
      `);
    } else {
      console.log('last_payment_date column already exists');
    }
    
    // Create payment_gateway_settings table if it doesn't exist
    const checkGatewayTableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'payment_gateway_settings'
    `);
    
    if (checkGatewayTableResult.rows.length === 0) {
      console.log('Creating payment_gateway_settings table');
      await client.query(`
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
        )
      `);
      
      // Insert default payment gateway settings
      console.log('Adding default payment gateway settings');
      await client.query(`
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
        ('razorpay', true, false, 'Razorpay', '{"keyId": "test_key_id", "keySecret": "test_key_secret"}', ARRAY['credit_card', 'debit_card', 'upi'], 1)
      `);
    } else {
      console.log('payment_gateway_settings table already exists');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database updates completed successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating database:', error);
  } finally {
    // Release the client
    client.release();
    // Close the pool
    pool.end();
  }
}

// Run the function
addPaymentColumns()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addPaymentColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database updates...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Add payment_status column to invoices if it doesn't exist
    const checkPaymentStatusResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_status'
    `);
    
    if (checkPaymentStatusResult.rows.length === 0) {
      console.log('Adding payment_status column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'
      `);
    } else {
      console.log('payment_status column already exists');
    }
    
    // Add payment_portal_token column to invoices if it doesn't exist
    const checkTokenResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_portal_token'
    `);
    
    if (checkTokenResult.rows.length === 0) {
      console.log('Adding payment_portal_token column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_portal_token TEXT
      `);
    } else {
      console.log('payment_portal_token column already exists');
    }
    
    // Add payment_reminder_sent column to invoices if it doesn't exist
    const checkReminderResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_reminder_sent'
    `);
    
    if (checkReminderResult.rows.length === 0) {
      console.log('Adding payment_reminder_sent column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_reminder_sent BOOLEAN NOT NULL DEFAULT false
      `);
    } else {
      console.log('payment_reminder_sent column already exists');
    }
    
    // Add last_payment_date column to invoices if it doesn't exist
    const checkLastPaymentResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'last_payment_date'
    `);
    
    if (checkLastPaymentResult.rows.length === 0) {
      console.log('Adding last_payment_date column to invoices table');
      await client.query(`
        ALTER TABLE invoices 
        ADD COLUMN last_payment_date TIMESTAMP
      `);
    } else {
      console.log('last_payment_date column already exists');
    }
    
    // Create payment_gateway_settings table if it doesn't exist
    const checkGatewayTableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'payment_gateway_settings'
    `);
    
    if (checkGatewayTableResult.rows.length === 0) {
      console.log('Creating payment_gateway_settings table');
      await client.query(`
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
        )
      `);
      
      // Insert default payment gateway settings
      console.log('Adding default payment gateway settings');
      await client.query(`
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
        ('razorpay', true, false, 'Razorpay', '{"keyId": "test_key_id", "keySecret": "test_key_secret"}', ARRAY['credit_card', 'debit_card', 'upi'], 1)
      `);
    } else {
      console.log('payment_gateway_settings table already exists');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database updates completed successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating database:', error);
  } finally {
    // Release the client
    client.release();
    // Close the pool
    pool.end();
  }
}

// Run the function
addPaymentColumns()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));