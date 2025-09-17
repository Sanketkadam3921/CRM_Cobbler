import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ============= BUSINESS INFORMATION ROUTES =============

// GET /api/settings/business - Get business information
router.get('/business', SettingsController.getBusinessInfo);

// POST /api/settings/business - Save/update business information
router.post('/business', SettingsController.saveBusinessInfo);

// ============= STAFF MANAGEMENT ROUTES =============

// GET /api/settings/staff - Get all staff members
router.get('/staff', SettingsController.getAllStaff);

// GET /api/settings/staff/:id - Get specific staff member
router.get('/staff/:id', SettingsController.getStaffById);

// POST /api/settings/staff - Create new staff member
router.post('/staff', SettingsController.createStaff);

// PUT /api/settings/staff/:id - Update staff member
router.put('/staff/:id', SettingsController.updateStaff);

// DELETE /api/settings/staff/:id - Delete staff member
router.delete('/staff/:id', SettingsController.deleteStaff);

// ============= SECURITY SETTINGS ROUTES =============

// GET /api/settings/security - Get security settings
router.get('/security', SettingsController.getSecuritySettings);

// POST /api/settings/security - Update security settings
router.post('/security', SettingsController.updateSecuritySettings);

// ============= NOTIFICATION SETTINGS ROUTES =============

// GET /api/settings/notifications - Get notification settings
router.get('/notifications', SettingsController.getNotificationSettings);

// POST /api/settings/notifications - Update notification settings
router.post('/notifications', SettingsController.updateNotificationSettings);

export default router;