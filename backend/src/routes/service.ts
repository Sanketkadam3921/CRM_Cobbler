import { Router } from 'express';
import { ServiceController } from '../controllers/ServiceController';

const router = Router();

// Get all service stage enquiries
router.get('/enquiries', ServiceController.getServiceEnquiries);

// Get service statistics
router.get('/stats', ServiceController.getServiceStats);

// Get specific enquiry service details
router.get('/enquiries/:enquiryId', ServiceController.getEnquiryServiceDetails);

// Assign services to an enquiry
router.post('/enquiries/:enquiryId/assign', ServiceController.assignServices);

// Start a service
router.post('/enquiries/:enquiryId/start', ServiceController.startService);

// Complete a service
router.post('/enquiries/:enquiryId/complete', ServiceController.completeService);

// Save final overall photo
router.post('/enquiries/:enquiryId/final-photo', ServiceController.saveFinalPhoto);

// Complete workflow and move to billing
router.post('/enquiries/:enquiryId/complete-workflow', ServiceController.completeWorkflow);

export default router;