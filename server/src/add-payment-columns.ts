import { db } from '../../db';

async function addPaymentColumns() {
  try {
    console.log('Adding payment columns to invoices table...');
    
    // Check if payment_status column exists
    const checkPaymentStatusColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_status'
    `);
    
    if (checkPaymentStatusColumn.rows.length === 0) {
      console.log('Adding payment_status column to invoices table');
      await db.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'
      `);
    }
    
    // Check if payment_portal_token column exists
    const checkPaymentPortalTokenColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_portal_token'
    `);
    
    if (checkPaymentPortalTokenColumn.rows.length === 0) {
      console.log('Adding payment_portal_token column to invoices table');
      await db.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_portal_token TEXT
      `);
    }
    
    // Check if payment_reminder_sent column exists
    const checkPaymentReminderSentColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'payment_reminder_sent'
    `);
    
    if (checkPaymentReminderSentColumn.rows.length === 0) {
      console.log('Adding payment_reminder_sent column to invoices table');
      await db.query(`
        ALTER TABLE invoices 
        ADD COLUMN payment_reminder_sent BOOLEAN NOT NULL DEFAULT false
      `);
    }
    
    // Check if last_payment_date column exists
    const checkLastPaymentDateColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'last_payment_date'
    `);
    
    if (checkLastPaymentDateColumn.rows.length === 0) {
      console.log('Adding last_payment_date column to invoices table');
      await db.query(`
        ALTER TABLE invoices 
        ADD COLUMN last_payment_date TIMESTAMP
      `);
    }
    
    // Create payment_gateway_settings table if it doesn't exist
    const checkPaymentGatewaySettingsTable = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'payment_gateway_settings'
    `);
    
    if (checkPaymentGatewaySettingsTable.rows.length === 0) {
      console.log('Creating payment_gateway_settings table');
      await db.query(`
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
    }
    
    console.log('Database updates completed successfully');
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

// Run the function
addPaymentColumns()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));