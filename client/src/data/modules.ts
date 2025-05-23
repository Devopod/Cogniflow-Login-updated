export interface SubModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

export interface Module {
  id: string;
  name: string;
  path: string;
  subModules: SubModule[];
}

export const moduleData: Module[] = [
  {
    id: "sales",
    name: "Sales",
    path: "/sales",
    subModules: [
      {
        id: "sales-quotations",
        name: "Quotations",
        description: "Create and manage sales quotes for your customers.",
        icon: "Sales",
        path: "/sales/quotations",
      },
      {
        id: "sales-orders",
        name: "Sales Orders",
        description: "Manage sales orders and track their status.",
        icon: "Sales",
        path: "/sales/orders",
      },
      {
        id: "sales-invoices",
        name: "Invoices",
        description: "Create and manage invoices for your customers.",
        icon: "Sales",
        path: "/sales/invoices",
      },
      {
        id: "sales-customers",
        name: "Customers",
        description: "Manage your customer information and relationships.",
        icon: "Sales",
        path: "/sales/customers",
      },
      {
        id: "sales-analytics",
        name: "Sales Analytics",
        description: "Get insights on your sales performance.",
        icon: "Sales",
        path: "/sales/analytics",
      },
    ],
  },
  {
    id: "crm",
    name: "CRM",
    path: "/crm",
    subModules: [
      {
        id: "crm-contacts",
        name: "Contacts",
        description: "Manage your business and customer contacts.",
        icon: "CRM",
        path: "/crm/contacts",
      },
      {
        id: "crm-leads",
        name: "Leads",
        description: "Track and manage potential sales opportunities.",
        icon: "CRM",
        path: "/crm/leads",
      },
      {
        id: "crm-opportunities",
        name: "Opportunities",
        description: "Manage qualified leads with high purchase potential.",
        icon: "CRM",
        path: "/crm/opportunities",
      },
      {
        id: "crm-accounts",
        name: "Accounts",
        description: "Manage business entities you deal with.",
        icon: "CRM",
        path: "/crm/accounts",
      },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    path: "/inventory",
    subModules: [
      {
        id: "inventory-items",
        name: "Items",
        description: "Manage your inventory items and products.",
        icon: "Inventory",
        path: "/inventory/items",
      },
      {
        id: "inventory-stock",
        name: "Stock Management",
        description: "Track and manage your product stock levels.",
        icon: "Inventory",
        path: "/inventory/stock",
      },
      {
        id: "inventory-warehouses",
        name: "Warehouses",
        description: "Manage multiple storage locations and warehouses.",
        icon: "Inventory",
        path: "/inventory/warehouses",
      },
      {
        id: "inventory-adjustments",
        name: "Adjustments",
        description: "Adjust stock levels and inventory counts.",
        icon: "Inventory",
        path: "/inventory/adjustments",
      },
      {
        id: "inventory-transfers",
        name: "Transfers",
        description: "Move inventory between warehouses and locations.",
        icon: "Inventory",
        path: "/inventory/transfers",
      },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    path: "/finance",
    subModules: [
      {
        id: "finance-books",
        name: "Books",
        description: "Powerful accounting platform for growing businesses.",
        icon: "Finance",
        path: "/finance/books",
      },
      {
        id: "finance-invoice",
        name: "Invoice",
        description: "100% free invoicing solution for your business.",
        icon: "Finance",
        path: "/finance/invoice",
      },
      {
        id: "finance-expense",
        name: "Expense",
        description: "Online expense reporting platform for tracking expenses.",
        icon: "Finance",
        path: "/finance/expense",
      },
      {
        id: "finance-billing",
        name: "Billing",
        description: "Subscription billing solution for your business.",
        icon: "Finance",
        path: "/finance/billing",
      },
      {
        id: "finance-payroll",
        name: "Payroll",
        description: "Efficient payroll processing software for businesses.",
        icon: "Finance",
        path: "/finance/payroll",
      },
      {
        id: "finance-payment-gateway",
        name: "Payments",
        description: "Unified payment solution built for all businesses.",
        icon: "Finance",
        path: "/finance/payments",
      },
    ],
  },
  {
    id: "purchase",
    name: "Purchase",
    path: "/purchase",
    subModules: [
      {
        id: "purchase-requisitions",
        name: "Requisitions",
        description: "Create and manage purchase requisitions.",
        icon: "Purchase",
        path: "/purchase/requisitions",
      },
      {
        id: "purchase-orders",
        name: "Purchase Orders",
        description: "Create and manage purchase orders.",
        icon: "Purchase",
        path: "/purchase/orders",
      },
      {
        id: "purchase-vendors",
        name: "Vendors",
        description: "Manage your suppliers and vendor relationships.",
        icon: "Purchase",
        path: "/purchase/vendors",
      },
      {
        id: "purchase-bills",
        name: "Bills",
        description: "Manage vendor bills and payments.",
        icon: "Purchase",
        path: "/purchase/bills",
      },
    ],
  },
  {
    id: "hrms",
    name: "HRMS",
    path: "/hrms",
    subModules: [
      {
        id: "hrms-employees",
        name: "Employees",
        description: "Manage employee records and information.",
        icon: "HRMS",
        path: "/hrms/employees",
      },
      {
        id: "hrms-attendance",
        name: "Attendance",
        description: "Track employee attendance and time off.",
        icon: "HRMS",
        path: "/hrms/attendance",
      },
      {
        id: "hrms-leave",
        name: "Leave Management",
        description: "Manage employee leaves and time off requests.",
        icon: "HRMS",
        path: "/hrms/leave",
      },
      {
        id: "hrms-payroll",
        name: "Payroll",
        description: "Process employee salaries and compensation.",
        icon: "HRMS",
        path: "/hrms/payroll",
      },
      {
        id: "hrms-recruitment",
        name: "Recruitment",
        description: "Manage the hiring and recruitment process.",
        icon: "HRMS",
        path: "/hrms/recruitment",
      },
    ],
  },
  {
    id: "payments",
    name: "Payments",
    path: "/payments",
    subModules: [
      {
        id: "payments-checkout",
        name: "Checkout",
        description: "Collect payments online with custom branded pages.",
        icon: "Payments",
        path: "/payments/checkout",
      },
      {
        id: "payments-online",
        name: "Online Payments",
        description: "Accept payments through multiple gateways.",
        icon: "Payments",
        path: "/payments/online",
      },
      {
        id: "payments-mpesa",
        name: "M-PESA Integration",
        description: "Integrate with M-PESA mobile payment service.",
        icon: "Payments",
        path: "/payments/mpesa",
      },
      {
        id: "payments-subscriptions",
        name: "Subscriptions",
        description: "Manage recurring payments and subscriptions.",
        icon: "Payments",
        path: "/payments/subscriptions",
      },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    path: "/reports",
    subModules: [
      {
        id: "reports-sales",
        name: "Sales Reports",
        description: "Comprehensive sales analytics and reporting.",
        icon: "Reports",
        path: "/reports/sales",
      },
      {
        id: "reports-inventory",
        name: "Inventory Reports",
        description: "Track inventory levels, values and movements.",
        icon: "Reports",
        path: "/reports/inventory",
      },
      {
        id: "reports-finance",
        name: "Financial Reports",
        description: "Generate balance sheets, P&L and cash flow statements.",
        icon: "Reports",
        path: "/reports/finance",
      },
      {
        id: "reports-purchase",
        name: "Purchase Reports",
        description: "Track and analyze your procurement operations.",
        icon: "Reports",
        path: "/reports/purchase",
      },
      {
        id: "reports-dashboard",
        name: "Dashboard",
        description: "Get a comprehensive overview of your business.",
        icon: "Reports",
        path: "/reports/dashboard",
      },
    ],
  },
];