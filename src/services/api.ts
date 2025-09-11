import { ApiResponse, PaginatedResponse } from "@/types";

// API configuration
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// const API_BASE_URL='http://localhost:3001/api'
//
//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
// typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173'
//  ? `${window.location.origin}/api`
// : 'http://localhost:3001/api'
//);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API request options
export interface ApiRequestOptions {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
}

// API error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API client class
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const config: RequestInit = {
      method: options.method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url.toString(), config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || response.statusText,
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error', error);
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  // Enquiries
  enquiries: '/enquiries',
  enquiry: (id: number) => `/enquiries/${id}`,

  // Services
  services: '/services',
  service: (id: number) => `/services/${id}`,
  serviceStatus: (id: number) => `/services/${id}/status`,

  // Pickups
  pickups: '/pickups',
  pickup: (id: number) => `/pickups/${id}`,
  pickupStatus: (id: number) => `/pickups/${id}/status`,

  // Inventory
  inventory: '/inventory',
  inventoryItem: (id: number) => `/inventory/${id}`,
  lowStock: '/inventory/low-stock',

  // Expenses
  expenses: '/expenses',
  expense: (id: number) => `/expenses/${id}`,
  monthlyExpenses: '/expenses/monthly',

  // Customers
  customers: '/customers',
  customer: (id: number) => `/customers/${id}`,

  // Staff
  staff: '/staff',
  staffMember: (id: number) => `/staff/${id}`,

  // Dashboard
  dashboard: '/dashboard/stats',

  // Reports
  reports: '/reports',
  serviceReport: '/reports/services',
  expenseReport: '/reports/expenses',
  revenueReport: '/reports/revenue',
} as const;

// API service functions
export const apiService = {
  // Enquiry services
  enquiries: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.enquiries, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.enquiry(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.enquiries, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.enquiry(id), data),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.enquiry(id)),
  },

  // Service services
  services: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.services, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.service(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.services, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.service(id), data),
    updateStatus: (id: number, status: string) =>
      apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.serviceStatus(id), { status }),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.service(id)),
  },

  // Pickup services
  pickups: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.pickups, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.pickup(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.pickups, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.pickup(id), data),
    updateStatus: (id: number, status: string) =>
      apiClient.patch<ApiResponse<any>>(API_ENDPOINTS.pickupStatus(id), { status }),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.pickup(id)),
  },

  // Inventory services
  inventory: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.inventory, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.inventoryItem(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.inventory, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.inventoryItem(id), data),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.inventoryItem(id)),
    getLowStock: () =>
      apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.lowStock),
  },

  // Expense services
  expenses: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.expenses, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.expense(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.expenses, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.expense(id), data),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.expense(id)),
    getMonthly: (month: string) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.monthlyExpenses, { month }),
  },

  // Customer services
  customers: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.customers, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.customer(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.customers, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.customer(id), data),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.customer(id)),
  },

  // Staff services
  staff: {
    getAll: (params?: Record<string, any>) =>
      apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.staff, params),
    getById: (id: number) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.staffMember(id)),
    create: (data: any) =>
      apiClient.post<ApiResponse<any>>(API_ENDPOINTS.staff, data),
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse<any>>(API_ENDPOINTS.staffMember(id), data),
    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.staffMember(id)),
  },

  // Dashboard services
  dashboard: {
    getStats: () =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.dashboard),
  },

  // Report services
  reports: {
    getServiceReport: (params?: Record<string, any>) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.serviceReport, params),
    getExpenseReport: (params?: Record<string, any>) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.expenseReport, params),
    getRevenueReport: (params?: Record<string, any>) =>
      apiClient.get<ApiResponse<any>>(API_ENDPOINTS.revenueReport, params),
  },
};

// Utility functions
export const apiUtils = {
  // Handle API errors
  handleError: (error: unknown): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Format API response
  formatResponse: <T>(response: ApiResponse<T>): T => {
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    return response.data!;
  },

  // Create query string from params
  createQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },
};