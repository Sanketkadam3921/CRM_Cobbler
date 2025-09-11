import { Request, Response } from 'express';
import { InventoryModel, InventoryItem, InventoryStats, InventoryCreateRequest, InventoryUpdateRequest } from '../models/InventoryModel';
import { logApi } from '../utils/logger';
import { ApiResponse } from '../types';

export class InventoryController {
  
  // GET /api/inventory/items - Get all inventory items - Added for backend API integration
  static async getAllItems(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Getting all inventory items...');
      
      const items = await InventoryModel.getAllInventoryItems();
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      console.log('✅ [InventoryController] Successfully fetched all inventory items:', items.length, 'items');
      
      const response: ApiResponse<InventoryItem[]> = {
        success: true,
        data: items
      };
      
      res.json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to get all inventory items:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory items'
      };
      
      res.status(500).json(response);
    }
  }

  // GET /api/inventory/items/:id - Get inventory item by ID - Added for backend API integration
  static async getItemById(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Getting inventory item by ID:', id);
      
      const itemId = parseInt(id);
      if (isNaN(itemId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid item ID'
        };
        res.status(400).json(response);
        return;
      }
      
      const item = await InventoryModel.getInventoryItemById(itemId);
      
      if (!item) {
        const duration = Date.now() - startTime;
        logApi.response(req.method, req.url, 404, duration);
        console.log('⚠️ [InventoryController] Inventory item not found:', id);
        
        const response: ApiResponse<null> = {
          success: false,
          error: 'Inventory item not found'
        };
        
        res.status(404).json(response);
        return;
      }
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      console.log('✅ [InventoryController] Successfully fetched inventory item:', id);
      
      const response: ApiResponse<InventoryItem> = {
        success: true,
        data: item
      };
      
      res.json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to get inventory item by ID:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory item'
      };
      
      res.status(500).json(response);
    }
  }

  // POST /api/inventory/items - Create new inventory item - Added for backend API integration
  static async createItem(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Creating new inventory item...');
      console.log('🔄 [InventoryController] Request body:', req.body);
      
      const { name, category, unit, quantity, purchasePrice, sellingPrice } = req.body;
      
      // Validate required fields
      if (!name || !category || !unit || quantity === undefined || purchasePrice === undefined || sellingPrice === undefined) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Missing required fields: name, category, unit, quantity, purchasePrice, sellingPrice'
        };
        res.status(400).json(response);
        return;
      }
      
      // Validate data types
      if (typeof name !== 'string' || typeof category !== 'string' || typeof unit !== 'string') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid data types for name, category, or unit'
        };
        res.status(400).json(response);
        return;
      }
      
      if (typeof quantity !== 'number' || typeof purchasePrice !== 'number' || typeof sellingPrice !== 'number') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid data types for quantity, purchasePrice, or sellingPrice'
        };
        res.status(400).json(response);
        return;
      }
      
      // Validate positive values
      if (quantity < 0 || purchasePrice < 0 || sellingPrice < 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Quantity, purchasePrice, and sellingPrice must be non-negative'
        };
        res.status(400).json(response);
        return;
      }
      
      const itemData: InventoryCreateRequest = {
        name: name.trim(),
        category: category.trim(),
        unit: unit.trim(),
        quantity: Math.floor(quantity),
        purchasePrice: parseFloat(purchasePrice.toFixed(2)),
        sellingPrice: parseFloat(sellingPrice.toFixed(2))
      };
      
      const createdItem = await InventoryModel.createInventoryItem(itemData);
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 201, duration);
      console.log('✅ [InventoryController] Successfully created inventory item:', createdItem.id);
      
      const response: ApiResponse<InventoryItem> = {
        success: true,
        data: createdItem
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to create inventory item:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create inventory item'
      };
      
      res.status(500).json(response);
    }
  }

  // PUT /api/inventory/items/:id - Update inventory item quantity - Added for backend API integration
  static async updateItemQuantity(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Updating inventory item quantity:', id);
      console.log('🔄 [InventoryController] Request body:', req.body);
      
      const itemId = parseInt(id);
      if (isNaN(itemId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid item ID'
        };
        res.status(400).json(response);
        return;
      }
      
      const { quantity, updatedBy } = req.body;
      
      // Validate required fields
      if (quantity === undefined || !updatedBy) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Missing required fields: quantity, updatedBy'
        };
        res.status(400).json(response);
        return;
      }
      
      // Validate data types
      if (typeof quantity !== 'number' || typeof updatedBy !== 'string') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid data types for quantity or updatedBy'
        };
        res.status(400).json(response);
        return;
      }
      
      // Validate positive quantity
      if (quantity < 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Quantity must be non-negative'
        };
        res.status(400).json(response);
        return;
      }
      
      const updateData: InventoryUpdateRequest = {
        quantity: Math.floor(quantity),
        updatedBy: updatedBy.trim()
      };
      
      const updatedItem = await InventoryModel.updateInventoryItemQuantity(itemId, updateData);
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      console.log('✅ [InventoryController] Successfully updated inventory item quantity:', id);
      
      const response: ApiResponse<InventoryItem> = {
        success: true,
        data: updatedItem
      };
      
      res.json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to update inventory item quantity:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory item'
      };
      
      res.status(500).json(response);
    }
  }

  // DELETE /api/inventory/items/:id - Delete inventory item - Added for backend API integration
  static async deleteItem(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Deleting inventory item:', id);
      
      const itemId = parseInt(id);
      if (isNaN(itemId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid item ID'
        };
        res.status(400).json(response);
        return;
      }
      
      await InventoryModel.deleteInventoryItem(itemId);
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      console.log('✅ [InventoryController] Successfully deleted inventory item:', id);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Inventory item deleted successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to delete inventory item:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete inventory item'
      };
      
      res.status(500).json(response);
    }
  }

  // GET /api/inventory/stats - Get inventory statistics - Added for backend API integration
  static async getStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Getting inventory statistics...');
      
      const stats = await InventoryModel.getInventoryStats();
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      console.log('✅ [InventoryController] Successfully fetched inventory statistics:', stats);
      
      const response: ApiResponse<InventoryStats> = {
        success: true,
        data: stats
      };
      
      res.json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to get inventory statistics:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory statistics'
      };
      
      res.status(500).json(response);
    }
  }

  // GET /api/inventory/search - Search inventory items - Added for backend API integration
  static async searchItems(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { q } = req.query;
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      console.log('🔄 [InventoryController] Searching inventory items:', q);
      
      if (!q || typeof q !== 'string') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Search query is required'
        };
        res.status(400).json(response);
        return;
      }
      
      const items = await InventoryModel.searchInventoryItems(q.trim());
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      console.log('✅ [InventoryController] Successfully searched inventory items:', items.length, 'results');
      
      const response: ApiResponse<InventoryItem[]> = {
        success: true,
        data: items
      };
      
      res.json(response);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      console.error('❌ [InventoryController] Failed to search inventory items:', error);
      
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search inventory items'
      };
      
      res.status(500).json(response);
    }
  }
}

export default InventoryController;