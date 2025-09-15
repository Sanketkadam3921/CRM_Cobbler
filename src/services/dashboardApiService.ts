import { ApiResponse } from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
//   typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173' 
//     ? `${window.location.origin}/api`
//     : 'http://localhost:3001/api'
// );

const API_BASE_URL = "/api";
const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// Dashboard Data Types
export interface DashboardCounts {
  totalEnquiries: number;
  totalCompleted: number;
  pendingPickups: number;
  inService: number;
}

export interface DashboardData extends DashboardCounts {
  completedDeliveredRatio: string;
  recentActivity: Array<{
    text: string;
    time: string;
  }>;
  lowStockAlerts: Array<{
    item: string;
    stock: number;
  }>;
}

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

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error instanceof Error ? error : new Error('Network request failed');
    }
  }

  // Dashboard Methods
  async getDashboardCounts(): Promise<DashboardCounts> {
    return this.request<DashboardCounts>('/dashboard/counts');
  }

  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard');
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Dashboard API Service
export const dashboardApiService = {
  // Get dashboard counts only
  getDashboardCounts: async (): Promise<DashboardCounts> => {
    try {
      return await apiClient.getDashboardCounts();
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
      throw error;
    }
  },

  // Get full dashboard data
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      return await apiClient.getDashboardData();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};

// React Hook for Dashboard Data
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await dashboardApiService.getDashboardData();
      setData(dashboardData);
      setCounts(dashboardData); // Extract counts from full data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Error in useDashboardData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const countsData = await dashboardApiService.getDashboardCounts();
      setCounts(countsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard counts';
      setError(errorMessage);
      console.error('Error in useDashboardData (counts):', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, []);

  const refreshCounts = useCallback(() => {
    fetchDashboardCounts();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []); // Empty dependency array to prevent infinite loops

  return {
    data,
    counts,
    loading,
    error,
    refreshData,
    refreshCounts,
    fetchDashboardData,
    fetchDashboardCounts,
  };
}

export default dashboardApiService;