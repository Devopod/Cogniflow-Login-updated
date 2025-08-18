-- Add foreign key from sales_orders to inventory_items
ALTER TABLE sales_orders
ADD COLUMN inventory_item_id UUID REFERENCES inventory_items(id);

-- Ensure GDN table has a foreign key to sales_orders
-- Assuming 'gdn' is the table name for GoodsDeliveryNote.tsx schema
ALTER TABLE gdn
ADD COLUMN sales_order_id UUID REFERENCES sales_orders(id);