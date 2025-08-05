import { db } from '../db';

async function main() {
  console.log('Running migration: fix-purchase-tables-schema');
  
  try {
    // Fix suppliers table - add missing columns
    await db.execute(`
      ALTER TABLE suppliers 
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
    `);
    
    // Remove old columns and rename to match schema
    await db.execute(`
      ALTER TABLE suppliers 
      DROP COLUMN IF EXISTS credit_limit;
    `);
    
    // Fix purchase_requests table structure
    await db.execute(`
      ALTER TABLE purchase_requests 
      ADD COLUMN IF NOT EXISTS request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      DROP COLUMN IF EXISTS justification,
      DROP COLUMN IF EXISTS priority,
      DROP COLUMN IF EXISTS currency,
      DROP COLUMN IF EXISTS approved_amount;
    `);
    
    // Fix purchase_request_items table - rename columns to match schema
    await db.execute(`
      ALTER TABLE purchase_request_items 
      ADD COLUMN IF NOT EXISTS estimated_unit_price REAL,
      ADD COLUMN IF NOT EXISTS estimated_total REAL,
      DROP COLUMN IF EXISTS unit_price,
      DROP COLUMN IF EXISTS total_amount,
      DROP COLUMN IF EXISTS specifications,
      DROP COLUMN IF EXISTS suggested_supplier;
    `);
    
    // Fix purchase_orders table - add missing columns and rename
    await db.execute(`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS shipping_address TEXT,
      ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS shipping_amount REAL,
      ADD COLUMN IF NOT EXISTS discount_amount REAL,
      DROP COLUMN IF EXISTS shipping_cost,
      DROP COLUMN IF EXISTS delivery_address,
      DROP COLUMN IF EXISTS special_instructions,
      DROP COLUMN IF EXISTS created_by,
      DROP COLUMN IF EXISTS currency;
    `);
    
    // Fix purchase_order_items table - major restructure
    await db.execute(`
      ALTER TABLE purchase_order_items 
      ADD COLUMN IF NOT EXISTS total REAL,
      DROP COLUMN IF EXISTS discount_rate,
      DROP COLUMN IF EXISTS discount_amount,
      DROP COLUMN IF EXISTS subtotal,
      DROP COLUMN IF EXISTS total_amount,
      DROP COLUMN IF EXISTS remaining_quantity,
      DROP COLUMN IF EXISTS specifications;
    `);
    
    // Update existing total values
    await db.execute(`
      UPDATE purchase_order_items 
      SET total = quantity * unit_price 
      WHERE total IS NULL;
    `);
    
    console.log('Purchase tables schema migration completed successfully');
  } catch (error) {
    console.error('Purchase tables schema migration failed:', error);
    throw error;
  }
}

export { main as up };

// Direct execution
main().then(() => {
  console.log('Purchase tables schema migration completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Purchase tables schema migration failed:', error);
  process.exit(1);
});