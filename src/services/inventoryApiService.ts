import {
  InventoryItem,
  InventoryStats,
  UpdateHistory,
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
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance - SAME AS OTHER SERVICES
const apiClient = new ApiClient(API_BASE_URL, X_TOKEN);

// Inventory API Service - FOLLOWING OTHER SERVICES PATTERN
export class InventoryApiService {
  // Get all inventory items
  static async getAllItems(): Promise<InventoryItem[]> {
    try {
      console.log('🔄 [InventoryApiService] Fetching all inventory items...');
      const response = await apiClient.get<ApiResponse<InventoryItem[]>>('/inventory/items');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inventory items');
      }

      console.log('✅ [InventoryApiService] Successfully fetched inventory items:', response.data?.length, 'items');
      return response.data!;
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to get inventory items:', error);
      throw error;
    }
  }

  // Get inventory item by ID
  static async getItemById(id: number): Promise<InventoryItem | null> {
    try {
      console.log('🔄 [InventoryApiService] Fetching inventory item by ID:', id);
      const response = await apiClient.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inventory item');
      }

      console.log('✅ [InventoryApiService] Successfully fetched inventory item:', id);
      return response.data!;
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to get inventory item by ID:', error);
      throw error;
    }
  }

  // Create new inventory item
  static async createItem(itemData: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  }): Promise<InventoryItem> {
    try {
      console.log('🔄 [InventoryApiService] Creating new inventory item...');
      console.log('🔄 [InventoryApiService] Item data:', itemData);

      const response = await apiClient.post<ApiResponse<InventoryItem>>('/inventory/items', itemData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create inventory item');
      }

      console.log('✅ [InventoryApiService] Successfully created inventory item:', response.data?.id);
      return response.data!;
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to create inventory item:', error);
      throw error;
    }
  }

  // Update inventory item quantity
  static async updateItemQuantity(id: number, quantity: number, updatedBy: string): Promise<InventoryItem> {
    try {
      console.log('🔄 [InventoryApiService] Updating inventory item quantity:', id, 'to', quantity);
      const response = await apiClient.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, {
        quantity,
        updatedBy
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update inventory item');
      }

      console.log('✅ [InventoryApiService] Successfully updated inventory item quantity:', id);
      return response.data!;
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to update inventory item quantity:', error);
      throw error;
    }
  }

  // Delete inventory item
  static async deleteItem(id: number): Promise<void> {
    try {
      console.log('🔄 [InventoryApiService] Deleting inventory item:', id);
      const response = await apiClient.delete<ApiResponse<null>>(`/inventory/items/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete inventory item');
      }

      console.log('✅ [InventoryApiService] Successfully deleted inventory item:', id);
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to delete inventory item:', error);
      throw error;
    }
  }

  // Get inventory statistics
  static async getStats(): Promise<InventoryStats> {
    try {
      console.log('🔄 [InventoryApiService] Fetching inventory statistics...');
      const response = await apiClient.get<ApiResponse<InventoryStats>>('/inventory/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inventory statistics');
      }

      console.log('✅ [InventoryApiService] Successfully fetched inventory statistics:', response.data);
      return response.data!;
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to get inventory statistics:', error);
      throw error;
    }
  }

  // Search inventory items
  static async searchItems(searchTerm: string): Promise<InventoryItem[]> {
    try {
      console.log('🔄 [InventoryApiService] Searching inventory items:', searchTerm);
      const response = await apiClient.get<ApiResponse<InventoryItem[]>>('/inventory/search', { q: searchTerm });

      if (!response.success) {
        throw new Error(response.error || 'Failed to search inventory items');
      }

      console.log('✅ [InventoryApiService] Successfully searched inventory items:', response.data?.length, 'results');
      return response.data!;
    } catch (error) {
      console.error('❌ [InventoryApiService] Failed to search inventory items:', error);
      throw error;
    }
  }
}

// Hook for managing inventory items with polling - SAME PATTERN AS OTHER SERVICES
export function useInventoryItems(pollInterval: number = 500000) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    try {
      console.log('🔄 [useInventoryItems] Fetching inventory items (polling)...');
      setError(null);
      const result = await InventoryApiService.getAllItems();
      setItems(result);
      setLastUpdate(new Date());
      console.log('✅ [useInventoryItems] Successfully updated inventory items:', result.length, 'items');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory items';
      setError(errorMessage);
      console.error('❌ [useInventoryItems] Error fetching inventory items:', err);

      // Set empty array on error to prevent UI issues
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('🚀 [useInventoryItems] Initial inventory items fetch...');
    fetchInventoryItems();
  }, [fetchInventoryItems]);

  // Set up polling
  useEffect(() => {
    console.log('⏰ [useInventoryItems] Setting up inventory items polling with interval:', pollInterval, 'ms');
    const interval = setInterval(fetchInventoryItems, pollInterval);
    return () => {
      console.log('🛑 [useInventoryItems] Clearing inventory items polling interval');
      clearInterval(interval);
    };
  }, [fetchInventoryItems, pollInterval]);

  // Optimistic updates for better UX
  const createItemOptimistic = useCallback(async (itemData: {
    name: string;
    category: string;
    unit: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  }) => {
    try {
      console.log('🔄 [useInventoryItems] Creating item optimistically...');

      // Create optimistic item with temporary ID
      const optimisticItem: InventoryItem = {
        id: Date.now(), // Temporary ID
        name: itemData.name,
        category: itemData.category,
        unit: itemData.unit,
        quantity: itemData.quantity,
        minStock: 5, // Default min stock
        purchasePrice: itemData.purchasePrice,
        sellingPrice: itemData.sellingPrice,
        lastUpdated: new Date().toISOString().split('T')[0],
        lastUpdatedBy: 'System',
        history: [{
          date: new Date().toISOString().split('T')[0],
          updatedBy: 'System',
          action: 'Created',
          quantityChange: itemData.quantity,
          newQuantity: itemData.quantity
        }]
      };

      // Add to state immediately for instant feedback
      setItems(prev => [optimisticItem, ...prev]);

      // Make actual API call
      const createdItem = await InventoryApiService.createItem(itemData);

      // Replace optimistic item with real one
      setItems(prev =>
        prev.map(item => item.id === optimisticItem.id ? createdItem : item)
      );

      console.log('✅ [useInventoryItems] Successfully created item:', createdItem.id);
      return createdItem;
    } catch (error) {
      console.error('❌ [useInventoryItems] Failed to create item, reverting optimistic update:', error);
      // Remove optimistic item on error
      setItems(prev => prev.filter(item => item.id !== Date.now()));
      throw error;
    }
  }, []);

  const updateItemOptimistic = useCallback(async (id: number, quantity: number, updatedBy: string) => {
    try {
      console.log('🔄 [useInventoryItems] Updating item optimistically:', id);

      // Update optimistically
      setItems(prev =>
        prev.map(item => {
          if (item.id === id) {
            const oldQuantity = item.quantity;
            const quantityChange = quantity - oldQuantity;
            return {
              ...item,
              quantity,
              lastUpdated: new Date().toISOString().split('T')[0],
              lastUpdatedBy: updatedBy,
              history: [
                ...item.history,
                {
                  date: new Date().toISOString().split('T')[0],
                  updatedBy,
                  action: 'Updated',
                  quantityChange,
                  newQuantity: quantity
                }
              ]
            };
          }
          return item;
        })
      );

      // Make actual API call
      const updatedItem = await InventoryApiService.updateItemQuantity(id, quantity, updatedBy);

      // Replace with real updated item
      setItems(prev =>
        prev.map(item => item.id === id ? updatedItem : item)
      );

      console.log('✅ [useInventoryItems] Successfully updated item:', id);
      return updatedItem;
    } catch (error) {
      console.error('❌ [useInventoryItems] Failed to update item, reverting optimistic update:', error);
      // Revert optimistic update on error
      fetchInventoryItems();
      throw error;
    }
  }, [fetchInventoryItems]);

  const deleteItemOptimistic = useCallback(async (id: number) => {
    try {
      console.log('🔄 [useInventoryItems] Deleting item optimistically:', id);

      // Remove optimistically
      setItems(prev => prev.filter(item => item.id !== id));

      // Make actual API call
      await InventoryApiService.deleteItem(id);

      console.log('✅ [useInventoryItems] Successfully deleted item:', id);
    } catch (error) {
      console.error('❌ [useInventoryItems] Failed to delete item, restoring item:', error);
      // Restore on error
      fetchInventoryItems();
      throw error;
    }
  }, [fetchInventoryItems]);

  return {
    items,
    loading,
    error,
    lastUpdate,
    refetch: fetchInventoryItems,
    createItem: createItemOptimistic,
    updateItem: updateItemOptimistic,
    deleteItem: deleteItemOptimistic,
  };
}

// Hook for inventory statistics - SAME PATTERN AS OTHER SERVICES
export function useInventoryStats(pollInterval: number = 100000) {
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalQuantity: 0,
    lowStockItems: 0,
    wellStockedItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      console.log('🔄 [useInventoryStats] Fetching inventory statistics (polling)...');
      setError(null);
      const result = await InventoryApiService.getStats();

      // Ensure all values are numbers with fallbacks
      const safeStats: InventoryStats = {
        totalItems: Number(result.totalItems) || 0,
        totalQuantity: Number(result.totalQuantity) || 0,
        lowStockItems: Number(result.lowStockItems) || 0,
        wellStockedItems: Number(result.wellStockedItems) || 0
      };

      setStats(safeStats);
      console.log('✅ [useInventoryStats] Successfully updated inventory statistics:', safeStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory statistics';
      setError(errorMessage);
      console.error('❌ [useInventoryStats] Error fetching inventory statistics:', err);

      // Set safe defaults on error
      setStats({
        totalItems: 0,
        totalQuantity: 0,
        lowStockItems: 0,
        wellStockedItems: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 [useInventoryStats] Initial inventory statistics fetch...');
    fetchStats();

    // Refresh stats every 10 seconds
    console.log('⏰ [useInventoryStats] Setting up inventory statistics polling with interval:', pollInterval, 'ms');
    const interval = setInterval(fetchStats, pollInterval);
    return () => {
      console.log('🛑 [useInventoryStats] Clearing inventory statistics polling interval');
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

// Export the inventory API service for compatibility
export const inventoryApiService = InventoryApiService;

export default InventoryApiService;