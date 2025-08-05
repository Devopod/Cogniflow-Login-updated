import { db } from '../db';
import * as schema from '../../shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running migration: add-purchase-sample-data');
  
  try {
    // Get existing user and company for sample data
    const users = await db.select().from(schema.users).limit(1);
    if (users.length === 0) {
      console.log('No users found, skipping purchase sample data');
      return;
    }
    
    const userId = users[0].id;
    
    // Get or create departments
    const departments = await db.select().from(schema.departments).where(sql`user_id = ${userId}`);
    let departmentIds: number[] = [];
    
    if (departments.length === 0) {
      const newDepartments = await db.insert(schema.departments).values([
        { userId, name: "IT Department", code: "IT", description: "Information Technology" },
        { userId, name: "Operations", code: "OPS", description: "Operations Department" },
        { userId, name: "Marketing", code: "MKT", description: "Marketing Department" }
      ]).returning();
      departmentIds = newDepartments.map(d => d.id);
    } else {
      departmentIds = departments.map(d => d.id);
    }
    
    // Add sample suppliers
    const suppliers = await db.insert(schema.suppliers).values([
      {
        userId,
        name: "TechPro Solutions",
        contactPerson: "Sarah Johnson",
        email: "sarah@techpro.com",
        phone: "+1-555-0123",
        address: "123 Technology Street",
        city: "San Francisco",
        state: "California",
        country: "USA",
        postalCode: "94102",
        paymentTerms: "Net 30",
        creditLimit: 50000,
        taxId: "TAX123456",
        status: "active"
      },
      {
        userId,
        name: "Office Supplies Plus",
        contactPerson: "Mike Chen",
        email: "mike@officesupplies.com",
        phone: "+1-555-0456",
        address: "456 Business Avenue",
        city: "New York",
        state: "New York",
        country: "USA",
        postalCode: "10001",
        paymentTerms: "Net 15",
        creditLimit: 25000,
        taxId: "TAX789012",
        status: "active"
      },
      {
        userId,
        name: "Industrial Equipment Corp",
        contactPerson: "Lisa Rodriguez",
        email: "lisa@industrial-equip.com",
        phone: "+1-555-0789",
        address: "789 Industrial Blvd",
        city: "Chicago",
        state: "Illinois",
        country: "USA",
        postalCode: "60601",
        paymentTerms: "Net 45",
        creditLimit: 100000,
        taxId: "TAX345678",
        status: "active"
      },
      {
        userId,
        name: "Green Energy Solutions",
        contactPerson: "David Park",
        email: "david@greenenergy.com",
        phone: "+1-555-0321",
        address: "321 Renewable Way",
        city: "Austin",
        state: "Texas",
        country: "USA",
        postalCode: "73301",
        paymentTerms: "Net 30",
        creditLimit: 75000,
        taxId: "TAX567890",
        status: "active"
      }
    ]).onConflictDoNothing().returning();
    
    // Add sample products first (or get existing ones)
    let products = await db.select().from(schema.products).where(sql`user_id = ${userId}`).limit(4);
    
    if (products.length === 0) {
      products = await db.insert(schema.products).values([
        {
          userId,
          name: "Dell Laptop",
          sku: "DELL-LAP-001",
          description: "Dell Inspiron 15 Business Laptop",
          category: "Electronics",
          price: 899.99,
          costPrice: 650.00,
          stockQuantity: 50,
          reorderPoint: 10,
          unit: "piece"
        },
        {
          userId,
          name: "Office Chair",
          sku: "CHAIR-ERG-001",
          description: "Ergonomic Office Chair with Lumbar Support",
          category: "Furniture",
          price: 249.99,
          costPrice: 150.00,
          stockQuantity: 25,
          reorderPoint: 5,
          unit: "piece"
        },
        {
          userId,
          name: "A4 Paper",
          sku: "PAPER-A4-001",
          description: "Premium A4 Printing Paper - 500 sheets",
          category: "Office Supplies",
          price: 12.99,
          costPrice: 8.00,
          stockQuantity: 200,
          reorderPoint: 50,
          unit: "ream"
        },
        {
          userId,
          name: "Industrial Printer",
          sku: "PRINT-IND-001",
          description: "High-Speed Industrial Laser Printer",
          category: "Equipment",
          price: 2499.99,
          costPrice: 1800.00,
          stockQuantity: 5,
          reorderPoint: 2,
          unit: "piece"
        }
      ]).onConflictDoNothing().returning();
    }
    
    // Add sample purchase requests
    const purchaseRequests = await db.insert(schema.purchaseRequests).values([
      {
        userId,
        departmentId: departmentIds[0] || null,
        requestNumber: "PR-2024-001",
        requestedBy: userId,
        requestDate: new Date('2024-01-15'),
        requiredDate: new Date('2024-02-01'),
        priority: "high",
        status: "approved",
        justification: "New employee equipment setup",
        totalAmount: 2699.97,
        currency: "USD",
        approvedBy: userId,
        approvalDate: new Date('2024-01-16'),
        approvedAmount: 2699.97
      },
      {
        userId,
        departmentId: departmentIds[1] || null,
        requestNumber: "PR-2024-002",
        requestedBy: userId,
        requestDate: new Date('2024-01-20'),
        requiredDate: new Date('2024-02-15'),
        priority: "medium",
        status: "pending",
        justification: "Office furniture replacement",
        totalAmount: 1249.95,
        currency: "USD"
      },
      {
        userId,
        departmentId: departmentIds[2] || null,
        requestNumber: "PR-2024-003",
        requestedBy: userId,
        requestDate: new Date('2024-01-25'),
        requiredDate: new Date('2024-02-10'),
        priority: "low",
        status: "approved",
        justification: "Marketing materials printing",
        totalAmount: 2499.99,
        currency: "USD",
        approvedBy: userId,
        approvalDate: new Date('2024-01-26'),
        approvedAmount: 2499.99
      }
    ]).returning();
    
    // Add purchase request items (only if we have valid data)
    if (purchaseRequests.length >= 3 && products.length >= 4) {
      await db.insert(schema.purchaseRequestItems).values([
        // Items for PR-2024-001
        {
          purchaseRequestId: purchaseRequests[0].id,
          productId: products[0].id,
          description: "Dell Laptop for new employee",
          quantity: 3,
          unitPrice: 899.99,
          totalAmount: 2699.97
        },
        // Items for PR-2024-002
        {
          purchaseRequestId: purchaseRequests[1].id,
          productId: products[1].id,
          description: "Ergonomic office chairs",
          quantity: 5,
          unitPrice: 249.99,
          totalAmount: 1249.95
        },
        // Items for PR-2024-003
        {
          purchaseRequestId: purchaseRequests[2].id,
          productId: products[3].id,
          description: "Industrial printer for marketing",
          quantity: 1,
          unitPrice: 2499.99,
          totalAmount: 2499.99
        }
      ]);
    }
    
    // Add sample purchase orders (only if we have valid data)
    let purchaseOrders = [];
    if (suppliers.length >= 3 && purchaseRequests.length >= 3) {
      purchaseOrders = await db.insert(schema.purchaseOrders).values([
        {
          userId,
          supplierId: suppliers[0].id,
          purchaseRequestId: purchaseRequests[0].id,
          orderNumber: "PO-2024-001",
          orderDate: new Date('2024-01-17'),
          expectedDeliveryDate: new Date('2024-02-01'),
          status: "sent_to_supplier",
          subtotal: 2699.97,
          taxAmount: 216.00,
          discountAmount: 0,
          shippingCost: 50.00,
          totalAmount: 2965.97,
          currency: "USD",
          paymentTerms: "Net 30",
          deliveryAddress: "123 Main Street, San Francisco, CA 94102",
          createdBy: userId,
          approvedBy: userId,
          approvalDate: new Date('2024-01-17')
        },
        {
          userId,
          supplierId: suppliers[1].id,
          orderNumber: "PO-2024-002",
          orderDate: new Date('2024-01-20'),
          expectedDeliveryDate: new Date('2024-02-05'),
          status: "delivered",
          subtotal: 1249.95,
          taxAmount: 100.00,
          discountAmount: 50.00,
          shippingCost: 25.00,
          totalAmount: 1324.95,
          currency: "USD",
          paymentTerms: "Net 15",
          deliveryAddress: "123 Main Street, San Francisco, CA 94102",
          createdBy: userId,
          approvedBy: userId,
          approvalDate: new Date('2024-01-20'),
          actualDeliveryDate: new Date('2024-02-03')
        },
        {
          userId,
          supplierId: suppliers[2].id,
          purchaseRequestId: purchaseRequests[2].id,
          orderNumber: "PO-2024-003",
          orderDate: new Date('2024-01-28'),
          expectedDeliveryDate: new Date('2024-02-12'),
          status: "pending",
          subtotal: 2499.99,
          taxAmount: 200.00,
          discountAmount: 100.00,
          shippingCost: 75.00,
          totalAmount: 2674.99,
          currency: "USD",
          paymentTerms: "Net 45",
          deliveryAddress: "123 Main Street, San Francisco, CA 94102",
          createdBy: userId
        }
      ]).returning();
    }
    
    // Add purchase order items (only if we have valid data)
    if (purchaseOrders.length >= 3 && products.length >= 4) {
      await db.insert(schema.purchaseOrderItems).values([
        // Items for PO-2024-001
        {
          purchaseOrderId: purchaseOrders[0].id,
          productId: products[0].id,
          description: "Dell Inspiron 15 Business Laptop",
          quantity: 3,
          unitPrice: 899.99,
          taxRate: 8.0,
          taxAmount: 216.00,
          total: 2699.97,
          receivedQuantity: 0
        },
        // Items for PO-2024-002
        {
          purchaseOrderId: purchaseOrders[1].id,
          productId: products[1].id,
          description: "Ergonomic Office Chair with Lumbar Support",
          quantity: 5,
          unitPrice: 249.99,
          taxRate: 8.0,
          taxAmount: 100.00,
          total: 1249.95,
          receivedQuantity: 5
        },
        // Items for PO-2024-003
        {
          purchaseOrderId: purchaseOrders[2].id,
          productId: products[3].id,
          description: "High-Speed Industrial Laser Printer",
          quantity: 1,
          unitPrice: 2499.99,
          taxRate: 8.0,
          taxAmount: 200.00,
          total: 2499.99,
          receivedQuantity: 0
        }
      ]);
    }
    
    console.log('Purchase sample data migration completed successfully');
    console.log(`Added:
    - ${suppliers.length} suppliers
    - ${products.length} products
    - ${purchaseRequests.length} purchase requests
    - ${purchaseOrders.length} purchase orders`);
    
  } catch (error) {
    console.error('Purchase sample data migration failed:', error);
    throw error;
  }
}

export { main as up };

// Direct execution
main().then(() => {
  console.log('Purchase sample data migration completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Purchase sample data migration failed:', error);
  process.exit(1);
});