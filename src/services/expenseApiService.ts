import { ApiResponse } from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration

//  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
//   typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173' 
//     ? `${window.location.origin}/api`
//     : 'http://localhost:3001/api'
// );

const API_BASE_URL = 'http://localhost:3001/api';


const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// Expense Data Types - matching backend ExpenseModel and ExpenseController
export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  billUrl?: string;
  notes?: string;
  employeeId?: number;
  employeeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  monthlySalary: number;
  dateAdded: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  monthlyTotal: number;
  filteredEntries: number;
  averageExpense: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  totalAmount: number;
  entryCount: number;
  percentage: number;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  month?: string;
  year?: string;
  category?: string;
  search?: string;
}

export interface ExpenseListResponse {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseCreateRequest {
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  notes?: string;
  billFile?: File;
}

export interface EmployeeCreateRequest {
  name: string;
  role: string;
  monthlySalary: number;
  dateAdded: string;
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
        'X-Token': this.token,
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

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

  // Expense Methods
  async getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const endpoint = `/expense${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<ExpenseListResponse>(endpoint);
  }

  async getExpenseById(id: number): Promise<Expense> {
    return this.request<Expense>(`/expense/${id}`);
  }

  async createExpense(data: ExpenseCreateRequest): Promise<Expense> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('amount', data.amount.toString());
    formData.append('category', data.category);
    formData.append('date', data.date);
    formData.append('description', data.description);
    if (data.notes) formData.append('notes', data.notes);
    if (data.billFile) formData.append('bill', data.billFile);

    return this.request<Expense>('/expense', {
      method: 'POST',
      body: formData,
    });
  }

  async updateExpense(id: number, data: Partial<ExpenseCreateRequest>): Promise<Expense> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'billFile' && value instanceof File) {
          formData.append('bill', value);
        } else if (key !== 'billFile') {
          formData.append(key, String(value));
        }
      }
    });

    return this.request<Expense>(`/expense/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteExpense(id: number): Promise<void> {
    await this.request<void>(`/expense/${id}`, {
      method: 'DELETE',
    });
  }

  async getExpenseStats(filters: { month?: string; year?: string; category?: string } = {}): Promise<ExpenseStats> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const endpoint = `/expense/stats${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<ExpenseStats>(endpoint);
  }

  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>('/expense/employees/all');
  }

  async createEmployee(data: EmployeeCreateRequest): Promise<Employee> {
    return this.request<Employee>('/expense/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: number, data: Partial<EmployeeCreateRequest>): Promise<Employee> {
    return this.request<Employee>(`/expense/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: number): Promise<void> {
    await this.request<void>(`/expense/employees/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Expense API Service
export const expenseApiService = {
  // Expense CRUD operations
  getExpenses: async (filters: ExpenseFilters = {}): Promise<ExpenseListResponse> => {
    try {
      return await apiClient.getExpenses(filters);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  getExpenseById: async (id: number): Promise<Expense> => {
    try {
      return await apiClient.getExpenseById(id);
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  createExpense: async (data: ExpenseCreateRequest): Promise<Expense> => {
    try {
      return await apiClient.createExpense(data);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  updateExpense: async (id: number, data: Partial<ExpenseCreateRequest>): Promise<Expense> => {
    try {
      return await apiClient.updateExpense(id, data);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  deleteExpense: async (id: number): Promise<void> => {
    try {
      await apiClient.deleteExpense(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  getExpenseStats: async (filters: { month?: string; year?: string; category?: string } = {}): Promise<ExpenseStats> => {
    try {
      return await apiClient.getExpenseStats(filters);
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      throw error;
    }
  },

  // Employee operations
  getEmployees: async (): Promise<Employee[]> => {
    try {
      return await apiClient.getEmployees();
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  createEmployee: async (data: EmployeeCreateRequest): Promise<Employee> => {
    try {
      return await apiClient.createEmployee(data);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id: number, data: Partial<EmployeeCreateRequest>): Promise<Employee> => {
    try {
      return await apiClient.updateEmployee(id, data);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id: number): Promise<void> => {
    try {
      await apiClient.deleteEmployee(id);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },
};

// React Hook for Expense Management
export function useExpenseData(initialFilters: ExpenseFilters = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);

  const fetchExpenses = useCallback(async (newFilters: ExpenseFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const currentFilters = { ...filters, ...newFilters };
      const response = await expenseApiService.getExpenses(currentFilters);

      setExpenses(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
      setFilters(currentFilters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expenses';
      setError(errorMessage);
      console.error('Error in useExpenseData:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchEmployees = useCallback(async () => {
    try {
      const employeeData = await expenseApiService.getEmployees();
      setEmployees(employeeData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      console.error('Error fetching employees:', err);
    }
  }, []);

  const fetchStats = useCallback(async (statsFilters: { month?: string; year?: string; category?: string } = {}) => {
    try {
      const statsData = await expenseApiService.getExpenseStats(statsFilters);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expense stats';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchExpenses();
    fetchEmployees();
    fetchStats();
  }, []);

  // Auto-fetch on mount - ONLY ONCE
  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
    fetchStats();
  }, []); // Empty dependency array to prevent infinite loops

  return {
    expenses,
    employees,
    stats,
    pagination,
    loading,
    error,
    filters,
    fetchExpenses,
    fetchEmployees,
    fetchStats,
    refreshData,
    setFilters,
  };
}

export default expenseApiService;