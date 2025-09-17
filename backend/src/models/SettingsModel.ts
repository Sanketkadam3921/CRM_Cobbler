import { executeQuery, executeTransaction } from '../config/database';
import { logDatabase } from '../utils/logger';

// Business Information Interface
export interface BusinessInfo {
  id?: number;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  timezone: string;
  currency: string;
  logo?: string; // Base64 encoded logo
  website?: string;
  tagline?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Staff Member Interface
export interface StaffMember {
  id?: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

// Security Settings Interface
export interface SecuritySettings {
  id?: number;
  userId?: number;
  twoFactorEnabled: boolean;
  passwordLastChanged?: string;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  accountLockoutDuration: number; // in minutes
  createdAt?: string;
  updatedAt?: string;
}

// Notification Settings Interface
export interface NotificationSettings {
  id?: number;
  userId?: number;
  emailAlerts: boolean;
  smsAlerts: boolean;
  lowStockAlerts: boolean;
  orderUpdates: boolean;
  customerApprovals: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class SettingsModel {
  
  // ============= BUSINESS INFORMATION METHODS =============
  
  // Get business information
  static async getBusinessInfo(): Promise<BusinessInfo | null> {
    try {
      logDatabase.query('Getting business information');
      
      const [businessInfo] = await executeQuery<any>(`
        SELECT 
          id,
          business_name as businessName,
          owner_name as ownerName,
          phone,
          email,
          address,
          gst_number as gstNumber,
          timezone,
          currency,
          logo,
          website,
          tagline,
          created_at as createdAt,
          updated_at as updatedAt
        FROM business_info 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (!businessInfo) {
        logDatabase.error('No business information found', new Error('No business information found in database'));
        return null;
      }
      
      logDatabase.success('Business information retrieved successfully');
      return businessInfo;
    } catch (error) {
      logDatabase.error('Failed to get business information', error);
      throw error;
    }
  }

  // Save or update business information
  static async saveBusinessInfo(businessData: BusinessInfo): Promise<BusinessInfo> {
    try {
      logDatabase.query('Saving business information', { businessName: businessData.businessName });
      
      // Check if business info already exists
      const existingInfo = await this.getBusinessInfo();
      
      if (existingInfo) {
        // Update existing business info
        await executeQuery(`
          UPDATE business_info SET
            business_name = ?,
            owner_name = ?,
            phone = ?,
            email = ?,
            address = ?,
            gst_number = ?,
            timezone = ?,
            currency = ?,
            logo = ?,
            website = ?,
            tagline = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          businessData.businessName,
          businessData.ownerName,
          businessData.phone,
          businessData.email,
          businessData.address,
          businessData.gstNumber,
          businessData.timezone,
          businessData.currency,
          businessData.logo || null,
          businessData.website || null,
          businessData.tagline || null,
          existingInfo.id
        ]);
        
        logDatabase.success('Business information updated successfully', { id: existingInfo.id });
        return await this.getBusinessInfo() as BusinessInfo;
      } else {
        // Create new business info
        const result = await executeQuery(`
          INSERT INTO business_info (
            business_name, owner_name, phone, email, address, 
            gst_number, timezone, currency, logo, website, tagline,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          businessData.businessName,
          businessData.ownerName,
          businessData.phone,
          businessData.email,
          businessData.address,
          businessData.gstNumber,
          businessData.timezone,
          businessData.currency,
          businessData.logo || null,
          businessData.website || null,
          businessData.tagline || null
        ]);
        
        const insertId = (result as any).insertId;
        logDatabase.success('Business information created successfully', { id: insertId });
        return await this.getBusinessInfo() as BusinessInfo;
      }
    } catch (error) {
      logDatabase.error('Failed to save business information', error);
      throw error;
    }
  }

  // ============= STAFF MANAGEMENT METHODS =============
  
  // Get all staff members
  static async getAllStaff(): Promise<StaffMember[]> {
    try {
      logDatabase.query('Getting all staff members');
      
      const staff = await executeQuery<any>(`
        SELECT 
          id,
          name,
          role,
          email,
          phone,
          status,
          created_at as createdAt,
          updated_at as updatedAt
        FROM staff_members 
        ORDER BY created_at DESC
      `);
      
      logDatabase.success('Staff members retrieved successfully', { count: staff.length });
      return staff;
    } catch (error) {
      logDatabase.error('Failed to get staff members', error);
      throw error;
    }
  }

  // Get staff member by ID
  static async getStaffById(staffId: number): Promise<StaffMember | null> {
    try {
      logDatabase.query('Getting staff member by ID', { staffId });
      
      const [staff] = await executeQuery<any>(`
        SELECT 
          id,
          name,
          role,
          email,
          phone,
          status,
          created_at as createdAt,
          updated_at as updatedAt
        FROM staff_members 
        WHERE id = ?
      `, [staffId]);
      
      if (!staff) {
        logDatabase.error('Staff member not found', new Error(`Staff member with ID ${staffId} not found`));
        return null;
      }
      
      logDatabase.success('Staff member retrieved successfully', { staffId });
      return staff;
    } catch (error) {
      logDatabase.error('Failed to get staff member', error);
      throw error;
    }
  }

  // Create new staff member
  static async createStaff(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
    try {
      logDatabase.query('Creating new staff member', { name: staffData.name, role: staffData.role });
      
      // Check if email already exists
      const [existingStaff] = await executeQuery<any>(`
        SELECT id FROM staff_members WHERE email = ?
      `, [staffData.email]);
      
      if (existingStaff) {
        throw new Error('Staff member with this email already exists');
      }
      
      const result = await executeQuery(`
        INSERT INTO staff_members (
          name, role, email, phone, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        staffData.name,
        staffData.role,
        staffData.email,
        staffData.phone,
        staffData.status
      ]);
      
      const insertId = (result as any).insertId;
      logDatabase.success('Staff member created successfully', { id: insertId, name: staffData.name });
      
      return await this.getStaffById(insertId) as StaffMember;
    } catch (error) {
      logDatabase.error('Failed to create staff member', error);
      throw error;
    }
  }

