import { Router } from "express";
import { db } from "../../db";
import { 
  invoices, 
  payments, 
  products, 
  contacts,
  orders,
  accounts,
  transactions,
  financialReports,
  users,
  companies
} from "@shared/schema";
import { eq, and, sql, desc, asc, gt, lt, gte, lte, between, count, sum } from "drizzle-orm";
import { authenticateUser } from "../middleware/auth";
import { WSService } from "../../websocket";

// Get the WebSocket service instance
let wsService: WSService;
export const setWSService = (ws: WSService) => {
  wsService = ws;
};

const router = Router();

// Get dashboard analytics data with filters (date range, currency)
router.get("/dashboard", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, currency } = req.query as { startDate?: string; endDate?: string; currency?: string };
    const now = new Date();
    const from = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = endDate ? new Date(endDate) : now;
    
    // Get sales metrics
    const salesMetrics = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        totalInvoices: sql<number>`COUNT(*)`,
        paidInvoices: sql<number>`COUNT(CASE WHEN ${invoices.payment_status} = 'Paid' THEN 1 END)`,
        overdueInvoices: sql<number>`COUNT(CASE WHEN ${invoices.payment_status} = 'Overdue' THEN 1 END)`,
      })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), between(invoices.createdAt, from, to)));

    // Get payment metrics
    const paymentMetrics = await db
      .select({
        totalPayments: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        successfulPayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'completed' THEN 1 END)`,
        failedPayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'failed' THEN 1 END)`,
      })
      .from(payments)
      .where(and(eq(payments.userId, userId), between(payments.paymentDate, from, to)));

    // Get top products
    const topProducts = await db
      .select({
        productName: products.name,
        totalSales: sql<number>`COALESCE(SUM(invoice_items.quantity), 0)`,
        totalRevenue: sql<number>`COALESCE(SUM(invoice_items.totalAmount), 0)`,
      })
      .from(products)
      .leftJoin(sql`invoice_items`, sql`invoice_items.product_id = ${products.id}`)
      .leftJoin(invoices, sql`invoices.id = invoice_items.invoice_id`)
      .where(and(eq(products.userId, userId), between(invoices.createdAt, from, to)))
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`total_revenue`))
      .limit(5);

    // Get monthly revenue trend
    const monthlyTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.createdAt}, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), gte(invoices.createdAt, new Date(now.getFullYear() - 1, now.getMonth(), 1))))
      .groupBy(sql`TO_CHAR(${invoices.createdAt}, 'YYYY-MM')`)
      .orderBy(asc(sql`TO_CHAR(${invoices.createdAt}, 'YYYY-MM')`));

    const response = {
      salesMetrics: salesMetrics[0] || {
        totalRevenue: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
      },
      paymentMetrics: paymentMetrics[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
      },
      topProducts: topProducts,
      monthlyTrend: monthlyTrend,
      generatedAt: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ message: "Failed to fetch dashboard analytics" });
  }
});

