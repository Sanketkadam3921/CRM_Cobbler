import { Enquiry, ApiResponse } from '@/types';
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

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Pickup API Service
export class PickupApiService {
  // Get pickup statistics
  static async getStats(): Promise<{
    scheduledPickups: number;
    assignedPickups: number;
    collectedPickups: number;
    receivedPickups: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        scheduledPickups: number;
        assignedPickups: number;
        collectedPickups: number;
        receivedPickups: number;
      }>>('/pickup/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pickup statistics');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get pickup statistics:', error);
      throw error;
    }
  }

  // Get all pickup stage enquiries
  static async getPickupEnquiries(searchTerm?: string): Promise<Enquiry[]> {
    try {
      const params = searchTerm ? { search: searchTerm } : undefined;
      const response = await apiClient.get<ApiResponse<Enquiry[]>>('/pickup/enquiries', params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pickup enquiries');
      }

      return response.data!;
    } catch (error) {
      console.error('Failed to get pickup enquiries:', error);
      throw error;
    }
  }

  // Get pickup enquiry by ID
  static async getPickupEnquiry(id: number): Promise<Enquiry> {
    try {
      const response = await apiClient.get<ApiResponse<Enquiry>>(`/pickup/enquiries/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pickup enquiry');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to get pickup enquiry ${id}:`, error);
      throw error;
    }
  }

  // Assign pickup to staff member
  static async assignPickup(id: number, assignedTo: string): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/pickup/enquiries/${id}/assign`, {
        assignedTo
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign pickup');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to assign pickup ${id}:`, error);
      throw error;
    }
  }

  // Mark pickup as collected
  static async markCollected(id: number, collectionPhoto: string, notes?: string): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/pickup/enquiries/${id}/collect`, {
        collectionPhoto,
        notes
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark pickup as collected');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to mark pickup ${id} as collected:`, error);
      throw error;
    }
  }

  // Mark item as received and move to service
  static async markReceived(id: number, receivedPhoto: string, notes?: string, estimatedCost?: number): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/pickup/enquiries/${id}/receive`, {
        receivedPhoto,
        notes,
        estimatedCost
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to mark item as received');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to mark item ${id} as received:`, error);
      throw error;
    }
  }

  // Update pickup status
  static async updateStatus(id: number, status: string, additionalData?: any): Promise<Enquiry> {
    try {
      const response = await apiClient.patch<ApiResponse<Enquiry>>(`/pickup/enquiries/${id}/status`, {
        status,
        additionalData
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update pickup status');
      }

      return response.data!;
    } catch (error) {
      console.error(`Failed to update pickup ${id} status:`, error);
      throw error;
    }
  }
}
// Hook for managing pickup enquiries with polling (FIXED POLLING INTERVAL)
export function usePickupEnquiries(pollInterval: number = 20000) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPickupEnquiries = useCallback(async () => {
    try {
      setError(null);
      const result = await PickupApiService.getPickupEnquiries();
      setEnquiries(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pickup enquiries');
      console.error('Error fetching pickup enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPickupEnquiries();
  }, [fetchPickupEnquiries]);

  // Set up polling with better cleanup
  useEffect(() => {
    // Don't set up polling if interval is too high (prevents runaway polling)
    if (pollInterval > 10000) {
      console.warn(`Polling interval ${pollInterval}ms seems too high, skipping automatic polling`);
      return;
    }

    const interval = setInterval(() => {
      console.log('Polling pickup enquiries...');
      fetchPickupEnquiries();
    }, pollInterval);

    return () => {
      console.log('Cleanup: Clearing pickup enquiries polling interval');
      clearInterval(interval);
    };
  }, [fetchPickupEnquiries, pollInterval]);

  // ... rest of optimistic update methods remain the same
  const assignPickupOptimistic = useCallback(async (id: number, assignedTo: string) => {
    try {
      setEnquiries(prev =>
        prev.map(e => e.id === id ? {
          ...e,
          pickupDetails: { ...e.pickupDetails!, status: 'assigned', assignedTo }
        } : e)
      );

      const updatedEnquiry = await PickupApiService.assignPickup(id, assignedTo);
      setEnquiries(prev => prev.map(e => e.id === id ? updatedEnquiry : e));
      return updatedEnquiry;
    } catch (error) {
      fetchPickupEnquiries();
      throw error;
    }
  }, [fetchPickupEnquiries]);

  const markCollectedOptimistic = useCallback(async (id: number, collectionPhoto: string, notes?: string) => {
    try {
      setEnquiries(prev =>
        prev.map(e => e.id === id ? {
          ...e,
          pickupDetails: {
            ...e.pickupDetails!,
            status: 'collected',
            collectedAt: new Date().toISOString(),
            collectionNotes: notes
          }
        } : e)
      );

      const updatedEnquiry = await PickupApiService.markCollected(id, collectionPhoto, notes);
      setEnquiries(prev => prev.map(e => e.id === id ? updatedEnquiry : e));
      return updatedEnquiry;
    } catch (error) {
      fetchPickupEnquiries();
      throw error;
    }
  }, [fetchPickupEnquiries]);

  const markReceivedOptimistic = useCallback(async (id: number, receivedPhoto: string, notes?: string, estimatedCost?: number) => {
    try {
      setEnquiries(prev => prev.filter(e => e.id !== id));
      const updatedEnquiry = await PickupApiService.markReceived(id, receivedPhoto, notes, estimatedCost);
      return updatedEnquiry;
    } catch (error) {
      fetchPickupEnquiries();
      throw error;
    }
  }, [fetchPickupEnquiries]);

  return {
    enquiries,
    loading,
    error,
    lastUpdate,
    refetch: fetchPickupEnquiries,
    assignPickup: assignPickupOptimistic,
    markCollected: markCollectedOptimistic,
    markReceived: markReceivedOptimistic,
  };
}

// Hook for pickup statistics
export function usePickupStats(pollInterval: number = 500000) {
  const [stats, setStats] = useState<{
    scheduledPickups: number;
    assignedPickups: number;
    collectedPickups: number;
    receivedPickups: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await PickupApiService.getStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pickup statistics');
      console.error('Error fetching pickup statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    // Don't set up polling if interval is too high
    if (pollInterval > 10000) {
      console.warn(`Stats polling interval ${pollInterval}ms seems too high, skipping automatic polling`);
      return;
    }

    const interval = setInterval(() => {
      console.log('Polling pickup stats...');
      fetchStats();
    }, pollInterval);

    return () => {
      console.log('Cleanup: Clearing pickup stats polling interval');
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
export default PickupApiService;    