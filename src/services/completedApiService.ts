import { 
  Enquiry, 
  ApiResponse 
} from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration - SAME AS OTHER SERVICES
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173' 
    ? `${window.location.origin}/api`
    : 'http://localhost:3001/api'
);

// const API_BASE_URL='http://localhost:3001/api';

const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// HTTP Client with authentication - SAME AS OTHER SERVICES
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
}

// Create API client instance - SAME AS OTHER SERVICES
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Completed enquiry interface for frontend (matches backend)
export interface CompletedEnquiry {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  message: string;
  inquiryType: string;
  product: string;
  quantity: number;
  date: string;
  status: string;
  contacted: boolean;
  contactedAt?: string;
  assignedTo?: string;
  notes?: string;
  currentStage: string;
  quotedAmount?: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;
  
  // Billing details
  billedAmount?: number;
  subtotalAmount?: number;
  gstAmount?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  
  // Delivery details
  deliveredAt?: string;
  deliveryMethod?: string;
  deliveryNotes?: string;
  
  // Service details
  serviceTypes?: string;
  workNotes?: string;
}

// Completed statistics interface
export interface CompletedStats {
  totalCompleted: number;
  completedThisWeek: number;
  totalRevenue: number;
  avgCompletionTime: number;
}

// Completed API Service - FOLLOWING SAME PATTERN AS OTHER SERVICES
export class CompletedApiService {
  // Get all completed enquiries
  static async getCompletedEnquiries(): Promise<CompletedEnquiry[]> {
    try {
      console.log('CompletedApiService.getCompletedEnquiries - Starting API call');
      
      const response = await apiClient.get<ApiResponse<CompletedEnquiry[]>>('/completed/enquiries');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch completed enquiries');
      }
      
      console.log('CompletedApiService.getCompletedEnquiries - Success', {
        count: response.data?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      return response.data!;
    } catch (error) {
      console.error('CompletedApiService.getCompletedEnquiries - Error:', error);
      throw error;
    }
  }

  // Get completed statistics
  static async getCompletedStats(): Promise<CompletedStats> {
    try {
      console.log('CompletedApiService.getCompletedStats - Starting API call');
      
      const response = await apiClient.get<ApiResponse<CompletedStats>>('/completed/stats');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch completed statistics');
      }
      
      console.log('CompletedApiService.getCompletedStats - Success', {
        stats: response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data!;
    } catch (error) {
      console.error('CompletedApiService.getCompletedStats - Error:', error);
      throw error;
    }
  }

  // Get specific completed enquiry by ID
  static async getCompletedEnquiryById(id: number): Promise<CompletedEnquiry | null> {
    try {
      console.log('CompletedApiService.getCompletedEnquiryById - Starting API call', { id });
      
      const response = await apiClient.get<ApiResponse<CompletedEnquiry>>(`/completed/enquiries/${id}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch completed enquiry');
      }
      
      console.log('CompletedApiService.getCompletedEnquiryById - Success', {
        id,
        found: !!response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data!;
    } catch (error) {
      console.error('CompletedApiService.getCompletedEnquiryById - Error:', { id, error });
      throw error;
    }
  }
}

// Hook for managing completed enquiries with polling - SAME PATTERN AS OTHER SERVICES
export function useCompletedEnquiries(pollInterval: number = 200000) {
  const [enquiries, setEnquiries] = useState<CompletedEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCompletedEnquiries = useCallback(async () => {
    try {
      console.log('useCompletedEnquiries.fetchCompletedEnquiries - Starting fetch');
      setError(null);
      
      const result = await CompletedApiService.getCompletedEnquiries();
      setEnquiries(result);
      setLastUpdate(new Date());
      
      console.log('useCompletedEnquiries.fetchCompletedEnquiries - Success', {
        count: result.length,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch completed enquiries';
      setError(errorMessage);
      console.error('useCompletedEnquiries.fetchCompletedEnquiries - Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('useCompletedEnquiries - Initial fetch starting');
    fetchCompletedEnquiries();
  }, [fetchCompletedEnquiries]);

  // Set up polling
  useEffect(() => {
    console.log('useCompletedEnquiries - Setting up polling', { pollInterval });
    const interval = setInterval(fetchCompletedEnquiries, pollInterval);
    return () => {
      console.log('useCompletedEnquiries - Clearing polling interval');
      clearInterval(interval);
    };
  }, [fetchCompletedEnquiries, pollInterval]);

  return {
    enquiries,
    loading,
    error,
    lastUpdate,
    refetch: fetchCompletedEnquiries,
  };
}

// Hook for completed statistics - SAME PATTERN AS OTHER SERVICES
export function useCompletedStats(pollInterval: number = 500000) {
  const [stats, setStats] = useState<CompletedStats>({
    totalCompleted: 0,
    completedThisWeek: 0,
    totalRevenue: 0,
    avgCompletionTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      console.log('useCompletedStats.fetchStats - Starting fetch');
      setError(null);
      
      const result = await CompletedApiService.getCompletedStats();
      setStats(result);
      
      console.log('useCompletedStats.fetchStats - Success', {
        stats: result,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch completed statistics';
      setError(errorMessage);
      console.error('useCompletedStats.fetchStats - Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('useCompletedStats - Initial fetch starting');
    fetchStats();
    
    // Refresh stats every 5 seconds
    const interval = setInterval(fetchStats, pollInterval);
    return () => {
      console.log('useCompletedStats - Clearing polling interval');
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

// Export the service for compatibility
export const completedApiService = CompletedApiService;

export default CompletedApiService;