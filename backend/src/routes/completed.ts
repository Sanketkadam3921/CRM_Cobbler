import { Router } from 'express';
import { CompletedController } from '../controllers/CompletedController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/completed/enquiries - Get all completed enquiries
router.get('/enquiries', CompletedController.getCompletedEnquiries);

// GET /api/completed/stats - Get completed statistics
router.get('/stats', CompletedController.getCompletedStats);

// GET /api/completed/enquiries/:id - Get specific completed enquiry by ID
router.get('/enquiries/:id', CompletedController.getCompletedEnquiryById);

export default router;