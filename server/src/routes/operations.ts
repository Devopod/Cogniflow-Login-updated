import { Router, type Request, type Response } from 'express';

const router = Router();

// Delivery performance metrics stub for Dashboard
// GET /api/operations/delivery-performance
router.get('/delivery-performance', async (_req: Request, res: Response) => {
  // Return monthly series expected by the dashboard chart: { month, onTime, late }
  const now = new Date();
  const months = 6;
  const series = Array.from({ length: months }).map((_, i) => {
    const d = new Date(now);
    d.setMonth(now.getMonth() - (months - 1 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const onTime = 85 + Math.floor(Math.random() * 10); // 85-94%
    const late = 100 - onTime;
    return { month, onTime, late };
  });

  res.json(series);
});

export default router;


