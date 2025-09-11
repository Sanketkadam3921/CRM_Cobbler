import { Router } from 'express';
import { BillingController } from '../controllers/BillingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/billing/stats - Get billing statistics
router.get('/stats', BillingController.getBillingStats);

// GET /api/billing/enquiries - Get all billing stage enquiries
router.get('/enquiries', BillingController.getBillingEnquiries);

// GET /api/billing/enquiries/:id - Get specific billing enquiry
router.get('/enquiries/:id', BillingController.getBillingEnquiry);

// POST /api/billing/enquiries/:id/billing - Create/save billing details
router.post('/enquiries/:id/billing', BillingController.createBilling);

// GET /api/billing/enquiries/:id/invoice - Get invoice data
router.get('/enquiries/:id/invoice', BillingController.getInvoice);

// PATCH /api/billing/enquiries/:id/move-to-delivery - Move to delivery stage
router.patch('/enquiries/:id/move-to-delivery', BillingController.moveToDelivery);

export default router;