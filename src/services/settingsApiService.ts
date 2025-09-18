import { BusinessInfo, StaffMember, ApiResponse } from '@/types';

// API Configuration - SAME AS OTHER MODULES
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
    typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173'
        ? `${window.location.origin}/api`
        : 'http://localhost:3001/api'
);

const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// HTTP Client with authentication - SAME PATTERN AS OTHER MODULES
class ApiClient {
    private baseURL: string;
    private token: string;

    constructor(baseURL: string, token: string) {
        this.baseURL = baseURL;
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'X-Token': this.token,
                ...options.headers,
            },
            ...options,
        };

        try {
            console.log(`[SettingsAPI] Making request to: ${endpoint}`, {
                method: options.method || 'GET',
                url
            });

            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[SettingsAPI] Request failed:`, {
                    endpoint,
                    status: response.status,
                    error: errorData.error,
                    message: errorData.message
                });
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[SettingsAPI] Request successful:`, {
                endpoint,
                status: response.status,
                message: data.message
            });
            return data;
        } catch (error) {
            console.error(`[SettingsAPI] Request error for ${endpoint}:`, error);
            throw error;
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
        return this.request<T>(url, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Create API client instance - SAME AS OTHER MODULES
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

export class SettingsApiService {

    // ============= BUSINESS INFORMATION API METHODS =============

    // Get business information
    static async getBusinessInfo(): Promise<BusinessInfo | null> {
        try {
            console.log('[SettingsAPI] Getting business information');

            const response = await apiClient.get<ApiResponse<BusinessInfo>>('/settings/business');

            console.log('[SettingsAPI] Business information retrieved successfully:', {
                hasData: !!response.data,
                businessName: response.data?.businessName
            });

            return response.data || null;
        } catch (error) {
            console.error('[SettingsAPI] Failed to get business information:', error);
            throw error;
        }
    }

    // Save business information
    static async saveBusinessInfo(businessData: BusinessInfo): Promise<BusinessInfo> {
        try {
            console.log('[SettingsAPI] Saving business information:', {
                businessName: businessData.businessName,
                ownerName: businessData.ownerName,
                hasLogo: !!businessData.logo
            });

            const response = await apiClient.post<ApiResponse<BusinessInfo>>('/settings/business', businessData);

            if (!response.data) {
                throw new Error('No data returned from server');
            }

            console.log('[SettingsAPI] Business information saved successfully:', {
                businessName: response.data.businessName,
                id: response.data.id
            });

            return response.data;
        } catch (error) {
            console.error('[SettingsAPI] Failed to save business information:', error);
            throw error;
        }
    }

    // ============= STAFF MANAGEMENT API METHODS =============

    // Get all staff members
    static async getAllStaff(): Promise<StaffMember[]> {
        try {
            console.log('[SettingsAPI] Getting all staff members');

            const response = await apiClient.get<ApiResponse<StaffMember[]>>('/settings/staff');

            console.log('[SettingsAPI] Staff members retrieved successfully:', {
                count: response.data?.length || 0
            });

            return response.data || [];
        } catch (error) {
            console.error('[SettingsAPI] Failed to get staff members:', error);
            throw error;
        }
    }

    // Get staff member by ID
    static async getStaffById(staffId: number): Promise<StaffMember> {
        try {
            console.log('[SettingsAPI] Getting staff member by ID:', { staffId });

            const response = await apiClient.get<ApiResponse<StaffMember>>(`/settings/staff/${staffId}`);

            if (!response.data) {
                throw new Error('Staff member not found');
            }

            console.log('[SettingsAPI] Staff member retrieved successfully:', {
                id: response.data.id,
                name: response.data.name
            });

            return response.data;
        } catch (error) {
            console.error('[SettingsAPI] Failed to get staff member:', error);
            throw error;
        }
    }

    // Create new staff member
    static async createStaff(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
        try {
            console.log('[SettingsAPI] Creating new staff member:', {
                name: staffData.name,
                role: staffData.role,
                email: staffData.email,
                status: staffData.status
            });

            const response = await apiClient.post<ApiResponse<StaffMember>>('/settings/staff', staffData);

            if (!response.data) {
                throw new Error('No data returned from server');
            }

            console.log('[SettingsAPI] Staff member created successfully:', {
                id: response.data.id,
                name: response.data.name
            });

            return response.data;
        } catch (error) {
            console.error('[SettingsAPI] Failed to create staff member:', error);
            throw error;
        }
    }

    // Update staff member
    static async updateStaff(staffId: number, staffData: Partial<StaffMember>): Promise<StaffMember> {
        try {
            console.log('[SettingsAPI] Updating staff member:', {
                staffId,
                updates: Object.keys(staffData)
            });

            const response = await apiClient.put<ApiResponse<StaffMember>>(`/settings/staff/${staffId}`, staffData);

            if (!response.data) {
                throw new Error('No data returned from server');
            }

            console.log('[SettingsAPI] Staff member updated successfully:', {
                id: response.data.id,
                name: response.data.name
            });

            return response.data;
        } catch (error) {
            console.error('[SettingsAPI] Failed to update staff member:', error);
            throw error;
        }
    }

    // Delete staff member
    static async deleteStaff(staffId: number): Promise<boolean> {
        try {
            console.log('[SettingsAPI] Deleting staff member:', { staffId });

            const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/settings/staff/${staffId}`);

            console.log('[SettingsAPI] Staff member deleted successfully:', {
                staffId,
                deleted: response.data?.deleted
            });

            return response.data?.deleted || false;
        } catch (error) {
            console.error('[SettingsAPI] Failed to delete staff member:', error);
            throw error;
        }
    }

    // ============= SECURITY SETTINGS API METHODS =============

    // Get security settings
    static async getSecuritySettings(userId?: number): Promise<any> {
        try {
            console.log('[SettingsAPI] Getting security settings:', { userId });

            const queryParam = userId ? `?userId=${userId}` : '';
            const response = await apiClient.get<ApiResponse<any>>(`/settings/security${queryParam}`);

            console.log('[SettingsAPI] Security settings retrieved successfully:', {
                hasData: !!response.data
            });

            return response.data || null;
        } catch (error) {
            console.error('[SettingsAPI] Failed to get security settings:', error);
            throw error;
        }
    }

    // Update security settings
    static async updateSecuritySettings(settings: any, userId?: number): Promise<any> {
        try {
            const requestData = { ...settings, userId: userId || null };

            console.log('[SettingsAPI] Updating security settings:', {
                userId,
                updates: Object.keys(settings)
            });

            const response = await apiClient.post<ApiResponse<any>>('/settings/security', requestData);

            if (!response.data) {
                throw new Error('No data returned from server');
            }

            console.log('[SettingsAPI] Security settings updated successfully:', {
                id: response.data.id
            });

            return response.data;
        } catch (error) {
            console.error('[SettingsAPI] Failed to update security settings:', error);
            throw error;
        }
    }
}