// Get sales reports
router.get("/sales", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      startDate,
      endDate,
      groupBy = 'day',
      contactId,
      status
    } = req.query;

    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = between(invoices.createdAt, new Date(startDate as string), new Date(endDate as string));
    }

    let conditions = [
      eq(invoices.userId, userId),
      dateFilter
    ];

    if (contactId) {
      conditions.push(eq(invoices.contactId, parseInt(contactId as string)));
    }

    if (status) {
      conditions.push(eq(invoices.payment_status, status as string));
    }

    // Sales overview
    const salesOverview = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        totalInvoices: sql<number>`COUNT(*)`,
        averageInvoiceValue: sql<number>`COALESCE(AVG(${invoices.totalAmount}), 0)`,
        paidAmount: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
      })
      .from(invoices)
      .where(and(...conditions));

    // Sales by time period
    let timeGroupFormat = 'YYYY-MM-DD';
    if (groupBy === 'week') timeGroupFormat = 'IYYY-IW';
    if (groupBy === 'month') timeGroupFormat = 'YYYY-MM';
    if (groupBy === 'year') timeGroupFormat = 'YYYY';

    const salesByPeriod = await db
      .select({
        period: sql<string>`TO_CHAR(${invoices.createdAt}, '${sql.raw(timeGroupFormat)}')`,
        revenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
        paidAmount: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
      })
      .from(invoices)
      .where(and(...conditions))
      .groupBy(sql`TO_CHAR(${invoices.createdAt}, '${sql.raw(timeGroupFormat)}')`)
      .orderBy(asc(sql`TO_CHAR(${invoices.createdAt}, '${sql.raw(timeGroupFormat)}')`));

    // Top customers by revenue
    const topCustomers = await db
      .select({
        customerId: contacts.id,
        customerName: sql<string>`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
        customerEmail: contacts.email,
        totalRevenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        totalInvoices: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.contactId, contacts.id))
      .where(and(...conditions))
      .groupBy(contacts.id, contacts.firstName, contacts.lastName, contacts.email)
      .orderBy(desc(sql`COALESCE(SUM(${invoices.totalAmount}), 0)`))
      .limit(10);

    res.json({
      overview: salesOverview[0],
      salesByPeriod,
      topCustomers,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching sales reports:", error);
    res.status(500).json({ message: "Failed to fetch sales reports" });
  }
});

// Get payment reports
router.get("/payments", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      startDate,
      endDate,
      groupBy = 'day',
      gateway,
      status
    } = req.query;

    let dateFilter = sql`1=1`;
    if (startDate && endDate) {
      dateFilter = between(payments.paymentDate, new Date(startDate as string), new Date(endDate as string));
    }

    let conditions = [
      eq(payments.userId, userId),
      dateFilter
    ];

    if (gateway) {
      conditions.push(eq(payments.payment_gateway, gateway as string));
    }

    if (status) {
      conditions.push(eq(payments.status, status as string));
    }

    // Payment overview
    const paymentOverview = await db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        totalPayments: sql<number>`COUNT(*)`,
        successfulPayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'completed' THEN 1 END)`,
        failedPayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'failed' THEN 1 END)`,
        successRate: sql<number>`CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN ${payments.status} = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2) ELSE 0 END`,
        averageAmount: sql<number>`COALESCE(AVG(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(and(...conditions));

    // Payments by gateway
    const paymentsByGateway = await db
      .select({
        gateway: payments.payment_gateway,
        totalAmount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        totalPayments: sql<number>`COUNT(*)`,
        successRate: sql<number>`CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN ${payments.status} = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2) ELSE 0 END`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(payments.payment_gateway)
      .orderBy(desc(sql`COALESCE(SUM(${payments.amount}), 0)`));

    // Payments by method
    const paymentsByMethod = await db
      .select({
        method: payments.payment_method,
        totalAmount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        totalPayments: sql<number>`COUNT(*)`,
        percentage: sql<number>`ROUND((COALESCE(SUM(${payments.amount}), 0) * 100.0 / (SELECT COALESCE(SUM(amount), 1) FROM payments WHERE user_id = ${userId})), 2)`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(payments.payment_method)
      .orderBy(desc(sql`COALESCE(SUM(${payments.amount}), 0)`));

    // Daily payment trends
    let timeGroupFormat = 'YYYY-MM-DD';
    if (groupBy === 'week') timeGroupFormat = 'IYYY-IW';
    if (groupBy === 'month') timeGroupFormat = 'YYYY-MM';

    const paymentTrends = await db
      .select({
        period: sql<string>`TO_CHAR(${payments.paymentDate}, '${sql.raw(timeGroupFormat)}')`,
        totalAmount: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        totalPayments: sql<number>`COUNT(*)`,
        successfulPayments: sql<number>`COUNT(CASE WHEN ${payments.status} = 'completed' THEN 1 END)`,
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(sql`TO_CHAR(${payments.paymentDate}, '${sql.raw(timeGroupFormat)}')`)
      .orderBy(asc(sql`TO_CHAR(${payments.paymentDate}, '${sql.raw(timeGroupFormat)}')`));

    res.json({
      overview: paymentOverview[0],
      paymentsByGateway,
      paymentsByMethod,
      paymentTrends,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching payment reports:", error);
    res.status(500).json({ message: "Failed to fetch payment reports" });
  }
});

// Get financial reports
router.get("/financial", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      startDate,
      endDate,
      reportType = 'profit_loss'
    } = req.query;

    const dateFrom = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = endDate ? new Date(endDate as string) : new Date();

    if (reportType === 'profit_loss') {
      // Profit & Loss Report
      const revenue = await db
        .select({
          total: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.userId, userId),
            between(invoices.createdAt, dateFrom, dateTo),
            eq(invoices.payment_status, 'Paid')
          )
        );

      const expenses = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            between(transactions.transactionDate, dateFrom, dateTo),
            eq(transactions.type, 'debit'),
            eq(transactions.category, 'expense')
          )
        );

      const revenueTotal = revenue[0]?.total || 0;
      const expenseTotal = expenses[0]?.total || 0;
      const netProfit = revenueTotal - expenseTotal;

      res.json({
        reportType: 'profit_loss',
        period: { from: dateFrom, to: dateTo },
        data: {
          revenue: revenueTotal,
          expenses: expenseTotal,
          netProfit,
          profitMargin: revenueTotal > 0 ? ((netProfit / revenueTotal) * 100).toFixed(2) : 0,
        },
        generatedAt: new Date().toISOString(),
      });
    } else if (reportType === 'cash_flow') {
      // Cash Flow Report
      const inflows = await db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.userId, userId),
            between(payments.paymentDate, dateFrom, dateTo),
            eq(payments.status, 'completed')
          )
        );

      const outflows = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            between(transactions.transactionDate, dateFrom, dateTo),
            eq(transactions.type, 'debit')
          )
        );

      const inflowTotal = inflows[0]?.total || 0;
      const outflowTotal = outflows[0]?.total || 0;
      const netCashFlow = inflowTotal - outflowTotal;

      res.json({
        reportType: 'cash_flow',
        period: { from: dateFrom, to: dateTo },
        data: {
          inflows: inflowTotal,
          outflows: outflowTotal,
          netCashFlow,
        },
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    res.status(500).json({ message: "Failed to fetch financial reports" });
  }
});