  // Update staff member
  static async updateStaff(staffId: number, staffData: Partial<StaffMember>): Promise<StaffMember> {
    try {
      logDatabase.query('Updating staff member', { staffId, updates: Object.keys(staffData) });
      
      // Check if staff exists
      const existingStaff = await this.getStaffById(staffId);
      if (!existingStaff) {
        throw new Error('Staff member not found');
      }
      
      // Check email uniqueness if email is being updated
      if (staffData.email && staffData.email !== existingStaff.email) {
        const [emailExists] = await executeQuery<any>(`
          SELECT id FROM staff_members WHERE email = ? AND id != ?
        `, [staffData.email, staffId]);
        
        if (emailExists) {
          throw new Error('Staff member with this email already exists');
        }
      }
      
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (staffData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(staffData.name);
      }
      if (staffData.role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(staffData.role);
      }
      if (staffData.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(staffData.email);
      }
      if (staffData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(staffData.phone);
      }
      if (staffData.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(staffData.status);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(staffId);
      
      await executeQuery(`
        UPDATE staff_members SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues);
      
      logDatabase.success('Staff member updated successfully', { staffId });
      return await this.getStaffById(staffId) as StaffMember;
    } catch (error) {
      logDatabase.error('Failed to update staff member', error);
      throw error;
    }
  }

  // Delete staff member
  static async deleteStaff(staffId: number): Promise<boolean> {
    try {
      logDatabase.query('Deleting staff member', { staffId });
      
      // Check if staff exists
      const existingStaff = await this.getStaffById(staffId);
      if (!existingStaff) {
        throw new Error('Staff member not found');
      }
      
      await executeQuery(`
        DELETE FROM staff_members WHERE id = ?
      `, [staffId]);
      
      logDatabase.success('Staff member deleted successfully', { staffId, name: existingStaff.name });
      return true;
    } catch (error) {
      logDatabase.error('Failed to delete staff member', error);
      throw error;
    }
  }

  // ============= SECURITY SETTINGS METHODS =============
  
  // Get security settings
  static async getSecuritySettings(userId?: number): Promise<SecuritySettings | null> {
    try {
      logDatabase.query('Getting security settings', { userId });
      
      const [settings] = await executeQuery<any>(`
        SELECT 
          id,
          user_id as userId,
          two_factor_enabled as twoFactorEnabled,
          password_last_changed as passwordLastChanged,
          session_timeout as sessionTimeout,
          max_login_attempts as maxLoginAttempts,
          account_lockout_duration as accountLockoutDuration,
          created_at as createdAt,
          updated_at as updatedAt
        FROM security_settings 
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC 
        LIMIT 1
      `, [userId || null]);
      
      logDatabase.success('Security settings retrieved', { found: !!settings });
      return settings || null;
    } catch (error) {
      logDatabase.error('Failed to get security settings', error);
      throw error;
    }
  }

  // Update security settings
  static async updateSecuritySettings(userId: number | null, settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      logDatabase.query('Updating security settings', { userId, updates: Object.keys(settings) });
      
      const existingSettings = await this.getSecuritySettings(userId || undefined);
      
      if (existingSettings) {
        // Update existing settings
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        
        if (settings.twoFactorEnabled !== undefined) {
          updateFields.push('two_factor_enabled = ?');
          updateValues.push(settings.twoFactorEnabled);
        }
        if (settings.passwordLastChanged !== undefined) {
          updateFields.push('password_last_changed = ?');
          updateValues.push(settings.passwordLastChanged);
        }
        if (settings.sessionTimeout !== undefined) {
          updateFields.push('session_timeout = ?');
          updateValues.push(settings.sessionTimeout);
        }
        if (settings.maxLoginAttempts !== undefined) {
          updateFields.push('max_login_attempts = ?');
          updateValues.push(settings.maxLoginAttempts);
        }
        if (settings.accountLockoutDuration !== undefined) {
          updateFields.push('account_lockout_duration = ?');
          updateValues.push(settings.accountLockoutDuration);
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(existingSettings.id);
        
        await executeQuery(`
          UPDATE security_settings SET ${updateFields.join(', ')} WHERE id = ?
        `, updateValues);
        
        logDatabase.success('Security settings updated', { id: existingSettings.id });
      } else {
        // Create new settings
        await executeQuery(`
          INSERT INTO security_settings (
            user_id, two_factor_enabled, password_last_changed, 
            session_timeout, max_login_attempts, account_lockout_duration,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          userId,
          settings.twoFactorEnabled || false,
          settings.passwordLastChanged || null,
          settings.sessionTimeout || 30,
          settings.maxLoginAttempts || 5,
          settings.accountLockoutDuration || 15
        ]);
        
        logDatabase.success('Security settings created');
      }
      
      return await this.getSecuritySettings(userId || undefined) as SecuritySettings;
    } catch (error) {
      logDatabase.error('Failed to update security settings', error);
      throw error;
    }
  }

