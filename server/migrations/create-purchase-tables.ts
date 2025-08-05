import { db } from '../db';

async function main() {
  console.log('Running migration: create-purchase-tables');
  
  try {
    // Create suppliers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        payment_terms VARCHAR(50),
        credit_limit REAL,
        tax_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create purchase_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        department_id INTEGER REFERENCES departments(id),
        request_number VARCHAR(50) NOT NULL UNIQUE,
        requested_by INTEGER REFERENCES users(id),
        request_date DATE NOT NULL DEFAULT CURRENT_DATE,
        required_date DATE,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        justification TEXT,
        total_amount REAL,
        currency VARCHAR(3) DEFAULT 'USD',
        approved_by INTEGER REFERENCES users(id),
        approval_date TIMESTAMP,
        approved_amount REAL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create purchase_request_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_request_items (
        id SERIAL PRIMARY KEY,
        purchase_request_id INTEGER NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL,
        total_amount REAL,
        specifications TEXT,
        suggested_supplier INTEGER REFERENCES suppliers(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create purchase_orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
        purchase_request_id INTEGER REFERENCES purchase_requests(id),
        order_number VARCHAR(50) NOT NULL UNIQUE,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        subtotal REAL NOT NULL,
        tax_amount REAL,
        discount_amount REAL,
        shipping_cost REAL,
        total_amount REAL NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_terms VARCHAR(50),
        delivery_address TEXT,
        special_instructions TEXT,
        created_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        approval_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create purchase_order_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id SERIAL PRIMARY KEY,
        purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        tax_rate REAL,
        tax_amount REAL,
        discount_rate REAL,
        discount_amount REAL,
        subtotal REAL NOT NULL,
        total_amount REAL NOT NULL,
        received_quantity REAL DEFAULT 0,
        remaining_quantity REAL,
        specifications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create purchase_receipts table (for tracking received goods)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_receipts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id),
        receipt_number VARCHAR(50) NOT NULL UNIQUE,
        receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
        received_by INTEGER REFERENCES users(id),
        delivery_note_number VARCHAR(50),
        warehouse_id INTEGER REFERENCES warehouses(id),
        status VARCHAR(20) DEFAULT 'received',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create purchase_receipt_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_receipt_items (
        id SERIAL PRIMARY KEY,
        purchase_receipt_id INTEGER NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
        purchase_order_item_id INTEGER NOT NULL REFERENCES purchase_order_items(id),
        received_quantity REAL NOT NULL,
        accepted_quantity REAL,
        rejected_quantity REAL,
        unit_price REAL,
        total_amount REAL,
        quality_check_status VARCHAR(20) DEFAULT 'pending',
        quality_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
      CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
      CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON purchase_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
      CREATE INDEX IF NOT EXISTS idx_purchase_requests_department ON purchase_requests(department_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchase_orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
    `);
    
    console.log('Purchase tables migration completed successfully');
  } catch (error) {
    console.error('Purchase tables migration failed:', error);
    throw error;
  }
}

export { main as up };

// Direct execution
main().then(() => {
  console.log('Purchase tables migration completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Purchase tables migration failed:', error);
  process.exit(1);
});