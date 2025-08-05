import { db } from '../db';
import * as schema from '../../shared/schema';

async function main() {
  console.log('Running migration: clear-purchase-sample-data');
  
  try {
    // Clear all sample data from purchase tables to start fresh
    console.log('Clearing purchase order items...');
    await db.delete(schema.purchaseOrderItems);
    
    console.log('Clearing purchase orders...');
    await db.delete(schema.purchaseOrders);
    
    console.log('Clearing purchase request items...');
    await db.delete(schema.purchaseRequestItems);
    
    console.log('Clearing purchase requests...');
    await db.delete(schema.purchaseRequests);
    
    console.log('Clearing suppliers...');
    await db.delete(schema.suppliers);
    
    console.log('Purchase sample data cleared successfully');
  } catch (error) {
    console.error('Failed to clear purchase sample data:', error);
    throw error;
  }
}

export { main as up };

// Direct execution
main().then(() => {
  console.log('Purchase sample data cleared successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Failed to clear purchase sample data:', error);
  process.exit(1);
});