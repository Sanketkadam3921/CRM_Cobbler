import { Router } from 'express';
import { DeliveryController } from '../controllers/DeliveryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes - following pattern from other modules
router.use(authenticateToken);

// GET /api/delivery/stats - Get delivery statistics
router.get('/stats', DeliveryController.getDeliveryStats);

// GET /api/delivery/enquiries - Get all delivery stage enquiries
router.get('/enquiries', DeliveryController.getDeliveryEnquiries);

// GET /api/delivery/enquiries/:id - Get specific delivery enquiry
router.get('/enquiries/:id', DeliveryController.getDeliveryEnquiry);

// PATCH /api/delivery/enquiries/:id/schedule - Schedule delivery
router.patch('/enquiries/:id/schedule', DeliveryController.scheduleDelivery);

// PATCH /api/delivery/enquiries/:id/out-for-delivery - Mark as out for delivery
router.patch('/enquiries/:id/out-for-delivery', DeliveryController.markOutForDelivery);

// PATCH /api/delivery/enquiries/:id/complete - Complete delivery
router.patch('/enquiries/:id/complete', DeliveryController.completeDelivery);

export default router;