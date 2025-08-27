import { Router, type Request, type Response } from 'express';

const router = Router();

// Global alerts stub for Dashboard
// GET /api/alerts
router.get('/', async (_req: Request, res: Response) => {
  // Provide a small list of actionable alerts
  res.json([
    { id: 'inv-low-1', type: 'inventory', severity: 'high', title: 'Low stock: Widget A', description: 'Stock below reorder point in WH-1', createdAt: new Date().toISOString() },
    { id: 'fin-overdue-1', type: 'finance', severity: 'medium', title: 'Overdue invoice', description: 'INV-1023 is overdue by 5 days', createdAt: new Date().toISOString() },
    { id: 'ops-delay-1', type: 'operations', severity: 'low', title: 'Delivery delays trending up', description: 'Slight increase in average delay this week', createdAt: new Date().toISOString() },
  ]);
});

export default router;


