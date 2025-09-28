import {
  BillingStats,
  BillingEnquiry,
  BillingCreateRequest,
  BillingMoveToDeliveryRequest,
  ApiResponse
} from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration - SAME AS PICKUP/SERVICE
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173'
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

// const API_BASE_URL='http://localhost:3001/api';

const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// HTTP Client with authentication - SAME AS PICKUP/SERVICE
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
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
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

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance - SAME AS PICKUP/SERVICE
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Billing API Service - FOLLOWING PICKUP/SERVICE PATTERN
export class BillingApiService {
  // Get billing statistics
  static async getBillingStats(): Promise<BillingStats> {
    try {
      console.log('🔄 Fetching billing statistics...');
      const response = await apiClient.get<ApiResponse<BillingStats>>('/billing/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch billing statistics');
      }

      console.log('✅ Billing statistics fetched successfully:', response.data);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get billing statistics:', error);
      throw error;
    }
  }

  // Get all billing stage enquiries
  static async getBillingEnquiries(): Promise<BillingEnquiry[]> {
    try {
      console.log('🔄 Fetching billing enquiries...');
      const response = await apiClient.get<ApiResponse<BillingEnquiry[]>>('/billing/enquiries');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch billing enquiries');
      }

      console.log('✅ Billing enquiries fetched successfully:', response.data?.length, 'enquiries');
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get billing enquiries:', error);
      throw error;
    }
  }

  // Get specific billing enquiry
  static async getBillingEnquiry(enquiryId: number): Promise<BillingEnquiry | null> {
    try {
      console.log('🔄 Fetching billing enquiry:', enquiryId);
      const response = await apiClient.get<ApiResponse<BillingEnquiry>>(`/billing/enquiries/${enquiryId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch billing enquiry');
      }

      console.log('✅ Billing enquiry fetched successfully:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get billing enquiry:', error);
      throw error;
    }
  }

  // Create/save billing details
  static async createBilling(enquiryId: number, billingData: BillingCreateRequest): Promise<any> {
    try {
      console.log('🔄 Creating billing details for enquiry:', enquiryId);
      console.log('🔄 Billing data:', billingData);

      const response = await apiClient.post<ApiResponse<any>>(`/billing/enquiries/${enquiryId}/billing`, billingData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create billing details');
      }

      console.log('✅ Billing details created successfully for enquiry:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to create billing details:', error);
      throw error;
    }
  }

  // Get invoice data
  static async getInvoiceData(enquiryId: number): Promise<any> {
    try {
      console.log('🔄 Fetching invoice data for enquiry:', enquiryId);
      const response = await apiClient.get<ApiResponse<any>>(`/billing/enquiries/${enquiryId}/invoice`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch invoice data');
      }

      console.log('✅ Invoice data fetched successfully for enquiry:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get invoice data:', error);
      throw error;
    }
  }

  // Move to delivery stage
  static async moveToDelivery(enquiryId: number): Promise<any> {
    try {
      console.log('🔄 Moving enquiry to delivery stage:', enquiryId);
      const response = await apiClient.patch<ApiResponse<any>>(`/billing/enquiries/${enquiryId}/move-to-delivery`, {});

      if (!response.success) {
        throw new Error(response.error || 'Failed to move enquiry to delivery stage');
      }

      console.log('✅ Enquiry moved to delivery stage successfully:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to move enquiry to delivery stage:', error);
      throw error;
    }
  }
}

// Hook for managing billing enquiries with polling - SAME PATTERN AS PICKUP/SERVICE
export function useBillingEnquiries(pollInterval: number = 200000) {
  const [enquiries, setEnquiries] = useState<BillingEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchBillingEnquiries = useCallback(async () => {
    try {
      console.log('🔄 Fetching billing enquiries (polling)...');
      setError(null);
      const result = await BillingApiService.getBillingEnquiries();
      setEnquiries(Array.isArray(result) ? result : []);
      setLastUpdate(new Date());
      console.log('✅ Billing enquiries updated:', result.length, 'enquiries');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch billing enquiries';
      setError(errorMessage);
      console.error('❌ Error fetching billing enquiries:', err);

      // Set empty array on error to prevent UI issues
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('🚀 Initial billing enquiries fetch...');
    fetchBillingEnquiries();
  }, [fetchBillingEnquiries]);

  // Set up polling
  useEffect(() => {
    console.log('⏰ Setting up billing enquiries polling with interval:', pollInterval, 'ms');
    const interval = setInterval(fetchBillingEnquiries, pollInterval);
    return () => {
      console.log('🛑 Clearing billing enquiries polling interval');
      clearInterval(interval);
    };
  }, [fetchBillingEnquiries, pollInterval]);

  // Optimistic updates for better UX
  const createBillingOptimistic = useCallback(async (enquiryId: number, billingData: BillingCreateRequest) => {
    try {
      console.log('🔄 Creating billing optimistically for enquiry:', enquiryId);

      // Update optimistically - add billing details to the enquiry
      setEnquiries(prev =>
        prev.map(e => e.id === enquiryId ? {
          ...e,
          serviceDetails: {
            ...e.serviceDetails,
            billingDetails: {
              ...billingData,
              invoiceNumber: `TEMP-${Date.now()}`, // Temporary invoice number
              invoiceDate: new Date().toISOString().split('T')[0],
              generatedAt: new Date().toISOString()
            }
          }
        } : e)
      );

      // Make actual API call
      const result = await BillingApiService.createBilling(enquiryId, billingData);

      // Replace optimistic update with real data
      setEnquiries(prev =>
        prev.map(e => e.id === enquiryId ? {
          ...e,
          serviceDetails: {
            ...e.serviceDetails,
            billingDetails: result
          }
        } : e)
      );

      console.log('✅ Billing created successfully for enquiry:', enquiryId);
      return result;
    } catch (error) {
      console.error('❌ Failed to create billing, reverting optimistic update:', error);
      // Revert optimistic update on error
      fetchBillingEnquiries();
      throw error;
    }
  }, [fetchBillingEnquiries]);

  const moveToDeliveryOptimistic = useCallback(async (enquiryId: number) => {
    try {
      console.log('🔄 Moving to delivery optimistically for enquiry:', enquiryId);

      // Remove from billing enquiries optimistically (will move to delivery stage)
      setEnquiries(prev => prev.filter(e => e.id !== enquiryId));

      // Make actual API call
      const result = await BillingApiService.moveToDelivery(enquiryId);

      console.log('✅ Enquiry moved to delivery successfully:', enquiryId);
      return result;
    } catch (error) {
      console.error('❌ Failed to move to delivery, restoring enquiry:', error);
      // Restore on error
      fetchBillingEnquiries();
      throw error;
    }
  }, [fetchBillingEnquiries]);

  return {
    enquiries,
    loading,
    error,
    lastUpdate,
    refetch: fetchBillingEnquiries,
    createBilling: createBillingOptimistic,
    moveToDelivery: moveToDeliveryOptimistic,
  };
}

// Hook for billing statistics - SAME PATTERN AS PICKUP/SERVICE
export function useBillingStats(pollInterval: number = 500000) {
  const [stats, setStats] = useState<BillingStats>({
    pendingBilling: 0,
    invoicesGenerated: 0,
    totalBilled: 0,
    invoicesSent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      console.log('🔄 Fetching billing statistics (polling)...');
      setError(null);
      const result = await BillingApiService.getBillingStats();

      // Ensure all values are numbers with fallbacks
      const safeStats: BillingStats = {
        pendingBilling: Number(result.pendingBilling) || 0,
        invoicesGenerated: Number(result.invoicesGenerated) || 0,
        totalBilled: Number(result.totalBilled) || 0,
        invoicesSent: Number(result.invoicesSent) || 0
      };

      setStats(safeStats);
      console.log('✅ Billing statistics updated:', safeStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch billing statistics';
      setError(errorMessage);
      console.error('❌ Error fetching billing statistics:', err);

      // Set safe defaults on error
      setStats({
        pendingBilling: 0,
        invoicesGenerated: 0,
        totalBilled: 0,
        invoicesSent: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 Initial billing statistics fetch...');
    fetchStats();

    // Refresh stats every 5 seconds
    console.log('⏰ Setting up billing statistics polling with interval:', pollInterval, 'ms');
    const interval = setInterval(fetchStats, pollInterval);
    return () => {
      console.log('🛑 Clearing billing statistics polling interval');
      clearInterval(interval);
    };
  }, [fetchStats, pollInterval]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Export the billing API service for compatibility
export const billingApiService = BillingApiService;

export default BillingApiService;