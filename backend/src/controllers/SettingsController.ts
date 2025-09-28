import { Request, Response } from 'express';
import { SettingsModel, BusinessInfo, StaffMember, SecuritySettings, NotificationSettings } from '../models/SettingsModel';
import { logApi } from '../utils/logger';

export class SettingsController {

    // ============= BUSINESS INFORMATION ENDPOINTS =============

    // GET /api/settings/business - Get business information
    static async getBusinessInfo(req: Request, res: Response): Promise<void> {
        try {
            logApi.request('GET', '/api/settings/business', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const businessInfo = await SettingsModel.getBusinessInfo();

            logApi.response('GET', '/api/settings/business', 200, Date.now());

            res.json({
                success: true,
                data: businessInfo,
                message: businessInfo ? 'Business information retrieved successfully' : 'No business information found'
            });
        } catch (error) {
            logApi.error('GET', '/api/settings/business', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get business information',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // POST /api/settings/business - Save business information
    static async saveBusinessInfo(req: Request, res: Response): Promise<void> {
        try {
            const businessData: BusinessInfo = req.body;

            logApi.request('POST', '/api/settings/business', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            // Validate required fields
            if (!businessData.businessName || !businessData.ownerName || !businessData.phone || !businessData.email || !businessData.address) {
                logApi.error('POST', '/api/settings/business', new Error('Missing required fields'));
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Business name, owner name, phone, email, and address are required'
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(businessData.email)) {
                logApi.error('POST', '/api/settings/business', new Error('Invalid email format'));
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Please enter a valid email address'
                });
                return;
            }

            const savedBusinessInfo = await SettingsModel.saveBusinessInfo(businessData);

            logApi.response('POST', '/api/settings/business', 200, Date.now());

            res.json({
                success: true,
                data: savedBusinessInfo,
                message: 'Business information saved successfully'
            });
        } catch (error) {
            logApi.error('POST', '/api/settings/business', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save business information',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ============= STAFF MANAGEMENT ENDPOINTS =============

    // GET /api/settings/staff - Get all staff members
    static async getAllStaff(req: Request, res: Response): Promise<void> {
        try {
            logApi.request('GET', '/api/settings/staff', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const staff = await SettingsModel.getAllStaff();

            logApi.response('GET', '/api/settings/staff', 200, Date.now());

            res.json({
                success: true,
                data: staff,
                message: 'Staff members retrieved successfully'
            });
        } catch (error) {
            logApi.error('GET', '/api/settings/staff', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get staff members',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // GET /api/settings/staff/:id - Get staff member by ID
    static async getStaffById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const staffId = parseInt(id);

            if (isNaN(staffId)) {
                logApi.error('GET', `/api/settings/staff/${id}`, new Error('Invalid staff ID'));
                res.status(400).json({
                    success: false,
                    error: 'Invalid staff ID',
                    message: 'Staff ID must be a valid number'
                });
                return;
            }

            logApi.request('GET', `/api/settings/staff/${staffId}`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const staff = await SettingsModel.getStaffById(staffId);

            if (!staff) {
                logApi.error('GET', `/api/settings/staff/${staffId}`, new Error('Staff member not found'));
                res.status(404).json({
                    success: false,
                    error: 'Staff member not found',
                    message: `No staff member found with ID ${staffId}`
                });
                return;
            }

            logApi.response('GET', `/api/settings/staff/${staffId}`, 200, Date.now());

            res.json({
                success: true,
                data: staff,
                message: 'Staff member retrieved successfully'
            });
        } catch (error) {
            logApi.error('GET', `/api/settings/staff/${req.params.id}`, error);
            res.status(500).json({
                success: false,
                error: 'Failed to get staff member',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // POST /api/settings/staff - Create new staff member
    static async createStaff(req: Request, res: Response): Promise<void> {
        try {
            const staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'> = req.body;

            logApi.request('POST', '/api/settings/staff', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            // Validate required fields
            if (!staffData.name || !staffData.role || !staffData.email || !staffData.phone) {
                logApi.error('POST', '/api/settings/staff', new Error('Missing required fields'));
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Name, role, email, and phone are required'
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(staffData.email)) {
                logApi.error('POST', '/api/settings/staff', new Error('Invalid email format'));
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Please enter a valid email address'
                });
                return;
            }

            // Set default status if not provided
            if (!staffData.status) {
                staffData.status = 'active';
            }

            const createdStaff = await SettingsModel.createStaff(staffData);

            logApi.response('POST', '/api/settings/staff', 201, Date.now());

            res.status(201).json({
                success: true,
                data: createdStaff,
                message: 'Staff member created successfully'
            });
        } catch (error) {
            logApi.error('POST', '/api/settings/staff', error);

            if (error instanceof Error && error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    error: 'Duplicate email',
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create staff member',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    // PUT /api/settings/staff/:id - Update staff member
    static async updateStaff(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const staffId = parseInt(id);
            const staffData: Partial<StaffMember> = req.body;

            if (isNaN(staffId)) {
                logApi.error('PUT', `/api/settings/staff/${id}`, new Error('Invalid staff ID'));
                res.status(400).json({
                    success: false,
                    error: 'Invalid staff ID',
                    message: 'Staff ID must be a valid number'
                });
                return;
            }

            logApi.request('PUT', `/api/settings/staff/${staffId}`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            // Validate email format if provided
            if (staffData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(staffData.email)) {
                    logApi.error('PUT', `/api/settings/staff/${staffId}`, new Error('Invalid email format'));
                    res.status(400).json({
                        success: false,
                        error: 'Validation error',
                        message: 'Please enter a valid email address'
                    });
                    return;
                }
            }

            const updatedStaff = await SettingsModel.updateStaff(staffId, staffData);

            logApi.response('PUT', `/api/settings/staff/${staffId}`, 200, Date.now());

            res.json({
                success: true,
                data: updatedStaff,
                message: 'Staff member updated successfully'
            });
        } catch (error) {
            logApi.error('PUT', `/api/settings/staff/${req.params.id}`, error);

            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'Staff member not found',
                        message: error.message
                    });
                } else if (error.message.includes('already exists')) {
                    res.status(409).json({
                        success: false,
                        error: 'Duplicate email',
                        message: error.message
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to update staff member',
                        message: error.message
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update staff member',
                    message: 'Unknown error'
                });
            }
        }
    }

    // DELETE /api/settings/staff/:id - Delete staff member
    static async deleteStaff(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const staffId = parseInt(id);

            if (isNaN(staffId)) {
                logApi.error('DELETE', `/api/settings/staff/${id}`, new Error('Invalid staff ID'));
                res.status(400).json({
                    success: false,
                    error: 'Invalid staff ID',
                    message: 'Staff ID must be a valid number'
                });
                return;
            }

            logApi.request('DELETE', `/api/settings/staff/${staffId}`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const deleted = await SettingsModel.deleteStaff(staffId);

            logApi.response('DELETE', `/api/settings/staff/${staffId}`, 200, Date.now());

            res.json({
                success: true,
                data: { deleted },
                message: 'Staff member deleted successfully'
            });
        } catch (error) {
            logApi.error('DELETE', `/api/settings/staff/${req.params.id}`, error);

            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Staff member not found',
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete staff member',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }

    // ============= SECURITY SETTINGS ENDPOINTS =============

    // GET /api/settings/security - Get security settings
    static async getSecuritySettings(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

            logApi.request('GET', '/api/settings/security', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const securitySettings = await SettingsModel.getSecuritySettings(userId);

            logApi.response('GET', '/api/settings/security', 200, Date.now());

            res.json({
                success: true,
                data: securitySettings,
                message: securitySettings ? 'Security settings retrieved successfully' : 'No security settings found'
            });
        } catch (error) {
            logApi.error('GET', '/api/settings/security', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get security settings',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // POST /api/settings/security - Update security settings
    static async updateSecuritySettings(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.userId || null;
            const settings: Partial<SecuritySettings> = req.body;

            logApi.request('POST', '/api/settings/security', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const updatedSettings = await SettingsModel.updateSecuritySettings(userId, settings);

            logApi.response('POST', '/api/settings/security', 200, Date.now());

            res.json({
                success: true,
                data: updatedSettings,
                message: 'Security settings updated successfully'
            });
        } catch (error) {
            logApi.error('POST', '/api/settings/security', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update security settings',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // ============= NOTIFICATION SETTINGS ENDPOINTS =============

    // GET /api/settings/notifications - Get notification settings
    static async getNotificationSettings(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

            logApi.request('GET', '/api/settings/notifications', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const notificationSettings = await SettingsModel.getNotificationSettings(userId);

            logApi.response('GET', '/api/settings/notifications', 200, Date.now());

            res.json({
                success: true,
                data: notificationSettings,
                message: notificationSettings ? 'Notification settings retrieved successfully' : 'No notification settings found'
            });
        } catch (error) {
            logApi.error('GET', '/api/settings/notifications', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get notification settings',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // POST /api/settings/notifications - Update notification settings
    static async updateNotificationSettings(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.userId || null;
            const settings: Partial<NotificationSettings> = req.body;

            logApi.request('POST', '/api/settings/notifications', req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const updatedSettings = await SettingsModel.updateNotificationSettings(userId, settings);

            logApi.response('POST', '/api/settings/notifications', 200, Date.now());

            res.json({
                success: true,
                data: updatedSettings,
                message: 'Notification settings updated successfully'
            });
        } catch (error) {
            logApi.error('POST', '/api/settings/notifications', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notification settings',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}