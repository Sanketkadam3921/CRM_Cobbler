import { executeQuery, executeTransaction, getConnection } from '../config/database';
import { logDatabase } from '../utils/logger';

// Database interfaces for inventory management - Added for backend API integration
export interface DatabaseInventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  last_updated: string | Date; // Can be string or Date from MySQL
  last_updated_by: string | null;
  created_at: string | Date; // Can be string or Date from MySQL
  updated_at: string | Date; // Can be string or Date from MySQL
}

export interface DatabaseInventoryHistory {
  id: number;
  inventory_item_id: number;
  action: 'Created' | 'Updated';
  quantity_change: number;
  new_quantity: number;
  updated_by: string;
  updated_at: string | Date; // Can be string or Date from MySQL
}

// Frontend interfaces for inventory management - Added for backend API integration
export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  lastUpdated: string;
  lastUpdatedBy?: string;
  history: UpdateHistory[];
}

export interface UpdateHistory {
  date: string;
  updatedBy: string;
  action: "Created" | "Updated";
  quantityChange: number;
  newQuantity: number;
}

export interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  lowStockItems: number;
  wellStockedItems: number;
}

export interface InventoryCreateRequest {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface InventoryUpdateRequest {
  quantity: number;
  updatedBy: string;
}

export class InventoryModel {
  
  // Convert database row to InventoryItem object - Added for backend API integration
  private static mapDatabaseToInventoryItem(dbItem: DatabaseInventoryItem): InventoryItem {
    // Handle date conversion properly - MySQL DATE fields should be in YYYY-MM-DD format
    let lastUpdatedString: string;
    try {
      if (typeof dbItem.last_updated === 'string') {
        // If it's already a string in YYYY-MM-DD format, use it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(dbItem.last_updated)) {
          lastUpdatedString = dbItem.last_updated;
        } else {
          // If it's a different string format, parse it
          const dateObj = new Date(dbItem.last_updated);
          lastUpdatedString = dateObj.toISOString().split('T')[0];
        }
      } else {
        // If it's a Date object, convert to YYYY-MM-DD
        lastUpdatedString = (dbItem.last_updated as Date).toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('❌ [InventoryModel] Error processing last_updated date:', error, 'Value:', dbItem.last_updated);
      lastUpdatedString = new Date().toISOString().split('T')[0]; // Fallback to current date
    }
    
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      quantity: dbItem.quantity,
      minStock: dbItem.min_stock,
      unit: dbItem.unit,
      purchasePrice: dbItem.purchase_price,
      sellingPrice: dbItem.selling_price,
      lastUpdated: lastUpdatedString,
      lastUpdatedBy: dbItem.last_updated_by || undefined,
      history: [] // Will be populated separately
    };
  }

  // Convert InventoryItem object to database row - Added for backend API integration
  private static mapInventoryItemToDatabase(item: Partial<InventoryItem>): Partial<DatabaseInventoryItem> {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      min_stock: item.minStock,
      unit: item.unit,
      purchase_price: item.purchasePrice,
      selling_price: item.sellingPrice,
      last_updated: item.lastUpdated,
      last_updated_by: item.lastUpdatedBy || null
    };
  }

  // Convert database history row to UpdateHistory object - Added for backend API integration
  private static mapDatabaseToUpdateHistory(dbHistory: DatabaseInventoryHistory): UpdateHistory {
    // Return full datetime in ISO format for proper timezone handling on frontend
    let dateString: string;
    try {
      if (typeof dbHistory.updated_at === 'string') {
        // If it's a timestamp string, convert to ISO format
        const dateObj = new Date(dbHistory.updated_at);
        dateString = dateObj.toISOString(); // Full ISO timestamp with timezone
      } else {
        // If it's a Date object, convert to ISO format
        dateString = (dbHistory.updated_at as Date).toISOString(); // Full ISO timestamp with timezone
      }
    } catch (error) {
      console.error('❌ [InventoryModel] Error processing datetime:', error, 'Value:', dbHistory.updated_at);
      dateString = new Date().toISOString(); // Fallback to current datetime
    }
    
    return {
      date: dateString, // Full ISO datetime string for proper timezone handling
      updatedBy: dbHistory.updated_by,
      action: dbHistory.action,
      quantityChange: dbHistory.quantity_change,
      newQuantity: dbHistory.new_quantity
    };
  }

  // Get all inventory items with their history - Added for backend API integration
  static async getAllInventoryItems(): Promise<InventoryItem[]> {
    try {
      logDatabase.query('Fetching all inventory items with history');
      
      // Get all inventory items
      const itemsQuery = `
        SELECT * FROM inventory_items 
        ORDER BY name ASC
      `;
      
      const items = await executeQuery<DatabaseInventoryItem>(itemsQuery);
      
      // Get history for all items
      const historyQuery = `
        SELECT * FROM inventory_history 
        WHERE inventory_item_id IN (${items.map(() => '?').join(',')})
        ORDER BY updated_at DESC
      `;
      
      const historyItems = items.length > 0 
        ? await executeQuery<DatabaseInventoryHistory>(historyQuery, items.map(item => item.id))
        : [];
      
      // Group history by item ID
      const historyByItemId = historyItems.reduce((acc, history) => {
        if (!acc[history.inventory_item_id]) {
          acc[history.inventory_item_id] = [];
        }
        acc[history.inventory_item_id].push(this.mapDatabaseToUpdateHistory(history));
        return acc;
      }, {} as Record<number, UpdateHistory[]>);
      
      // Map items with their history
      const inventoryItems = items.map(item => {
        const inventoryItem = this.mapDatabaseToInventoryItem(item);
        inventoryItem.history = historyByItemId[item.id] || [];
        return inventoryItem;
      });
      
      logDatabase.success('Successfully fetched all inventory items', { 
        itemCount: inventoryItems.length 
      });
      
      return inventoryItems;
    } catch (error) {
      logDatabase.error('Failed to fetch all inventory items', error);
      throw error;
    }
  }

  // Get inventory item by ID with history - Added for backend API integration
  static async getInventoryItemById(id: number): Promise<InventoryItem | null> {
    try {
      logDatabase.query('Fetching inventory item by ID', { id });
      
      // Get the item
      const itemQuery = 'SELECT * FROM inventory_items WHERE id = ?';
      const items = await executeQuery<DatabaseInventoryItem>(itemQuery, [id]);
      
      if (items.length === 0) {
        logDatabase.query('Inventory item not found', { id });
        return null;
      }
      
      // Get history for this item
      const historyQuery = `
        SELECT * FROM inventory_history 
        WHERE inventory_item_id = ? 
        ORDER BY updated_at DESC
      `;
      
      const historyItems = await executeQuery<DatabaseInventoryHistory>(historyQuery, [id]);
      
      // Map item with history
      const inventoryItem = this.mapDatabaseToInventoryItem(items[0]);
      inventoryItem.history = historyItems.map(h => this.mapDatabaseToUpdateHistory(h));
      
      logDatabase.success('Successfully fetched inventory item', { id });
      
      return inventoryItem;
    } catch (error) {
      logDatabase.error('Failed to fetch inventory item by ID', { id, error });
      throw error;
    }
  }

  // Create new inventory item - Added for backend API integration
  static async createInventoryItem(itemData: InventoryCreateRequest): Promise<InventoryItem> {
    try {
      logDatabase.query('Creating new inventory item', itemData);
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      const queries = [
        {
          query: `
            INSERT INTO inventory_items 
            (name, category, quantity, min_stock, unit, purchase_price, selling_price, last_updated, last_updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: [
            itemData.name,
            itemData.category,
            itemData.quantity,
            5, // Default min stock
            itemData.unit,
            itemData.purchasePrice,
            itemData.sellingPrice,
            currentDate,
            'System'
          ]
        }
      ];
      
      const results = await executeTransaction(queries);
      const insertId = (results[0] as any).insertId;
      
      // Add history entry for creation
      const historyQuery = `
        INSERT INTO inventory_history 
        (inventory_item_id, action, quantity_change, new_quantity, updated_by)
        VALUES (?, 'Created', ?, ?, 'System')
      `;
      
      await executeQuery(historyQuery, [insertId, itemData.quantity, itemData.quantity]);
      
      // Fetch the created item with history
      const createdItem = await this.getInventoryItemById(insertId);
      
      if (!createdItem) {
        throw new Error('Failed to fetch created inventory item');
      }
      
      logDatabase.success('Successfully created inventory item', { id: insertId });
      
      return createdItem;
    } catch (error) {
      logDatabase.error('Failed to create inventory item', { itemData, error });
      throw error;
    }
  }

  // Update inventory item quantity - Added for backend API integration
  static async updateInventoryItemQuantity(id: number, updateData: InventoryUpdateRequest): Promise<InventoryItem> {
    try {
      logDatabase.query('Updating inventory item quantity', { id, updateData });
      
      // Get current item to calculate quantity change
      const currentItem = await this.getInventoryItemById(id);
      if (!currentItem) {
        throw new Error('Inventory item not found');
      }
      
      const quantityChange = updateData.quantity - currentItem.quantity;
      const currentDate = new Date().toISOString().split('T')[0];
      
      const queries = [
        {
          query: `
            UPDATE inventory_items 
            SET quantity = ?, last_updated = ?, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          params: [updateData.quantity, currentDate, updateData.updatedBy, id]
        }
      ];
      
      await executeTransaction(queries);
      
      // Add history entry for update
      const historyQuery = `
        INSERT INTO inventory_history 
        (inventory_item_id, action, quantity_change, new_quantity, updated_by)
        VALUES (?, 'Updated', ?, ?, ?)
      `;
      
      await executeQuery(historyQuery, [id, quantityChange, updateData.quantity, updateData.updatedBy]);
      
      // Fetch the updated item with history
      const updatedItem = await this.getInventoryItemById(id);
      
      if (!updatedItem) {
        throw new Error('Failed to fetch updated inventory item');
      }
      
      logDatabase.success('Successfully updated inventory item quantity', { id, quantityChange });
      
      return updatedItem;
    } catch (error) {
      logDatabase.error('Failed to update inventory item quantity', { id, updateData, error });
      throw error;
    }
  }

  // Delete inventory item - Added for backend API integration
  static async deleteInventoryItem(id: number): Promise<void> {
    try {
      logDatabase.query('Deleting inventory item', { id });
      
      // Check if item exists
      const existingItem = await this.getInventoryItemById(id);
      if (!existingItem) {
        throw new Error('Inventory item not found');
      }
      
      // Delete item (history will be deleted automatically due to CASCADE)
      const deleteQuery = 'DELETE FROM inventory_items WHERE id = ?';
      await executeQuery(deleteQuery, [id]);
      
      logDatabase.success('Successfully deleted inventory item', { id });
    } catch (error) {
      logDatabase.error('Failed to delete inventory item', { id, error });
      throw error;
    }
  }

  // Get inventory statistics - Added for backend API integration
  static async getInventoryStats(): Promise<InventoryStats> {
    try {
      logDatabase.query('Fetching inventory statistics');
      
      const statsQuery = `
        SELECT 
          COUNT(*) as total_items,
          SUM(quantity) as total_quantity,
          SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END) as low_stock_items,
          SUM(CASE WHEN quantity > min_stock THEN 1 ELSE 0 END) as well_stocked_items
        FROM inventory_items
      `;
      
      const results = await executeQuery<{
        total_items: number;
        total_quantity: number;
        low_stock_items: number;
        well_stocked_items: number;
      }>(statsQuery);
      
      const stats = results[0];
      
      const inventoryStats: InventoryStats = {
        totalItems: stats.total_items || 0,
        totalQuantity: stats.total_quantity || 0,
        lowStockItems: stats.low_stock_items || 0,
        wellStockedItems: stats.well_stocked_items || 0
      };
      
      logDatabase.success('Successfully fetched inventory statistics', inventoryStats);
      
      return inventoryStats;
    } catch (error) {
      logDatabase.error('Failed to fetch inventory statistics', error);
      throw error;
    }
  }

  // Search inventory items - Added for backend API integration
  static async searchInventoryItems(searchTerm: string): Promise<InventoryItem[]> {
    try {
      logDatabase.query('Searching inventory items', { searchTerm });
      
      const searchQuery = `
        SELECT * FROM inventory_items 
        WHERE name LIKE ? OR category LIKE ?
        ORDER BY name ASC
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const items = await executeQuery<DatabaseInventoryItem>(searchQuery, [searchPattern, searchPattern]);
      
      // Get history for found items
      const historyQuery = `
        SELECT * FROM inventory_history 
        WHERE inventory_item_id IN (${items.map(() => '?').join(',')})
        ORDER BY updated_at DESC
      `;
      
      const historyItems = items.length > 0 
        ? await executeQuery<DatabaseInventoryHistory>(historyQuery, items.map(item => item.id))
        : [];
      
      // Group history by item ID
      const historyByItemId = historyItems.reduce((acc, history) => {
        if (!acc[history.inventory_item_id]) {
          acc[history.inventory_item_id] = [];
        }
        acc[history.inventory_item_id].push(this.mapDatabaseToUpdateHistory(history));
        return acc;
      }, {} as Record<number, UpdateHistory[]>);
      
      // Map items with their history
      const inventoryItems = items.map(item => {
        const inventoryItem = this.mapDatabaseToInventoryItem(item);
        inventoryItem.history = historyByItemId[item.id] || [];
        return inventoryItem;
      });
      
      logDatabase.success('Successfully searched inventory items', { 
        searchTerm, 
        itemCount: inventoryItems.length 
      });
      
      return inventoryItems;
    } catch (error) {
      logDatabase.error('Failed to search inventory items', { searchTerm, error });
      throw error;
    }
  }
}

export default InventoryModel;


