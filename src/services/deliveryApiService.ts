import { 
  DeliveryStats, 
  DeliveryEnquiry, 
  DeliveryMethod,
  ApiResponse
} from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration - SAME AS OTHER MODULES
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173' 
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

// const API_BASE_URL='http://localhost:3001/api';


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

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance - SAME AS OTHER MODULES
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Delivery API Service - FOLLOWING PATTERN FROM OTHER MODULES
export class DeliveryApiService {
  // Get delivery statistics
  static async getDeliveryStats(): Promise<DeliveryStats> {
    try {
      console.log('🔄 Fetching delivery statistics...');
      const response = await apiClient.get<ApiResponse<DeliveryStats>>('/delivery/stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch delivery statistics');
      }
      
      console.log('✅ Delivery statistics fetched successfully:', response.data);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get delivery statistics:', error);
      throw error;
    }
  }

  // Get all delivery stage enquiries
  static async getDeliveryEnquiries(): Promise<DeliveryEnquiry[]> {
    try {
      console.log('🔄 Fetching delivery enquiries...');
      const response = await apiClient.get<ApiResponse<DeliveryEnquiry[]>>('/delivery/enquiries');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch delivery enquiries');
      }
      
      console.log('✅ Delivery enquiries fetched successfully:', response.data?.length, 'enquiries');
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get delivery enquiries:', error);
      throw error;
    }
  }

  // Get specific delivery enquiry
  static async getDeliveryEnquiry(enquiryId: number): Promise<DeliveryEnquiry | null> {
    try {
      console.log('🔄 Fetching delivery enquiry:', enquiryId);
      const response = await apiClient.get<ApiResponse<DeliveryEnquiry>>(`/delivery/enquiries/${enquiryId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch delivery enquiry');
      }
      
      console.log('✅ Delivery enquiry fetched successfully:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to get delivery enquiry:', error);
      throw error;
    }
  }

  // Schedule delivery
  static async scheduleDelivery(
    enquiryId: number, 
    deliveryMethod: DeliveryMethod, 
    scheduledTime: string
  ): Promise<any> {
    try {
      console.log('🔄 Scheduling delivery for enquiry:', enquiryId, { deliveryMethod, scheduledTime });
      
      const response = await apiClient.patch<ApiResponse<any>>(`/delivery/enquiries/${enquiryId}/schedule`, {
        deliveryMethod,
        scheduledTime
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to schedule delivery');
      }
      
      console.log('✅ Delivery scheduled successfully for enquiry:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to schedule delivery:', error);
      throw error;
    }
  }

  // Mark as out for delivery
  static async markOutForDelivery(enquiryId: number, assignedTo: string): Promise<any> {
    try {
      console.log('🔄 Marking out for delivery for enquiry:', enquiryId, { assignedTo });
      
      const response = await apiClient.patch<ApiResponse<any>>(`/delivery/enquiries/${enquiryId}/out-for-delivery`, {
        assignedTo
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark as out for delivery');
      }
      
      console.log('✅ Marked as out for delivery successfully for enquiry:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to mark as out for delivery:', error);
      throw error;
    }
  }

  // Complete delivery
  static async completeDelivery(
    enquiryId: number,
    deliveryProofPhoto: string,
    customerSignature?: string,
    deliveryNotes?: string
  ): Promise<any> {
    try {
      console.log('🔄 Completing delivery for enquiry:', enquiryId, {
        hasProofPhoto: !!deliveryProofPhoto,
        hasSignature: !!customerSignature,
        hasNotes: !!deliveryNotes
      });
      
      const response = await apiClient.patch<ApiResponse<any>>(`/delivery/enquiries/${enquiryId}/complete`, {
        deliveryProofPhoto,
        customerSignature,
        deliveryNotes
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to complete delivery');
      }
      
      console.log('✅ Delivery completed successfully for enquiry:', enquiryId);
      return response.data!;
    } catch (error) {
      console.error('❌ Failed to complete delivery:', error);
      throw error;
    }
  }
}

// Hook for managing delivery enquiries with polling - SAME PATTERN AS OTHER MODULES
export function useDeliveryEnquiries(pollInterval: number = 200000) {
  const [enquiries, setEnquiries] = useState<DeliveryEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDeliveryEnquiries = useCallback(async () => {
    try {
      console.log('🔄 Fetching delivery enquiries (polling)...');
      setError(null);
      const result = await DeliveryApiService.getDeliveryEnquiries();
      setEnquiries(Array.isArray(result) ? result : []);
      setLastUpdate(new Date());
      console.log('✅ Delivery enquiries updated:', result.length, 'enquiries');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch delivery enquiries';
      setError(errorMessage);
      console.error('❌ Error fetching delivery enquiries:', err);
      
      // Set empty array on error to prevent UI issues
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('🚀 Initial delivery enquiries fetch...');
    fetchDeliveryEnquiries();
  }, [fetchDeliveryEnquiries]);

  // Set up polling
  useEffect(() => {
    console.log('⏰ Setting up delivery enquiries polling with interval:', pollInterval, 'ms');
    const interval = setInterval(fetchDeliveryEnquiries, pollInterval);
    return () => {
      console.log('🛑 Clearing delivery enquiries polling interval');
      clearInterval(interval);
    };
  }, [fetchDeliveryEnquiries, pollInterval]);

  // Optimistic updates for better UX - FOLLOWING PATTERN FROM OTHER MODULES
  const scheduleDeliveryOptimistic = useCallback(async (
    enquiryId: number, 
    deliveryMethod: DeliveryMethod, 
    scheduledTime: string
  ) => {
    try {
      console.log('🔄 Scheduling delivery optimistically for enquiry:', enquiryId);
      
      // Update optimistically - change status to scheduled
      setEnquiries(prev => 
        prev.map(e => e.id === enquiryId ? {
          ...e,
          deliveryDetails: {
            ...e.deliveryDetails!,
            status: 'scheduled',
            deliveryMethod,
            scheduledTime
          }
        } : e)
      );
      
      // Make actual API call
      const result = await DeliveryApiService.scheduleDelivery(enquiryId, deliveryMethod, scheduledTime);
      
      console.log('✅ Delivery scheduled successfully for enquiry:', enquiryId);
      return result;
    } catch (error) {
      console.error('❌ Failed to schedule delivery, reverting optimistic update:', error);
      // Revert optimistic update on error
      fetchDeliveryEnquiries();
      throw error;
    }
  }, [fetchDeliveryEnquiries]);

  const markOutForDeliveryOptimistic = useCallback(async (enquiryId: number, assignedTo: string) => {
    try {
      console.log('🔄 Marking out for delivery optimistically for enquiry:', enquiryId);
      
      // Update optimistically - change status to out-for-delivery
      setEnquiries(prev => 
        prev.map(e => e.id === enquiryId ? {
          ...e,
          deliveryDetails: {
            ...e.deliveryDetails!,
            status: 'out-for-delivery',
            assignedTo
          }
        } : e)
      );
      
      // Make actual API call
      const result = await DeliveryApiService.markOutForDelivery(enquiryId, assignedTo);
      
      console.log('✅ Marked as out for delivery successfully for enquiry:', enquiryId);
      return result;
    } catch (error) {
      console.error('❌ Failed to mark as out for delivery, reverting optimistic update:', error);
      // Revert optimistic update on error
      fetchDeliveryEnquiries();
      throw error;
    }
  }, [fetchDeliveryEnquiries]);

  const completeDeliveryOptimistic = useCallback(async (
    enquiryId: number,
    deliveryProofPhoto: string,
    customerSignature?: string,
    deliveryNotes?: string
  ) => {
    try {
      console.log('🔄 Completing delivery optimistically for enquiry:', enquiryId);
      
      // Remove from delivery enquiries optimistically (will move to completed stage)
      setEnquiries(prev => prev.filter(e => e.id !== enquiryId));
      
      // Make actual API call
      const result = await DeliveryApiService.completeDelivery(
        enquiryId, 
        deliveryProofPhoto, 
        customerSignature, 
        deliveryNotes
      );
      
      console.log('✅ Delivery completed successfully for enquiry:', enquiryId);
      return result;
    } catch (error) {
      console.error('❌ Failed to complete delivery, restoring enquiry:', error);
      // Restore on error
      fetchDeliveryEnquiries();
      throw error;
    }
  }, [fetchDeliveryEnquiries]);

  return {
    enquiries,
    loading,
    error,
    lastUpdate,
    refetch: fetchDeliveryEnquiries,
    scheduleDelivery: scheduleDeliveryOptimistic,
    markOutForDelivery: markOutForDeliveryOptimistic,
    completeDelivery: completeDeliveryOptimistic,
  };
}

// Hook for delivery statistics - SAME PATTERN AS OTHER MODULES
export function useDeliveryStats(pollInterval: number = 500000) {
  const [stats, setStats] = useState<DeliveryStats>({
    readyForDelivery: 0,
    scheduledDeliveries: 0,
    outForDelivery: 0,
    deliveredToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      console.log('🔄 Fetching delivery statistics (polling)...');
      setError(null);
      const result = await DeliveryApiService.getDeliveryStats();
      
      // Ensure all values are numbers with fallbacks
      const safeStats: DeliveryStats = {
        readyForDelivery: Number(result.readyForDelivery) || 0,
        scheduledDeliveries: Number(result.scheduledDeliveries) || 0,
        outForDelivery: Number(result.outForDelivery) || 0,
        deliveredToday: Number(result.deliveredToday) || 0
      };
      
      setStats(safeStats);
      console.log('✅ Delivery statistics updated:', safeStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch delivery statistics';
      setError(errorMessage);
      console.error('❌ Error fetching delivery statistics:', err);
      
      // Set safe defaults on error
      setStats({
        readyForDelivery: 0,
        scheduledDeliveries: 0,
        outForDelivery: 0,
        deliveredToday: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 Initial delivery statistics fetch...');
    fetchStats();
    
    // Refresh stats every 5 seconds
    console.log('⏰ Setting up delivery statistics polling with interval:', pollInterval, 'ms');
    const interval = setInterval(fetchStats, pollInterval);
    return () => {
      console.log('🛑 Clearing delivery statistics polling interval');
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

// Export the delivery API service for compatibility
export const deliveryApiService = DeliveryApiService;

export default DeliveryApiService;