import { db } from '../db';
import { orders, orderItems, quotations, quotationItems } from '@shared/schema';

async function main() {
  console.log('Running migration: add-sales-tables');
  
  try {
    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER REFERENCES contacts(id),
        order_number VARCHAR(50) NOT NULL UNIQUE,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        delivery_date DATE,
        subtotal REAL NOT NULL,
        tax_amount REAL,
        discount_amount REAL,
        total_amount REAL NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        category VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        shipping_address TEXT,
        billing_address TEXT,
        currency VARCHAR(3) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create order items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        description TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        tax_rate REAL,
        tax_amount REAL,
        discount_rate REAL,
        discount_amount REAL,
        subtotal REAL NOT NULL,
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create quotations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER REFERENCES contacts(id),
        quotation_number VARCHAR(50) NOT NULL UNIQUE,
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        expiry_date DATE,
        subtotal REAL NOT NULL,
        tax_amount REAL,
        discount_amount REAL,
        total_amount REAL NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        terms TEXT,
        category VARCHAR(50),
        currency VARCHAR(3) DEFAULT 'USD',
        converted_to_order BOOLEAN DEFAULT FALSE,
        converted_order_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create quotation items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        description TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        tax_rate REAL,
        tax_amount REAL,
        discount_rate REAL,
        discount_amount REAL,
        subtotal REAL NOT NULL,
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });