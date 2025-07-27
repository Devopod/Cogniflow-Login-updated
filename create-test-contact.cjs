const { db } = require('./server/db');
const { contacts, invoices } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function createTestContact() {
  try {
    console.log('🔍 Creating test contact...');
    
    // Create a test contact
    const [newContact] = await db.insert(contacts).values({
      userId: 2,
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      address: '123 Test St, Test City, TC 12345',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('✅ Created test contact:', newContact);
    
    // Update invoice 17 to have this contact
    console.log('🔧 Updating invoice 17...');
    
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        contactId: newContact.id,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, 17))
      .returning();
    
    console.log('✅ Invoice 17 updated:', updatedInvoice);
    console.log('🎉 Ready for testing! Invoice 17 now has contact ID:', newContact.id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createTestContact(); 