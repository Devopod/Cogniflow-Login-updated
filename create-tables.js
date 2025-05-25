import { db } from './server/db.js';

async function createTables() {
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
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    process.exit(0);
  }
}

createTables();