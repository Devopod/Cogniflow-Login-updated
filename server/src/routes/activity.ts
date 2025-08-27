import { Router, type Request, type Response } from 'express';

const router = Router();

// Recent activity feed stub for Dashboard
// GET /api/activity/recent
router.get('/recent', async (_req: Request, res: Response) => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  res.json([
    { id: 'act-1', module: 'sales', action: 'order_created', title: 'New sales order SO-1042', at: iso(new Date(now.getTime() - 5 * 60 * 1000)) },
    { id: 'act-2', module: 'finance', action: 'invoice_sent', title: 'Invoice INV-203 emailed', at: iso(new Date(now.getTime() - 15 * 60 * 1000)) },
    { id: 'act-3', module: 'inventory', action: 'stock_adjusted', title: 'Adjusted stock for SKU-ACME-1', at: iso(new Date(now.getTime() - 30 * 60 * 1000)) },
    { id: 'act-4', module: 'hr', action: 'leave_request', title: 'New leave request submitted', at: iso(new Date(now.getTime() - 45 * 60 * 1000)) },
  ]);
});

export default router;


