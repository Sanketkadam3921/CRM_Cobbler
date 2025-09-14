import {
  ServiceDetails,
  ServiceStats,
  ServiceType,
  ServiceAssignmentRequest,
  ServiceStartRequest,
  ServiceCompleteRequest,
  FinalPhotoRequest,
  WorkflowCompleteRequest,
  ApiResponse
} from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration - SAME AS PICKUP
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173'
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

// const API_BASE_URL='http://localhost:3001/api';

const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// HTTP Client with authentication - SAME AS PICKUP
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

// Create API client instance - SAME AS PICKUP
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Service API Service - FOLLOWING PICKUP PATTERN
export class ServiceApiService {
  // Get service statistics
  static async getServiceStats(): Promise<ServiceStats> {
    try {
      const response = await apiClient.get<ApiResponse<ServiceStats>>('/services/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch service statistics');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get service statistics:', error);
      throw error;
    }
  }

  // Get all service stage enquiries
  static async getServiceEnquiries(): Promise<ServiceDetails[]> {
    try {
      const response = await apiClient.get<ApiResponse<ServiceDetails[]>>('/services/enquiries');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch service enquiries');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get service enquiries:', error);
      throw error;
    }
  }

  // Get specific enquiry service details
  static async getEnquiryServiceDetails(enquiryId: number): Promise<ServiceDetails | null> {
    try {
      const response = await apiClient.get<ApiResponse<ServiceDetails>>(`/services/enquiries/${enquiryId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch enquiry service details');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get enquiry service details:', error);
      throw error;
    }
  }

  // Assign services to an enquiry
  static async assignServices(enquiryId: number, serviceTypes: ServiceType[]): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/services/enquiries/${enquiryId}/assign`, {
        enquiryId,
        serviceTypes
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign services');
      }
    } catch (error) {
      console.error('Failed to assign services:', error);
      throw error;
    }
  }

  // Start a service
  static async startService(enquiryId: number, serviceTypeId: number, beforePhoto: string, notes?: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/services/enquiries/${enquiryId}/start`, {
        serviceTypeId,
        beforePhoto,
        notes
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to start service');
      }
    } catch (error) {
      console.error('Failed to start service:', error);
      throw error;
    }
  }

  // Complete a service
  static async completeService(enquiryId: number, serviceTypeId: number, afterPhoto: string, notes?: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/services/enquiries/${enquiryId}/complete`, {
        serviceTypeId,
        afterPhoto,
        notes
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete service');
      }
    } catch (error) {
      console.error('Failed to complete service:', error);
      throw error;
    }
  }

  // Save final overall photo
  static async saveFinalPhoto(enquiryId: number, afterPhoto: string, notes?: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/services/enquiries/${enquiryId}/final-photo`, {
        enquiryId,
        afterPhoto,
        notes
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save final photo');
      }
    } catch (error) {
      console.error('Failed to save final photo:', error);
      throw error;
    }
  }

  // Complete workflow and move to billing
  static async completeWorkflow(enquiryId: number, actualCost: number, workNotes?: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/services/enquiries/${enquiryId}/complete-workflow`, {
        enquiryId,
        actualCost,
        workNotes
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete workflow');
      }
    } catch (error) {
      console.error('Failed to complete workflow:', error);
      throw error;
    }
  }
}

// Hook for managing service enquiries with polling - SAME PATTERN AS PICKUP
export function useServiceEnquiries(pollInterval: number = 200000) {
  const [enquiries, setEnquiries] = useState<ServiceDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchServiceEnquiries = useCallback(async () => {
    try {
      setError(null);
      const result = await ServiceApiService.getServiceEnquiries();
      setEnquiries(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service enquiries');
      console.error('Error fetching service enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchServiceEnquiries();
  }, [fetchServiceEnquiries]);

  // Set up polling
  useEffect(() => {
    const interval = setInterval(fetchServiceEnquiries, pollInterval);
    return () => clearInterval(interval);
  }, [fetchServiceEnquiries, pollInterval]);

  return {
    enquiries,
    loading,
    error,
    lastUpdate,
    refetch: fetchServiceEnquiries,
  };
}

// Hook for service statistics - SAME PATTERN AS PICKUP
export function useServiceStats(pollInterval: number = 500000) {
  const [stats, setStats] = useState<ServiceStats>({
    pendingCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    totalServices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await ServiceApiService.getServiceStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service statistics');
      console.error('Error fetching service statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStats, pollInterval]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Export the service API service for compatibility
export const serviceApiService = ServiceApiService;

export default ServiceApiService;