import { Router } from 'express';
import { PickupController } from '../controllers/PickupController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/pickup/stats - Get pickup statistics
router.get('/stats', PickupController.getStats);

// GET /api/pickup/enquiries - Get all pickup stage enquiries
router.get('/enquiries', PickupController.getPickupEnquiries);

// GET /api/pickup/enquiries/:id - Get pickup enquiry by ID
router.get('/enquiries/:id', PickupController.getPickupEnquiry);

// PATCH /api/pickup/enquiries/:id/assign - Assign pickup to staff member
router.patch('/enquiries/:id/assign', PickupController.assignPickup);

// PATCH /api/pickup/enquiries/:id/collect - Mark pickup as collected
router.patch('/enquiries/:id/collect', PickupController.markCollected);

// PATCH /api/pickup/enquiries/:id/receive - Mark item as received and move to service
router.patch('/enquiries/:id/receive', PickupController.markReceived);

// PATCH /api/pickup/enquiries/:id/status - Update pickup status
router.patch('/enquiries/:id/status', PickupController.updateStatus);

export default router;