// Get all available reports
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get saved reports
    const savedReports = await db
      .select()
      .from(financialReports)
      .where(eq(financialReports.userId, userId))
      .orderBy(desc(financialReports.generatedAt));

    // Available report templates
    const templates = [
      {
        id: 'sales_summary',
        name: 'Sales Summary',
        description: 'Overview of sales performance and revenue trends',
        category: 'Sales',
        complexity: 'Simple'
      },
      {
        id: 'payment_analysis',
        name: 'Payment Analysis',
        description: 'Payment gateway performance and transaction metrics',
        category: 'Finance',
        complexity: 'Medium'
      },
      {
        id: 'profit_loss',
        name: 'Profit & Loss Statement',
        description: 'Revenue, expenses, and profit analysis',
        category: 'Finance',
        complexity: 'Complex'
      },
      {
        id: 'cash_flow',
        name: 'Cash Flow Report',
        description: 'Cash inflows and outflows analysis',
        category: 'Finance',
        complexity: 'Complex'
      },
      {
        id: 'customer_analysis',
        name: 'Customer Analysis',
        description: 'Top customers and sales performance by customer',
        category: 'CRM',
        complexity: 'Medium'
      }
    ];

    // Report categories with counts
    const categories = [
      { name: 'Sales', count: 2 },
      { name: 'Finance', count: 3 },
      { name: 'CRM', count: 1 },
      { name: 'Inventory', count: 0 },
      { name: 'HR', count: 0 }
    ];

    res.json({
      savedReports,
      templates,
      categories,
      stats: {
        totalReports: savedReports.length,
        generatedThisMonth: savedReports.filter(r => {
          const reportDate = new Date(r.generatedAt);
          const now = new Date();
          return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
        }).length
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// Generate and save a report
router.post("/generate", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { reportType, name, parameters } = req.body;

    // Generate report data based on type
    let reportData = {};
    
    if (reportType === 'sales_summary') {
      // Generate sales summary data
      const salesData = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
          totalInvoices: sql<number>`COUNT(*)`,
          paidInvoices: sql<number>`COUNT(CASE WHEN ${invoices.payment_status} = 'Paid' THEN 1 END)`,
        })
        .from(invoices)
        .where(eq(invoices.userId, userId));
      
      reportData = salesData[0];
    }

    // Save the report
    const [savedReport] = await db
      .insert(financialReports)
      .values({
        userId,
        reportType,
        name,
        parameters: parameters || {},
        reportData,
        generatedBy: userId,
        generatedAt: new Date(),
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Notify via WebSocket
    if (wsService) {
      wsService.broadcastToResource('reports', 'all', 'report_generated', {
        report: savedReport
      });
      
      // Also broadcast to dashboard to update report counts
      wsService.broadcastToResource('dashboard', 'all', 'report_generated', {
        reportType: savedReport.reportType,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: "Report generated successfully",
      report: savedReport
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// Get dashboard data for reports management
router.get("/management-dashboard", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get stats
    const totalReports = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(financialReports)
      .where(eq(financialReports.userId, userId));
    
    const reportsThisMonth = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(financialReports)
      .where(
        and(
          eq(financialReports.userId, userId),
          gte(financialReports.generatedAt, thisMonth)
        )
      );

    // Get recent reports with proper format
    const recentReports = await db
      .select({
        id: financialReports.id,
        name: financialReports.name,
        category: sql<string>`CASE 
          WHEN ${financialReports.reportType} LIKE '%sales%' THEN 'Sales'
          WHEN ${financialReports.reportType} LIKE '%payment%' THEN 'Finance' 
          WHEN ${financialReports.reportType} LIKE '%customer%' THEN 'Customer'
          WHEN ${financialReports.reportType} LIKE '%profit%' OR ${financialReports.reportType} LIKE '%cash%' THEN 'Finance'
          ELSE 'General'
        END`,
        lastRun: financialReports.generatedAt,
        format: sql<string>`'PDF'`, // Default format
        status: financialReports.status
      })
      .from(financialReports)
      .where(eq(financialReports.userId, userId))
      .orderBy(desc(financialReports.generatedAt))
      .limit(10);

    // Mock dashboards data (can be extended with real dashboard table later)
    const dashboards = [
      {
        id: 1,
        name: "Executive Dashboard",
        shared: true,
        category: "Executive",
        owner: "System",
        lastViewed: now.toISOString(),
        description: "High-level overview of business performance"
      },
      {
        id: 2,
        name: "Sales Performance",
        shared: true,
        category: "Sales",
        owner: "System", 
        lastViewed: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        description: "Sales metrics and pipeline analysis"
      },
      {
        id: 3,
        name: "Finance Overview",
        shared: false,
        category: "Finance",
        owner: "System",
        lastViewed: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        description: "Financial performance and forecasting"
      }
    ];

    // Mock scheduled reports (can be extended with real scheduling table later)
    const scheduled = [
      {
        id: 1,
        name: "Weekly Sales Summary",
        schedule: "Weekly",
        frequency: "Weekly",
        day: "Monday", 
        time: "08:00 AM",
        recipients: ["sales@company.com", "manager@company.com"],
        status: "Active",
        nextRun: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastRun: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        name: "Monthly Financial Report",
        schedule: "Monthly",
        frequency: "Monthly",
        day: "1st",
        time: "09:00 AM", 
        recipients: ["finance@company.com"],
        status: "Active",
        nextRun: new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0).toISOString(),
        lastRun: new Date(now.getFullYear(), now.getMonth(), 1, 9, 0, 0).toISOString()
      }
    ];

    // Available report templates
    const templates = [
      {
        id: 1,
        name: "Sales Performance Template",
        category: "Sales",
        description: "Standard monthly sales performance report template"
      },
      {
        id: 2,
        name: "Financial Summary Template", 
        category: "Finance",
        description: "Quarterly financial summary template"
      },
      {
        id: 3,
        name: "Customer Analysis Template",
        category: "Customer", 
        description: "Customer behavior and sales analysis"
      },
      {
        id: 4,
        name: "Inventory Report Template",
        category: "Inventory",
        description: "Stock levels and inventory movement analysis"
      }
    ];

    res.json({
      stats: {
        totalReports: totalReports[0]?.count || 0,
        totalDashboards: dashboards.length,
        reportsRunThisMonth: reportsThisMonth[0]?.count || 0
      },
      recentReports,
      dashboards,
      scheduled,
      templates
    });
  } catch (error) {
    console.error("Error fetching management dashboard:", error);
    res.status(500).json({ message: "Failed to fetch management dashboard" });
  }
});

// Get all saved reports with categories
router.get("/all-reports", authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get all saved reports
    const savedReports = await db
      .select({
        id: financialReports.id,
        name: financialReports.name,
        category: sql<string>`CASE 
          WHEN ${financialReports.reportType} LIKE '%sales%' THEN 'Sales'
          WHEN ${financialReports.reportType} LIKE '%payment%' THEN 'Finance'
          WHEN ${financialReports.reportType} LIKE '%customer%' THEN 'CRM'
          WHEN ${financialReports.reportType} LIKE '%profit%' OR ${financialReports.reportType} LIKE '%cash%' THEN 'Finance'
          ELSE 'General'
        END`,
        createdAt: financialReports.generatedAt,
        reportType: financialReports.reportType
      })
      .from(financialReports)
      .where(eq(financialReports.userId, userId))
      .orderBy(desc(financialReports.generatedAt));

    // Calculate categories with counts
    const categoryGroups = savedReports.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categories = [
      { name: "Sales", count: categoryGroups["Sales"] || 0 },
      { name: "Finance", count: categoryGroups["Finance"] || 0 },
      { name: "CRM", count: categoryGroups["CRM"] || 0 },
      { name: "Inventory", count: categoryGroups["Inventory"] || 0 },
      { name: "HR", count: categoryGroups["HR"] || 0 }
    ];

    res.json({
      categories,
      savedReports
    });
  } catch (error) {
    console.error("Error fetching all reports:", error);
    res.status(500).json({ message: "Failed to fetch all reports" });
  }
});

export default router;