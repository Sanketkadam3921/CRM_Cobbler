import { Enquiry, ApiResponse, PaginatedResponse } from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173'
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

// const API_BASE_URL='http://localhost:3001/api';


const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// HTTP Client with authentication
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

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Enquiry API Service
export class EnquiryApiService {
  // Get all enquiries with pagination and filtering
  static async getAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    currentStage?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<Enquiry>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Enquiry>>>('/enquiries', filters);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch enquiries');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get enquiries:', error);
      throw error;
    }
  }

  // Get enquiry by ID
  static async getById(id: number): Promise<Enquiry> {
    try {
      const response = await apiClient.get<ApiResponse<Enquiry>>(`/enquiries/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch enquiry');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to get enquiry ${id}:`, error);
      throw error;
    }
  }

  // Create new enquiry
  static async create(enquiryData: Omit<Enquiry, 'id'>): Promise<Enquiry> {
    try {
      const response = await apiClient.post<ApiResponse<Enquiry>>('/enquiries', enquiryData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create enquiry');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to create enquiry:', error);
      throw error;
    }
  }

  // Update enquiry
  static async update(id: number, updates: Partial<Enquiry>): Promise<Enquiry> {
    try {
      const response = await apiClient.put<ApiResponse<Enquiry>>(`/enquiries/${id}`, updates);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update enquiry');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to update enquiry ${id}:`, error);
      throw error;
    }
  }

  // Delete enquiry
  static async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/enquiries/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete enquiry');
      }
    } catch (error) {
      console.error(`Failed to delete enquiry ${id}:`, error);
      throw error;
    }
  }

  // Get CRM statistics
  static async getStats(): Promise<{
    totalCurrentMonth: number;
    newThisWeek: number;
    converted: number;
    pendingFollowUp: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        totalCurrentMonth: number;
        newThisWeek: number;
        converted: number;
        pendingFollowUp: number;
      }>>('/enquiries/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch statistics');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  // Mark enquiry as contacted
  static async markContacted(id: number): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/enquiries/${id}/contact`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark enquiry as contacted');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to mark enquiry ${id} as contacted:`, error);
      throw error;
    }
  }

  // Convert enquiry
  static async convert(id: number, quotedAmount: number): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/enquiries/${id}/convert`, {
        quotedAmount
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to convert enquiry');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to convert enquiry ${id}:`, error);
      throw error;
    }
  }

  // Transition enquiry to next stage
  static async transitionStage(id: number, stage: string): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/enquiries/${id}/stage`, {
        stage
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to transition enquiry stage');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to transition enquiry ${id} to stage ${stage}:`, error);
      throw error;
    }
  }

  // Get enquiries by stage
  static async getByStage(stage: string): Promise<Enquiry[]> {
    try {
      const response = await apiClient.get<ApiResponse<Enquiry[]>>(`/enquiries/stage/${stage}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch enquiries by stage');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to get enquiries by stage ${stage}:`, error);
      throw error;
    }
  }
}

// Hook for managing enquiries with polling
export function useEnquiriesWithPolling(pollInterval: number = 30000) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchEnquiries = useCallback(async () => {
    try {
      setError(null);
      const result = await EnquiryApiService.getAll({ limit: 100000 }); // Get all enquiries
      setEnquiries(result.data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch enquiries');
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Set up polling
  useEffect(() => {
    const interval = setInterval(fetchEnquiries, pollInterval);
    return () => clearInterval(interval);
  }, [fetchEnquiries, pollInterval]);

  // Optimistic updates for better UX
  const addEnquiryOptimistic = useCallback(async (enquiryData: Omit<Enquiry, 'id'>) => {
    try {
      // Create optimistic enquiry with temporary ID
      const optimisticEnquiry: Enquiry = {
        ...enquiryData,
        id: Date.now(), // Temporary ID
      };

      // Add to state immediately for instant feedback
      setEnquiries(prev => [optimisticEnquiry, ...prev]);

      // Make actual API call
      const createdEnquiry = await EnquiryApiService.create(enquiryData);

      // Replace optimistic enquiry with real one
      setEnquiries(prev =>
        prev.map(e => e.id === optimisticEnquiry.id ? createdEnquiry : e)
      );

      return createdEnquiry;
    } catch (error) {
      // Remove optimistic enquiry on error
      setEnquiries(prev => prev.filter(e => e.id !== Date.now()));
      throw error;
    }
  }, []);

  const updateEnquiryOptimistic = useCallback(async (id: number, updates: Partial<Enquiry>) => {
    try {
      // Update optimistically
      setEnquiries(prev =>
        prev.map(e => e.id === id ? { ...e, ...updates } : e)
      );

      // Make actual API call
      const updatedEnquiry = await EnquiryApiService.update(id, updates);

      // Replace with real updated enquiry
      setEnquiries(prev =>
        prev.map(e => e.id === id ? updatedEnquiry : e)
      );

      return updatedEnquiry;
    } catch (error) {
      // Revert optimistic update on error
      fetchEnquiries();
      throw error;
    }
  }, [fetchEnquiries]);

  const deleteEnquiryOptimistic = useCallback(async (id: number) => {
    try {
      // Remove optimistically
      setEnquiries(prev => prev.filter(e => e.id !== id));

      // Make actual API call
      await EnquiryApiService.delete(id);
    } catch (error) {
      // Restore on error
      fetchEnquiries();
      throw error;
    }
  }, [fetchEnquiries]);

  return {
    enquiries,
    loading,
    error,
    lastUpdate,
    refetch: fetchEnquiries,
    addEnquiry: addEnquiryOptimistic,
    updateEnquiry: updateEnquiryOptimistic,
    deleteEnquiry: deleteEnquiryOptimistic,
  };
}

// Hook for CRM statistics
export function useCrmStats() {
  const [stats, setStats] = useState<{
    totalCurrentMonth: number;
    newThisWeek: number;
    converted: number;
    pendingFollowUp: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await EnquiryApiService.getStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export default EnquiryApiService;
