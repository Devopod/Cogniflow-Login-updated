import { db } from '../db';
import { orders, orderItems, quotations, quotationItems } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running migration: add-sample-sales-data');
  
  try {
    // Get the first user
    const [user] = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    if (!user || !user.rows || user.rows.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }
    const userId = user.rows[0].id;
    
    // Get the first contact
    const [contact] = await db.execute(sql`SELECT id FROM contacts LIMIT 1`);
    let contactId = null;
    if (contact && contact.rows && contact.rows.length > 0) {
      contactId = contact.rows[0].id;
    }
    
    // Get the first product
    const [product] = await db.execute(sql`SELECT id, name, selling_price FROM products LIMIT 1`);
    let productId = null;
    let productName = 'Sample Product';
    let productPrice = 100;
    if (product && product.rows && product.rows.length > 0) {
      productId = product.rows[0].id;
      productName = product.rows[0].name;
      productPrice = product.rows[0].selling_price;
    }
    
    // Create sample orders
    const orderData = [
      {
        userId,
        contactId,
        orderNumber: 'ORD-2023-0001',
        orderDate: '2023-05-01',
        subtotal: 500,
        taxAmount: 50,
        totalAmount: 550,
        status: 'completed',
        category: 'Hardware'
      },
      {
        userId,
        contactId,
        orderNumber: 'ORD-2023-0002',
        orderDate: '2023-05-15',
        subtotal: 300,
        taxAmount: 30,
        totalAmount: 330,
        status: 'pending',
        category: 'Software'
      },
      {
        userId,
        contactId,
        orderNumber: 'ORD-2023-0003',
        orderDate: '2023-06-01',
        subtotal: 750,
        taxAmount: 75,
        totalAmount: 825,
        status: 'processing',
        category: 'Services'
      },
      {
        userId,
        contactId,
        orderNumber: 'ORD-2023-0004',
        orderDate: '2023-06-15',
        subtotal: 200,
        taxAmount: 20,
        totalAmount: 220,
        status: 'completed',
        category: 'Hardware'
      },
      {
        userId,
        contactId,
        orderNumber: 'ORD-2023-0005',
        orderDate: '2023-07-01',
        subtotal: 1000,
        taxAmount: 100,
        totalAmount: 1100,
        status: 'pending',
        category: 'Software'
      }
    ];
    
    for (const order of orderData) {
      // Insert order
      const [result] = await db.execute(sql`
        INSERT INTO orders (
          user_id, contact_id, order_number, order_date, 
          subtotal, tax_amount, total_amount, status, category
        ) VALUES (
          ${order.userId}, 
          ${order.contactId}, 
          ${order.orderNumber}, 
          ${order.orderDate}, 
          ${order.subtotal}, 
          ${order.taxAmount}, 
          ${order.totalAmount}, 
          ${order.status}, 
          ${order.category}
        ) RETURNING id
      `);
      
      const orderId = result.rows[0].id;
      
      // Insert order items
      await db.execute(sql`
        INSERT INTO order_items (
          order_id, product_id, description, quantity, 
          unit_price, tax_rate, tax_amount, subtotal, total_amount
        ) VALUES (
          ${orderId},
          ${productId},
          ${productName},
          ${5},
          ${productPrice},
          ${10},
          ${order.taxAmount},
          ${order.subtotal},
          ${order.totalAmount}
        )
      `);
    }
    
    // Create sample quotations
    const quotationData = [
      {
        userId,
        contactId,
        quotationNumber: 'QUO-2023-0001',
        issueDate: '2023-04-15',
        subtotal: 800,
        taxAmount: 80,
        totalAmount: 880,
        status: 'sent',
        category: 'Hardware'
      },
      {
        userId,
        contactId,
        quotationNumber: 'QUO-2023-0002',
        issueDate: '2023-05-10',
        subtotal: 450,
        taxAmount: 45,
        totalAmount: 495,
        status: 'draft',
        category: 'Software'
      },
      {
        userId,
        contactId,
        quotationNumber: 'QUO-2023-0003',
        issueDate: '2023-06-05',
        subtotal: 1200,
        taxAmount: 120,
        totalAmount: 1320,
        status: 'sent',
        category: 'Services'
      }
    ];
    
    for (const quotation of quotationData) {
      // Insert quotation
      const [result] = await db.execute(sql`
        INSERT INTO quotations (
          user_id, contact_id, quotation_number, issue_date, 
          subtotal, tax_amount, total_amount, status, category
        ) VALUES (
          ${quotation.userId}, 
          ${quotation.contactId}, 
          ${quotation.quotationNumber}, 
          ${quotation.issueDate}, 
          ${quotation.subtotal}, 
          ${quotation.taxAmount}, 
          ${quotation.totalAmount}, 
          ${quotation.status}, 
          ${quotation.category}
        ) RETURNING id
      `);
      
      const quotationId = result.rows[0].id;
      
      // Insert quotation items
      await db.execute(sql`
        INSERT INTO quotation_items (
          quotation_id, product_id, description, quantity, 
          unit_price, tax_rate, tax_amount, subtotal, total_amount
        ) VALUES (
          ${quotationId},
          ${productId},
          ${productName},
          ${8},
          ${productPrice},
          ${10},
          ${quotation.taxAmount},
          ${quotation.subtotal},
          ${quotation.totalAmount}
        )
      `);
    }
    
    console.log('Sample sales data added successfully');
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