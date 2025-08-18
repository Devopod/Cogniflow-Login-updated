-- Part 1 links and FKs for cross-module integrations

-- 1) Link invoices to orders (sales_order_id)
ALTER TABLE IF EXISTS invoices
ADD COLUMN IF NOT EXISTS sales_order_id integer REFERENCES orders(id);
CREATE INDEX IF NOT EXISTS invoices_sales_order_id_idx ON invoices(sales_order_id);

-- 2) Add crm_deal_id to quotations and purchase_requests
ALTER TABLE IF EXISTS quotations
ADD COLUMN IF NOT EXISTS crm_deal_id integer REFERENCES deals(id);
CREATE INDEX IF NOT EXISTS quotations_crm_deal_id_idx ON quotations(crm_deal_id);

ALTER TABLE IF EXISTS purchase_requests
ADD COLUMN IF NOT EXISTS crm_deal_id integer REFERENCES deals(id);
CREATE INDEX IF NOT EXISTS purchase_requests_crm_deal_id_idx ON purchase_requests(crm_deal_id);

-- 3) Ensure suppliers link on products (supplier_id) if needed for Purchase->Inventory
ALTER TABLE IF EXISTS products
ADD COLUMN IF NOT EXISTS supplier_id integer REFERENCES suppliers(id);
CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON products(supplier_id);

-- 4) Optional: create Goods Delivery Notes table if not present (minimal schema)
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
CREATE INDEX IF NOT EXISTS gdn_sales_order_id_idx ON goods_delivery_notes(sales_order_id);