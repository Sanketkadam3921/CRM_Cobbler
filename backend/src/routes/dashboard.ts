import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();
router.use(authenticateToken);

/* headline widgets only */
router.get('/counts', DashboardController.getCountWidgets);

/* full dashboard (optional) */
router.get('/', DashboardController.getDashboard);

export default router;