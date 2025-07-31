import { sql } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../../shared/schema";

export async function up() {
  console.log('Running migration: add-comprehensive-erp-data');

  try {
    // Add default company if not exists
    const existingCompanies = await db.select().from(schema.companies).limit(1);
    let companyId = 1;
    
    if (existingCompanies.length === 0) {
      const newCompany = await db.insert(schema.companies).values({
        legalName: "Demo Company Ltd",
        businessType: "Technology",
        email: "demo@company.com",
        phone: "+1234567890",
        industryType: "Software",
        country: "United States",
        currency: "USD",
        timeZone: "America/New_York",
        setupComplete: true,
      }).returning();
      companyId = newCompany[0].id;
    }

    // Add default admin user if not exists
    const existingUsers = await db.select().from(schema.users).limit(1);
    let userId = 1;
    
    if (existingUsers.length === 0) {
      const newUser = await db.insert(schema.users).values({
        email: "admin@company.com",
        username: "admin",
        password: "$2b$10$XYZ123", // This would be properly hashed in real implementation
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        companyId: companyId,
        isActive: true,
        emailVerified: true,
      }).returning();
      userId = newUser[0].id;
    } else {
      userId = existingUsers[0].id;
    }

    // Add departments for HRMS
    await db.insert(schema.departments).values([
      { userId, name: "Engineering", code: "ENG", description: "Software Engineering Department" },
      { userId, name: "Sales", code: "SAL", description: "Sales and Marketing Department" },
      { userId, name: "Human Resources", code: "HR", description: "Human Resources Department" },
      { userId, name: "Finance", code: "FIN", description: "Finance and Accounting Department" },
      { userId, name: "Operations", code: "OPS", description: "Operations Department" },
    ]).onConflictDoNothing();

    // Add positions for HRMS
    const departments = await db.select().from(schema.departments).where(sql`user_id = ${userId}`);
    if (departments.length > 0) {
      await db.insert(schema.positions).values([
        { userId, title: "Software Engineer", departmentId: departments[0].id, minSalary: 70000, maxSalary: 120000 },
        { userId, title: "Senior Software Engineer", departmentId: departments[0].id, minSalary: 90000, maxSalary: 150000, isManagement: true },
        { userId, title: "Sales Representative", departmentId: departments[1].id, minSalary: 45000, maxSalary: 80000 },
        { userId, title: "Sales Manager", departmentId: departments[1].id, minSalary: 70000, maxSalary: 110000, isManagement: true },
        { userId, title: "HR Specialist", departmentId: departments[2].id, minSalary: 50000, maxSalary: 75000 },
        { userId, title: "Accountant", departmentId: departments[3].id, minSalary: 55000, maxSalary: 85000 },
      ]).onConflictDoNothing();
    }

    // Add employees for HRMS
    const positions = await db.select().from(schema.positions).where(sql`user_id = ${userId}`);
    if (positions.length > 0) {
      await db.insert(schema.employees).values([
        {
          userId,
          employeeId: "EMP001",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@company.com",
          phone: "+1234567891",
          hireDate: "2023-01-15",
          departmentId: departments[0].id,
          positionId: positions[0].id,
          status: "active",
          employmentType: "full-time",
        },
        {
          userId,
          employeeId: "EMP002",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@company.com",
          phone: "+1234567892",
          hireDate: "2023-02-01",
          departmentId: departments[1].id,
          positionId: positions[2].id,
          status: "active",
          employmentType: "full-time",
        },
        {
          userId,
          employeeId: "EMP003",
          firstName: "Mike",
          lastName: "Johnson",
          email: "mike.johnson@company.com",
          phone: "+1234567893",
          hireDate: "2023-03-10",
          departmentId: departments[0].id,
          positionId: positions[1].id,
          status: "active",
          employmentType: "full-time",
        },
      ]).onConflictDoNothing();
    }

    // Add leave types for HRMS
    await db.insert(schema.leaveTypes).values([
      { userId, name: "Annual Leave", description: "Yearly vacation days", colorCode: "#3b82f6", defaultDays: 20, isPaid: true },
      { userId, name: "Sick Leave", description: "Medical leave", colorCode: "#ef4444", defaultDays: 10, isPaid: true },
      { userId, name: "Personal Leave", description: "Personal time off", colorCode: "#10b981", defaultDays: 5, isPaid: false },
      { userId, name: "Maternity Leave", description: "Maternity leave", colorCode: "#f59e0b", defaultDays: 90, isPaid: true },
      { userId, name: "Paternity Leave", description: "Paternity leave", colorCode: "#8b5cf6", defaultDays: 14, isPaid: true },
    ]).onConflictDoNothing();

    // Add CRM contacts
    await db.insert(schema.contacts).values([
      {
        userId,
        firstName: "Alice",
        lastName: "Brown",
        email: "alice.brown@acmecorp.com",
        phone: "+1555001001",
        company: "Acme Corporation",
        position: "CEO",
        city: "New York",
        state: "NY",
        country: "USA",
        type: "lead",
        source: "Website",
        status: "active",
      },
      {
        userId,
        firstName: "Bob",
        lastName: "Wilson",
        email: "bob.wilson@techstart.com",
        phone: "+1555001002",
        company: "TechStart Inc",
        position: "CTO",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        type: "customer",
        source: "Referral",
        status: "active",
      },
      {
        userId,
        firstName: "Carol",
        lastName: "Davis",
        email: "carol.davis@innovatetech.com",
        phone: "+1555001003",
        company: "InnovateTech",
        position: "VP Sales",
        city: "Austin",
        state: "TX",
        country: "USA",
        type: "lead",
        source: "Social Media",
        status: "active",
      },
    ]).onConflictDoNothing();

    // Add CRM deals
    const contacts = await db.select().from(schema.contacts).where(sql`user_id = ${userId}`);
    if (contacts.length > 0) {
      await db.insert(schema.deals).values([
        {
          userId,
          contactId: contacts[0].id,
          title: "Enterprise Software License",
          description: "Annual software license for 500 users",
          value: 150000,
          stage: "proposal",
          probability: 75,
          expectedCloseDate: "2024-02-15",
          status: "open",
          source: "Website",
          priority: "high",
        },
        {
          userId,
          contactId: contacts[1].id,
          title: "Custom Development Project",
          description: "Custom web application development",
          value: 85000,
          stage: "negotiation",
          probability: 60,
          expectedCloseDate: "2024-01-30",
          status: "open",
          source: "Referral",
          priority: "medium",
        },
        {
          userId,
          contactId: contacts[2].id,
          title: "Consulting Services",
          description: "IT consulting for digital transformation",
          value: 45000,
          stage: "qualification",
          probability: 40,
          expectedCloseDate: "2024-03-15",
          status: "open",
          source: "Social Media",
          priority: "low",
        },
      ]).onConflictDoNothing();
    }

    // Add warehouses for inventory
    await db.insert(schema.warehouses).values([
      {
        userId,
        name: "Main Warehouse",
        code: "WH001",
        address: "123 Industrial Blvd",
        city: "Chicago",
        state: "IL",
        country: "USA",
        postalCode: "60601",
        contactPerson: "David Manager",
        contactEmail: "david@company.com",
        contactPhone: "+1234567894",
        isActive: true,
      },
      {
        userId,
        name: "East Coast Warehouse",
        code: "WH002",
        address: "456 Storage Ave",
        city: "Atlanta",
        state: "GA",
        country: "USA",
        postalCode: "30301",
        contactPerson: "Sarah Supervisor",
        contactEmail: "sarah@company.com",
        contactPhone: "+1234567895",
        isActive: true,
      },
    ]).onConflictDoNothing();

    // Add products for inventory
    await db.insert(schema.products).values([
      {
        userId,
        name: "Laptop Computer",
        sku: "LAP001",
        barcode: "123456789012",
        description: "High-performance business laptop",
        category: "Electronics",
        subcategory: "Computers",
        price: 1200.00,
        costPrice: 800.00,
        stockQuantity: 50,
        reorderPoint: 10,
        status: "active",
        unit: "piece",
      },
      {
        userId,
        name: "Office Chair",
        sku: "CHR001",
        barcode: "123456789013",
        description: "Ergonomic office chair",
        category: "Furniture",
        subcategory: "Seating",
        price: 350.00,
        costPrice: 200.00,
        stockQuantity: 25,
        reorderPoint: 5,
        status: "active",
        unit: "piece",
      },
      {
        userId,
        name: "Software License",
        sku: "SFT001",
        barcode: "123456789014",
        description: "Annual software license",
        category: "Software",
        subcategory: "Productivity",
        price: 500.00,
        costPrice: 100.00,
        stockQuantity: 100,
        reorderPoint: 20,
        status: "active",
        unit: "license",
      },
    ]).onConflictDoNothing();

    // Add inventory records
    const products = await db.select().from(schema.products).where(sql`user_id = ${userId}`);
    const warehouses = await db.select().from(schema.warehouses).where(sql`user_id = ${userId}`);
    
    if (products.length > 0 && warehouses.length > 0) {
      await db.insert(schema.inventory).values([
        { productId: products[0].id, warehouseId: warehouses[0].id, quantity: 30, location: "A1-01" },
        { productId: products[0].id, warehouseId: warehouses[1].id, quantity: 20, location: "B1-01" },
        { productId: products[1].id, warehouseId: warehouses[0].id, quantity: 15, location: "A2-01" },
        { productId: products[1].id, warehouseId: warehouses[1].id, quantity: 10, location: "B2-01" },
        { productId: products[2].id, warehouseId: warehouses[0].id, quantity: 60, location: "A3-01" },
        { productId: products[2].id, warehouseId: warehouses[1].id, quantity: 40, location: "B3-01" },
      ]).onConflictDoNothing();
    }

    // Add suppliers for purchase management
    await db.insert(schema.suppliers).values([
      {
        userId,
        name: "Tech Supplies Inc",
        contactPerson: "Robert Tech",
        email: "robert@techsupplies.com",
        phone: "+1555002001",
        address: "789 Supply St",
        city: "Dallas",
        state: "TX",
        country: "USA",
        postalCode: "75201",
        paymentTerms: "Net 30",
        status: "active",
      },
      {
        userId,
        name: "Office Furniture Co",
        contactPerson: "Linda Furniture",
        email: "linda@officefurniture.com",
        phone: "+1555002002",
        address: "321 Furniture Ave",
        city: "Phoenix",
        state: "AZ",
        country: "USA",
        postalCode: "85001",
        paymentTerms: "Net 45",
        status: "active",
      },
      {
        userId,
        name: "Software Solutions Ltd",
        contactPerson: "Mark Software",
        email: "mark@softwaresolutions.com",
        phone: "+1555002003",
        address: "654 Code Blvd",
        city: "Seattle",
        state: "WA",
        country: "USA",
        postalCode: "98101",
        paymentTerms: "Net 15",
        status: "active",
      },
    ]).onConflictDoNothing();

    // Add sample purchase requests
    await db.insert(schema.purchaseRequests).values([
      {
        userId,
        requestNumber: "PR001",
        requestDate: new Date(),
        requiredDate: "2024-01-30",
        status: "approved",
        notes: "Urgent requirement for new laptops",
        requestedBy: userId,
        departmentId: departments[0]?.id,
        totalAmount: 12000,
      },
      {
        userId,
        requestNumber: "PR002",
        requestDate: new Date(),
        requiredDate: "2024-02-15",
        status: "pending",
        notes: "Office furniture for new hires",
        requestedBy: userId,
        departmentId: departments[2]?.id,
        totalAmount: 3500,
      },
    ]).onConflictDoNothing();

    // Add accounts for finance
    await db.insert(schema.accounts).values([
      {
        userId,
        name: "Cash",
        accountNumber: "1001",
        accountType: "asset",
        currency: "USD",
        openingBalance: 50000,
        currentBalance: 50000,
        description: "Main cash account",
        isActive: true,
      },
      {
        userId,
        name: "Accounts Receivable",
        accountNumber: "1200",
        accountType: "asset",
        currency: "USD",
        openingBalance: 25000,
        currentBalance: 25000,
        description: "Customer receivables",
        isActive: true,
      },
      {
        userId,
        name: "Revenue",
        accountNumber: "4000",
        accountType: "revenue",
        currency: "USD",
        openingBalance: 0,
        currentBalance: 0,
        description: "Sales revenue",
        isActive: true,
      },
      {
        userId,
        name: "Accounts Payable",
        accountNumber: "2000",
        accountType: "liability",
        currency: "USD",
        openingBalance: 15000,
        currentBalance: 15000,
        description: "Supplier payables",
        isActive: true,
      },
    ]).onConflictDoNothing();

    console.log('Comprehensive ERP data added successfully');
  } catch (error) {
    console.error('Error in comprehensive ERP data migration:', error);
    throw error;
  }
}

export async function down() {
  // This is a data-only migration, so we'll leave the down function empty
  // In a real scenario, you might want to remove the added data
  console.log('Down migration for comprehensive ERP data - no action taken');
}