  // ============= NOTIFICATION SETTINGS METHODS =============
  
  // Get notification settings
  static async getNotificationSettings(userId?: number): Promise<NotificationSettings | null> {
    try {
      logDatabase.query('Getting notification settings', { userId });
      
      const [settings] = await executeQuery<any>(`
        SELECT 
          id,
          user_id as userId,
          email_alerts as emailAlerts,
          sms_alerts as smsAlerts,
          low_stock_alerts as lowStockAlerts,
          order_updates as orderUpdates,
          customer_approvals as customerApprovals,
          created_at as createdAt,
          updated_at as updatedAt
        FROM notification_settings 
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC 
        LIMIT 1
      `, [userId || null]);
      
      logDatabase.success('Notification settings retrieved', { found: !!settings });
      return settings || null;
    } catch (error) {
      logDatabase.error('Failed to get notification settings', error);
      throw error;
    }
  }

  // Update notification settings
  static async updateNotificationSettings(userId: number | null, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      logDatabase.query('Updating notification settings', { userId, updates: Object.keys(settings) });
      
      const existingSettings = await this.getNotificationSettings(userId || undefined);
      
      if (existingSettings) {
        // Update existing settings
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        
        if (settings.emailAlerts !== undefined) {
          updateFields.push('email_alerts = ?');
          updateValues.push(settings.emailAlerts);
        }
        if (settings.smsAlerts !== undefined) {
          updateFields.push('sms_alerts = ?');
          updateValues.push(settings.smsAlerts);
        }
        if (settings.lowStockAlerts !== undefined) {
          updateFields.push('low_stock_alerts = ?');
          updateValues.push(settings.lowStockAlerts);
        }
        if (settings.orderUpdates !== undefined) {
          updateFields.push('order_updates = ?');
          updateValues.push(settings.orderUpdates);
        }
        if (settings.customerApprovals !== undefined) {
          updateFields.push('customer_approvals = ?');
          updateValues.push(settings.customerApprovals);
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(existingSettings.id);
        
        await executeQuery(`
          UPDATE notification_settings SET ${updateFields.join(', ')} WHERE id = ?
        `, updateValues);
        
        logDatabase.success('Notification settings updated', { id: existingSettings.id });
      } else {
        // Create new settings with defaults
        await executeQuery(`
          INSERT INTO notification_settings (
            user_id, email_alerts, sms_alerts, low_stock_alerts, 
            order_updates, customer_approvals, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          userId,
          settings.emailAlerts !== undefined ? settings.emailAlerts : true,
          settings.smsAlerts !== undefined ? settings.smsAlerts : false,
          settings.lowStockAlerts !== undefined ? settings.lowStockAlerts : true,
          settings.orderUpdates !== undefined ? settings.orderUpdates : true,
          settings.customerApprovals !== undefined ? settings.customerApprovals : true
        ]);
        
        logDatabase.success('Notification settings created');
      }
      
      return await this.getNotificationSettings(userId || undefined) as NotificationSettings;
    } catch (error) {
      logDatabase.error('Failed to update notification settings', error);
      throw error;
    }
  }
}