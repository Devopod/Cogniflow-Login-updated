import { db } from '../db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('🔄 Starting migration: part1_links');
  try {
    // 1) invoices.sales_order_id → orders(id)
    console.log('➕ Ensuring invoices.sales_order_id exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='invoices' AND column_name='sales_order_id'
        ) THEN
          ALTER TABLE invoices ADD COLUMN sales_order_id integer REFERENCES orders(id);
        END IF;
      END$$;
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS invoices_sales_order_id_idx ON invoices(sales_order_id);`);

    // 2) quotations.crm_deal_id → deals(id)
    console.log('➕ Ensuring quotations.crm_deal_id exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='quotations' AND column_name='crm_deal_id'
        ) THEN
          ALTER TABLE quotations ADD COLUMN crm_deal_id integer REFERENCES deals(id);
        END IF;
      END$$;
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS quotations_crm_deal_id_idx ON quotations(crm_deal_id);`);

    // 3) purchase_requests.crm_deal_id → deals(id)
    console.log('➕ Ensuring purchase_requests.crm_deal_id exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='purchase_requests' AND column_name='crm_deal_id'
        ) THEN
          ALTER TABLE purchase_requests ADD COLUMN crm_deal_id integer REFERENCES deals(id);
        END IF;
      END$$;
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS purchase_requests_crm_deal_id_idx ON purchase_requests(crm_deal_id);`);

    // 4) products.supplier_id → suppliers(id)
    console.log('➕ Ensuring products.supplier_id exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='products' AND column_name='supplier_id'
        ) THEN
          ALTER TABLE products ADD COLUMN supplier_id integer REFERENCES suppliers(id);
        END IF;
      END$$;
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON products(supplier_id);`);

    // 5) goods_delivery_notes (minimal)
    console.log('🧾 Ensuring goods_delivery_notes table exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS goods_delivery_notes (
        id SERIAL PRIMARY KEY,
        user_id integer REFERENCES users(id),
        sales_order_id integer REFERENCES orders(id),
        gdn_number varchar(50) UNIQUE,
        issue_date date DEFAULT CURRENT_DATE,
        notes text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS gdn_sales_order_id_idx ON goods_delivery_notes(sales_order_id);`);

    console.log('✅ Migration part1_links completed successfully');
  } catch (err) {
    console.error('❌ Migration part1_links failed:', err);
    throw err;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});