import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all report routes
router.use(authenticateToken);

/* ---------- REPORT DATA ENDPOINTS ---------- */

// GET /api/reports/data - Get comprehensive report data for dashboard
// Query params: period (week|month|quarter|year)
router.get('/data', ReportController.getReportData);

// GET /api/reports/metrics - Get key business metrics only
// Query params: period (week|month|quarter|year)
router.get('/metrics', ReportController.getMetrics);

// GET /api/reports/revenue-chart - Get revenue trend chart data
// Query params: period (week|month|quarter|year)
router.get('/revenue-chart', ReportController.getRevenueChartData);

// GET /api/reports/export-data - Get comprehensive data for PDF export
// Query params: period (week|month|quarter|year)
router.get('/export-data', ReportController.getExportData);

// GET /api/reports/custom - Get report data for custom date range
// Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
router.get('/custom', ReportController.getCustomReport);

export default router;