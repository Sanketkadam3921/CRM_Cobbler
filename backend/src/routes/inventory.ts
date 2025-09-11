import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes - Added for backend API integration
router.use(authenticateToken);

// GET /api/inventory/items - Get all inventory items - Added for backend API integration
router.get('/items', InventoryController.getAllItems);

// GET /api/inventory/items/:id - Get inventory item by ID - Added for backend API integration
router.get('/items/:id', InventoryController.getItemById);

// POST /api/inventory/items - Create new inventory item - Added for backend API integration
router.post('/items', InventoryController.createItem);

// PUT /api/inventory/items/:id - Update inventory item quantity - Added for backend API integration
router.put('/items/:id', InventoryController.updateItemQuantity);

// DELETE /api/inventory/items/:id - Delete inventory item - Added for backend API integration
router.delete('/items/:id', InventoryController.deleteItem);

// GET /api/inventory/stats - Get inventory statistics - Added for backend API integration
router.get('/stats', InventoryController.getStats);

// GET /api/inventory/search - Search inventory items - Added for backend API integration
router.get('/search', InventoryController.searchItems);

export default router;