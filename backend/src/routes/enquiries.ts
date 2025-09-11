import { Router } from 'express';
import { EnquiryController } from '../controllers/EnquiryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/enquiries - Get all enquiries with pagination and filtering
router.get('/', EnquiryController.getAll);

// GET /api/enquiries/stats - Get CRM statistics
router.get('/stats', EnquiryController.getStats);

// GET /api/enquiries/stage/:stage - Get enquiries by stage
router.get('/stage/:stage', EnquiryController.getByStage);

// GET /api/enquiries/:id - Get enquiry by ID
router.get('/:id', EnquiryController.getById);

// POST /api/enquiries - Create new enquiry
router.post('/', EnquiryController.create);

// PUT /api/enquiries/:id - Update enquiry
router.put('/:id', EnquiryController.update);

// DELETE /api/enquiries/:id - Delete enquiry
router.delete('/:id', EnquiryController.delete);

// PATCH /api/enquiries/:id/contact - Mark enquiry as contacted
router.patch('/:id/contact', EnquiryController.markContacted);

// PATCH /api/enquiries/:id/convert - Convert enquiry
router.patch('/:id/convert', EnquiryController.convert);

// PATCH /api/enquiries/:id/stage - Transition enquiry to next stage
router.patch('/:id/stage', EnquiryController.transitionStage);

export default router;
