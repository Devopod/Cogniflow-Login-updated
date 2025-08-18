-- Procedure to deduct stock from inventory_items
CREATE OR REPLACE FUNCTION deduct_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_items
    SET quantity_available = quantity_available - NEW.quantity
    WHERE id = NEW.inventory_item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to deduct stock on sales order confirmation
CREATE TRIGGER update_stock
AFTER UPDATE ON sales_orders
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE PROCEDURE deduct_inventory_stock();