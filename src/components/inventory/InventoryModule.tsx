import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  X,
  Edit,
  ShoppingCart,
  Trash2,
  User,
  Calendar,
  History,
} from "lucide-react";
// Added for backend API integration - replacing localStorage with proper backend APIs
import { useInventoryItems, useInventoryStats } from "@/services/inventoryApiService";
import { InventoryItem, UpdateHistory } from "@/types";


// Removed local interfaces - now using types from @/types for backend API integration
// interface UpdateHistory - now imported from @/types
// interface InventoryItem - now imported from @/types

interface FormData {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  purchasePrice: string;
  sellingPrice: string;
}

// Removed localStorage constants - now using backend APIs for data persistence
// const STORAGE_KEY = "inventory_data"; - removed for backend API integration

export default function InventoryManager() {
  // Replaced localStorage state management with backend API hooks for proper data persistence
  const {
    items: inventory,
    loading: inventoryLoading,
    error: inventoryError,
    createItem,
    updateItem,
    deleteItem
  } = useInventoryItems();

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useInventoryStats();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updaterName, setUpdaterName] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    unit: "",
    quantity: "",
    purchasePrice: "",
    sellingPrice: "",
  });

  // Removed localStorage useEffect hooks - now using backend APIs for data persistence
  // useEffect for loading from localStorage - removed for backend API integration
  // useEffect for saving to localStorage - removed for backend API integration

  // Updated to use backend API stats instead of local calculations for better performance
  const lowStockItems = inventory.filter(
    (item) => item.quantity <= item.minStock
  );
  // Using backend API stats when available, fallback to local calculations
  const totalItems = stats.totalItems || inventory.length;
  const totalQuantity = stats.totalQuantity || inventory.reduce((sum, item) => sum + item.quantity, 0);
  const wellStockedItems = stats.wellStockedItems || (inventory.length - lowStockItems.length);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minStock) {
      return { status: "Low Stock", color: "bg-red-500 text-white" };
    }
    if (item.quantity <= item.minStock * 1.5) {
      return { status: "Medium", color: "bg-yellow-500 text-white" };
    }
    return { status: "Good", color: "bg-green-500 text-white" };
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      unit: "",
      quantity: "",
      purchasePrice: "",
      sellingPrice: "",
    });
  };

  // Updated to use backend API for creating items instead of localStorage
  const handleAddItem = async () => {
    if (
      !formData.name ||
      !formData.category ||
      !formData.unit ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !formData.sellingPrice
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate for negative values
    const quantity = parseFloat(formData.quantity);
    const purchasePrice = parseFloat(formData.purchasePrice);
    const sellingPrice = parseFloat(formData.sellingPrice);

    if (quantity < 0 || purchasePrice < 0 || sellingPrice < 0) {
      alert("Values cannot be negative. Please enter positive numbers only.");
      return;
    }

    try {
      console.log('🔄 [InventoryModule] Creating new inventory item...');
      const newQuantity = parseInt(formData.quantity);

      await createItem({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        quantity: newQuantity,
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice)
      });

      console.log('✅ [InventoryModule] Successfully created inventory item');
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('❌ [InventoryModule] Failed to create inventory item:', error);
      alert(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkStockAlert = (item: InventoryItem) => {
    if (item.quantity < item.minStock) {
      alert(
        `⚠️ LOW STOCK ALERT!\n\nItem: ${item.name}\nCurrent Stock: ${item.quantity} ${item.unit}\nMinimum Required: ${item.minStock} ${item.unit}\n\nPlease restock soon!`
      );
    }
  };

  // Updated to use backend API for updating stock instead of localStorage
  const handleUpdateStock = async (item: InventoryItem, newQuantity: number) => {
    if (!updaterName.trim()) {
      alert("Please provide the name of the person updating the stock.");
      return;
    }

    // Validate for negative values
    if (newQuantity < 0) {
      alert("Quantity cannot be negative. Please enter a positive number.");
      return;
    }

    try {
      console.log('🔄 [InventoryModule] Updating inventory item quantity:', item.id, 'to', newQuantity);

      await updateItem(item.id, newQuantity, updaterName);

      console.log('✅ [InventoryModule] Successfully updated inventory item quantity');
      checkStockAlert({ ...item, quantity: newQuantity });
      setEditingItem(null);
      setShowUpdateForm(false);
      setUpdateQuantity("");
      setUpdaterName("");
    } catch (error) {
      console.error('❌ [InventoryModule] Failed to update inventory item quantity:', error);
      alert(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Updated to use backend API for restocking instead of localStorage
  const handleRestock = async (item: InventoryItem, additionalQuantity: number) => {
    if (additionalQuantity <= 0) {
      alert("Please enter a valid quantity to add (must be greater than 0)");
      return;
    }
    if (!updaterName.trim()) {
      alert("Please provide the name of the person updating the stock.");
      return;
    }

    try {
      console.log('🔄 [InventoryModule] Restocking inventory item:', item.id, 'with', additionalQuantity);
      const newQuantity = item.quantity + additionalQuantity;

      await updateItem(item.id, newQuantity, updaterName);

      console.log('✅ [InventoryModule] Successfully restocked inventory item');
      setEditingItem(null);
      setShowUpdateForm(false);
      setUpdateQuantity("");
      setUpdaterName("");
    } catch (error) {
      console.error('❌ [InventoryModule] Failed to restock inventory item:', error);
      alert(`Failed to restock item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Updated to use backend API for deleting items instead of localStorage
  const handleDeleteItem = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        console.log('🔄 [InventoryModule] Deleting inventory item:', id);

        await deleteItem(id);

        console.log('✅ [InventoryModule] Successfully deleted inventory item:', id);
      } catch (error) {
        console.error('❌ [InventoryModule] Failed to delete inventory item:', error);
        alert(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openUpdateForm = (item: InventoryItem) => {
    setEditingItem(item);
    setShowUpdateForm(true);
    setUpdateQuantity(item.quantity.toString());
  };

  // Step 3: Function to check if restock should be disabled when stock >= 5
  const isRestockDisabled = (quantity: number) => {
    return quantity >= 5;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track materials and stock levels
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Stats - Added loading and error states for backend API integration */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : totalItems}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Total Items
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : totalQuantity}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Total Quantity
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-red-600">
                {statsLoading ? "..." : lowStockItems.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Low Stock Alerts
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {statsLoading ? "..." : wellStockedItems}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Well Stocked
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="p-3 sm:p-4 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <h3 className="font-semibold text-red-800 text-sm sm:text-base">
              Low Stock Alerts
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="text-xs sm:text-sm text-red-800">
                <span className="font-medium">{item.name}</span> - Only{" "}
                {item.quantity} {item.unit} left
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search Inventory"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>
      </Card>

      {/* Add Item Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Item
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only letters, spaces, and basic punctuation
                      if (/^[A-Za-z\s]*$/.test(value)) {
                        handleFormChange("name", value);
                      }
                    }}
                    placeholder="e.g., Leather Polish"
                    required
                  />
                  {formData.name && !/^[A-Za-z\s]+$/.test(formData.name) && (
                    <p className="text-red-500 text-sm mt-1">
                      Item name should not contain numbers.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only letters, spaces, commas and basic punctuation
                      if (/^[A-Za-z\s,]*$/.test(value)) {
                        handleFormChange("category", value);
                      }
                    }}
                    placeholder="e.g., Polish, Soles, Thread"
                    required
                  />
                  {formData.category &&
                    !/^[A-Za-z\s,]+$/.test(formData.category) && (
                      <p className="text-red-500 text-sm mt-1">
                        Category should not contain numbers.
                      </p>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Type <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only letters, spaces, commas
                      if (/^[A-Za-z\s,]*$/.test(value)) {
                        handleFormChange("unit", value);
                      }
                    }}
                    placeholder="e.g., bottles, pairs, spools"
                    required
                  />
                  {formData.unit && !/^[A-Za-z\s,]+$/.test(formData.unit) && (
                    <p className="text-red-500 text-sm mt-1">
                      Unit type should not contain numbers.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || (parseFloat(value) >= 0)) {
                          handleFormChange("quantity", value);
                        }
                      }}
                      placeholder="0"
                      min="0"
                      required
                      className="no-spinner"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      // step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || (parseFloat(value) >= 0)) {
                          handleFormChange("purchasePrice", value);
                        }
                      }}
                      placeholder="0"
                      min="0"
                      required
                      className="no-spinner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      // step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || (parseFloat(value) >= 0)) {
                          handleFormChange("sellingPrice", value);
                        }
                      }}
                      placeholder="0"
                      min="0"
                      required
                      className="no-spinner"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddItem}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Item
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Update Stock Form Modal */}
      {showUpdateForm && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Update Stock
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateForm(false)}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Item: <span className="font-medium">{editingItem.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Current Stock:{" "}
                  <span className="font-medium">
                    {editingItem.quantity} {editingItem.unit}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Quantity
                  </label>
                  <Input
                    type="number"
                    value={updateQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || (parseFloat(value) >= 0)) {
                        setUpdateQuantity(value);
                      }
                    }}
                    placeholder="Enter new quantity"
                    min="0"
                    className="no-spinner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated By <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={updaterName}
                    onChange={(e) => setUpdaterName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpdateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateStock(editingItem, parseInt(updateQuantity))
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Update Stock
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Update History for: {showHistoryModal.name}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryModal(null)}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {showHistoryModal.history &&
                showHistoryModal.history.length > 0 ? (
                <ul className="space-y-4">
                  {showHistoryModal.history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <li key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {entry.updatedBy}{" "}
                            <span className="text-gray-500 font-normal">
                              {entry.action === "Created"
                                ? "created the item"
                                : `updated the stock`}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            {new Date(entry.date).toLocaleDateString('en-GB')}
                          </p>
                          <p className="text-sm text-gray-700">
                            Quantity changed by{" "}
                            <span
                              className={`font-bold ${entry.quantityChange >= 0
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                            >
                              {entry.quantityChange > 0
                                ? `+${entry.quantityChange}`
                                : entry.quantityChange}
                            </span>
                            , new quantity is{" "}
                            <span className="font-bold">
                              {entry.newQuantity}
                            </span>
                            .
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-2" />
                  <p>No history found for this item.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Error Display - Added for backend API integration */}
      {(inventoryError || statsError) && (
        <Card className="p-3 sm:p-4 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <div className="text-sm text-red-800">
              <strong>Error:</strong> {inventoryError || statsError}
            </div>
          </div>
        </Card>
      )}

      {/* Loading State - Added for backend API integration */}
      {inventoryLoading && (
        <Card className="p-3 sm:p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <div className="text-sm text-blue-800">Loading inventory items...</div>
          </div>
        </Card>
      )}

      {/* Inventory List - Added loading and error states for backend API integration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {!inventoryLoading && filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <Card
              key={item.id}
              className="p-4 flex flex-col justify-between bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800">
                    {item.name}
                  </h3>
                  <Badge className={getStockStatus(item).color}>
                    {getStockStatus(item).status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-3">{item.category}</p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                  <div className="font-medium text-gray-700">Stock</div>
                  <div>
                    {item.quantity} {item.unit}
                  </div>
                  <div className="font-medium text-gray-700">Purchase Price</div>
                  <div>₹{item.purchasePrice.toLocaleString()}</div>
                  <div className="font-medium text-gray-700">Selling Price</div>
                  <div>₹{item.sellingPrice.toLocaleString()}</div>
                </div>

                <div className="border-t border-gray-200 pt-3 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-2" />
                    <span className="font-semibold text-blue-600">Last Updated:</span> <span className="ml-1">{new Date(item.lastUpdated).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-2" />
                    <span className="font-semibold text-green-600">Updated By:</span> <span className="ml-1">{item.lastUpdatedBy || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openUpdateForm(item)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowHistoryModal(item)}
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeleteItem(item.id, item.name)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        ) : !inventoryLoading ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>No inventory items found.</p>
            <p className="text-sm">
              Click "Add Item" to get started.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}