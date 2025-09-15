import {
  Enquiry,
  InventoryItem,
  Expense,
  StaffMember,
  BusinessInfo
} from "@/types";

import {
  sampleEnquiries,
  sampleInventory,
  sampleExpenses,
  sampleStaff
} from "@/data/dummyData";

// Storage keys - Removed separate pickup/service orders as they're now part of enquiries
export const STORAGE_KEYS = {
  ENQUIRIES: 'cobbler_enquiries',
  INVENTORY: 'cobbler_inventory',
  EXPENSES: 'cobbler_expenses',
  STAFF: 'cobbler_staff',
  INITIALIZED: 'cobbler_initialized',
  IMAGES: 'cobbler_images', // Separate storage for images
  BUSINESS_INFO: 'cobbler_business_info' // Business information
} as const;

// Image storage management
export const imageStorage = {
  // Generate unique key for image
  generateKey: (enquiryId: number, stage: string, type: string): string => {
    return `img_${enquiryId}_${stage}_${type}`;
  },

  // Create thumbnail preview from image data with BETTER QUALITY
  createThumbnail: (imageData: string, maxWidth: number = 300, maxHeight: number = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageData);
          return;
        }

        // Calculate thumbnail dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw thumbnail with better quality
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with BETTER QUALITY (85% instead of 70%)
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.85);
        resolve(thumbnailData);
      };

      img.onerror = () => {
        resolve(imageData);
      };

      img.src = imageData;
    });
  },

  // Create display thumbnail for UI (separate from storage thumbnail)
  createDisplayThumbnail: (imageData: string, maxWidth: number = 300, maxHeight: number = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageData);
          return;
        }

        // Calculate thumbnail dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Enable high-quality rendering for thumbnails too
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw thumbnail
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with good quality for display
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.85);
        resolve(thumbnailData);
      };

      img.onerror = () => {
        resolve(imageData);
      };

      img.src = imageData;
    });
  },

  // Store image data as thumbnail
  save: async (key: string, imageData: string): Promise<void> => {
    try {
      // Create thumbnail for storage with better quality
      const thumbnailData = await imageStorage.createThumbnail(imageData);
      localStorage.setItem(key, thumbnailData);
    } catch (error) {
      console.warn(`Failed to save image ${key}:`, error);
      // If quota exceeded, try to clean old images
      try {
        const keys = Object.keys(localStorage);
        const imageKeys = keys.filter(k => k.startsWith('img_'));
        if (imageKeys.length > 20) {
          // Remove oldest images
          imageKeys.slice(0, 10).forEach(k => localStorage.removeItem(k));
          const thumbnailData = await imageStorage.createThumbnail(imageData);
          localStorage.setItem(key, thumbnailData);
        }
      } catch (cleanupError) {
        console.error('Failed to save image even after cleanup:', cleanupError);
      }
    }
  },

  // Get image data
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading image ${key}:`, error);
      return null;
    }
  },

  // Remove image
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing image ${key}:`, error);
    }
  },

  // Create a simple placeholder image
  createPlaceholder: (text: string, width: number = 300, height: number = 300): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QbGFjZWhvbGRlcjwvdGV4dD4KPC9zdmc+Cg==';
    }

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    return canvas.toDataURL('image/png', 0.9);
  }
};

// Generic localStorage utilities
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      // Try to save normally first
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Storage quota exceeded for key "${key}". Attempting cleanup...`);

      // If quota exceeded, try to clean up old data
      try {
        // Clear old data to free space
        localStorage.removeItem('cobbler_service_orders');
        localStorage.removeItem('cobbler_pickup_orders');

        // Try saving again
        localStorage.setItem(key, JSON.stringify(value));
        console.log('Successfully saved after cleanup');
      } catch (cleanupError) {
        console.error(`Failed to save even after cleanup:`, cleanupError);

        // If still failing, try to compress the data by removing large fields
        try {
          const compressedValue = JSON.stringify(value).replace(/data:image\/[^;]+;base64,[^"]+/g, '[IMAGE_DATA]');
          localStorage.setItem(key, compressedValue);
          console.log('Saved compressed data (images removed)');
        } catch (compressionError) {
          console.error('Failed to save even compressed data:', compressionError);
        }
      }
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    try {
      // Only clear our app's data, not all localStorage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      // Also clear image data
      const keys = Object.keys(localStorage);
      keys.filter(k => k.startsWith('img_')).forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Initialize data in localStorage if not present
export const initializeData = (): void => {
  const isInitialized = storage.get(STORAGE_KEYS.INITIALIZED, false);

  // Force reinitialize with new schema (remove this check after migration)
  const currentVersion = storage.get<string>('cobbler_schema_version', '1.0');
  const newVersion = '4.0'; // Force refresh with new billing system

  if (!isInitialized || currentVersion !== newVersion) {
    console.log('Initializing localStorage with new integrated workflow data...');

    // Clear any old fragmented data
    localStorage.removeItem('cobbler_service_orders');
    localStorage.removeItem('cobbler_pickup_orders');

    // Initialize with new integrated data structure
    storage.set(STORAGE_KEYS.ENQUIRIES, sampleEnquiries);
    storage.set(STORAGE_KEYS.INVENTORY, sampleInventory);
    storage.set(STORAGE_KEYS.EXPENSES, sampleExpenses);
    storage.set(STORAGE_KEYS.STAFF, sampleStaff);

    // Mark as initialized with new version
    storage.set(STORAGE_KEYS.INITIALIZED, true);
    storage.set('cobbler_schema_version', newVersion);

    console.log('New integrated workflow data initialized in localStorage');
  }
};

// Enquiries data management
export const enquiriesStorage = {
  getAll: (): Enquiry[] => storage.get(STORAGE_KEYS.ENQUIRIES, []),

  save: (enquiries: Enquiry[]): void => {
    // Save data directly without cleaning image data
    storage.set(STORAGE_KEYS.ENQUIRIES, enquiries);
  },

  add: (enquiry: Omit<Enquiry, 'id'>): Enquiry => {
    const enquiries = enquiriesStorage.getAll();
    const newId = Math.max(0, ...enquiries.map(e => e.id)) + 1;
    const newEnquiry: Enquiry = { ...enquiry, id: newId };
    enquiries.push(newEnquiry);
    enquiriesStorage.save(enquiries);
    return newEnquiry;
  },

  update: (id: number, updates: Partial<Enquiry>): Enquiry | null => {
    const enquiries = enquiriesStorage.getAll();
    const index = enquiries.findIndex(e => e.id === id);
    if (index === -1) return null;

    enquiries[index] = { ...enquiries[index], ...updates };
    enquiriesStorage.save(enquiries);
    return enquiries[index];
  },

  delete: (id: number): boolean => {
    const enquiries = enquiriesStorage.getAll();
    const index = enquiries.findIndex(e => e.id === id);
    if (index === -1) return false;

    enquiries.splice(index, 1);
    enquiriesStorage.save(enquiries);
    return true;
  }
};

// Helper functions for workflow management
export const workflowHelpers = {
  // Get enquiries by current stage
  getByStage: (stage: string): Enquiry[] => {
    const enquiries = enquiriesStorage.getAll();
    return enquiries.filter(e => e.currentStage === stage);
  },

  // Get pickup stage enquiries
  getPickupEnquiries: (): Enquiry[] => {
    return workflowHelpers.getByStage('pickup');
  },

  // Get service stage enquiries  
  getServiceEnquiries: (): Enquiry[] => {
    return workflowHelpers.getByStage('service');
  },

  // Get billing stage enquiries
  getBillingEnquiries: (): Enquiry[] => {
    return workflowHelpers.getByStage('billing');
  },

  // Get delivery stage enquiries
  getDeliveryEnquiries: (): Enquiry[] => {
    return workflowHelpers.getByStage('delivery');
  },

  // Get completed stage enquiries
  getCompletedEnquiries: (): Enquiry[] => {
    return workflowHelpers.getByStage('completed');
  },

  // Transition enquiry to next stage
  transitionToStage: (enquiryId: number, newStage: string): boolean => {
    const enquiries = enquiriesStorage.getAll();
    const index = enquiries.findIndex(e => e.id === enquiryId);
    if (index === -1) return false;

    enquiries[index] = { ...enquiries[index], currentStage: newStage as any };
    enquiriesStorage.save(enquiries);
    return true;
  }
};

// Inventory data management
export const inventoryStorage = {
  getAll: (): InventoryItem[] => storage.get(STORAGE_KEYS.INVENTORY, []),

  save: (items: InventoryItem[]): void => storage.set(STORAGE_KEYS.INVENTORY, items),

  add: (item: Omit<InventoryItem, 'id'>): InventoryItem => {
    const items = inventoryStorage.getAll();
    const newId = Math.max(0, ...items.map(i => i.id)) + 1;
    const newItem: InventoryItem = { ...item, id: newId };
    items.push(newItem);
    inventoryStorage.save(items);
    return newItem;
  },

  update: (id: number, updates: Partial<InventoryItem>): InventoryItem | null => {
    const items = inventoryStorage.getAll();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates };
    inventoryStorage.save(items);
    return items[index];
  },

  delete: (id: number): boolean => {
    const items = inventoryStorage.getAll();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return false;

    items.splice(index, 1);
    inventoryStorage.save(items);
    return true;
  }
};

// Expenses data management
export const expensesStorage = {
  getAll: (): Expense[] => storage.get(STORAGE_KEYS.EXPENSES, []),

  save: (expenses: Expense[]): void => storage.set(STORAGE_KEYS.EXPENSES, expenses),

  add: (expense: Omit<Expense, 'id'>): Expense => {
    const expenses = expensesStorage.getAll();
    const newId = Math.max(0, ...expenses.map(e => e.id)) + 1;
    const newExpense: Expense = { ...expense, id: newId };
    expenses.push(newExpense);
    expensesStorage.save(expenses);
    return newExpense;
  },

  update: (id: number, updates: Partial<Expense>): Expense | null => {
    const expenses = expensesStorage.getAll();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    expenses[index] = { ...expenses[index], ...updates };
    expensesStorage.save(expenses);
    return expenses[index];
  },

  delete: (id: number): boolean => {
    const expenses = expensesStorage.getAll();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return false;

    expenses.splice(index, 1);
    expensesStorage.save(expenses);
    return true;
  }
};

// Staff data management
export const staffStorage = {
  getAll: (): StaffMember[] => storage.get(STORAGE_KEYS.STAFF, []),

  save: (staff: StaffMember[]): void => storage.set(STORAGE_KEYS.STAFF, staff),

  add: (member: Omit<StaffMember, 'id'>): StaffMember => {
    const staff = staffStorage.getAll();
    const newId = Math.max(0, ...staff.map(s => s.id)) + 1;
    const newMember: StaffMember = { ...member, id: newId };
    staff.push(newMember);
    staffStorage.save(staff);
    return newMember;
  },

  update: (id: number, updates: Partial<StaffMember>): StaffMember | null => {
    const staff = staffStorage.getAll();
    const index = staff.findIndex(s => s.id === id);
    if (index === -1) return null;

    staff[index] = { ...staff[index], ...updates };
    staffStorage.save(staff);
    return staff[index];
  },

  delete: (id: number): boolean => {
    const staff = staffStorage.getAll();
    const index = staff.findIndex(s => s.id === id);
    if (index === -1) return false;

    staff.splice(index, 1);
    staffStorage.save(staff);
    return true;
  }
};

// Business info data management
export const businessInfoStorage = {
  get: (): BusinessInfo => storage.get(STORAGE_KEYS.BUSINESS_INFO, {
    businessName: "Ranjit's Shoe & Bag Repair",
    ownerName: "Ranjit Kumar",
    phone: "+91 98765 43210",
    email: "ranjit@example.com",
    address: "123 MG Road, Pune, Maharashtra",
    gstNumber: "27XXXXX1234X1Z5",
    timezone: "Asia/Kolkata",
    currency: "INR",
    logo: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImxvZ29HcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzQjgyRjY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzFENEVEOEQ7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjIwIiBmaWxsPSJ1cmwoI2xvZ29HcmFkaWVudCkiLz4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iMjUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjkiLz4KICA8cGF0aCBkPSJNNzAgMTIwIFEgMTAwIDE0MCAxMzAgMTIwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCI+UlNSPC90ZXh0Pgo8L3N2Zz4K",
    website: "www.ranjitsrepair.com",
    tagline: "Quality Repair Services"
  }),

  save: (businessInfo: BusinessInfo): void => storage.set(STORAGE_KEYS.BUSINESS_INFO, businessInfo),

  update: (updates: Partial<BusinessInfo>): BusinessInfo => {
    const current = businessInfoStorage.get();
    const updated = { ...current, ...updates };
    businessInfoStorage.save(updated);
    return updated;
  }
};

// Utility to reset all data to sample data
export const resetToSampleData = (): void => {
  console.log('Resetting all data to sample data...');
  storage.clear();
  initializeData();
  console.log('Data reset completed');
};

// Utility to export all data
export const exportAllData = () => {
  return {
    enquiries: enquiriesStorage.getAll(),
    inventory: inventoryStorage.getAll(),
    expenses: expensesStorage.getAll(),
    staff: staffStorage.getAll(),
    exportedAt: new Date().toISOString()
  };
};

// Utility to import all data
export const importAllData = (data: ReturnType<typeof exportAllData>): void => {
  if (data.enquiries) storage.set(STORAGE_KEYS.ENQUIRIES, data.enquiries);
  if (data.inventory) storage.set(STORAGE_KEYS.INVENTORY, data.inventory);
  if (data.expenses) storage.set(STORAGE_KEYS.EXPENSES, data.expenses);
  if (data.staff) storage.set(STORAGE_KEYS.STAFF, data.staff);

  console.log('Data import completed');
};

// Utility to handle image uploads with HIGH QUALITY preservation
export const imageUploadHelper = {
  // Handle file upload and preserve FULL QUALITY for API
  handleImageUpload: async (file: File, maxSize: number = 1920): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageData = e.target?.result as string;

          // Create HIGH QUALITY version for API submission
          const highQualityData = await imageUploadHelper.createHighQualityImage(imageData, maxSize);
          resolve(highQualityData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  // Create HIGH QUALITY image for API submission
  createHighQualityImage: (imageData: string, maxSize: number = 1920): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageData); // Fallback to original if canvas not supported
          return;
        }

        // Calculate dimensions while preserving aspect ratio
        let { width, height } = img;

        // Only resize if image is larger than maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with high quality
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with HIGH QUALITY (95% instead of 70%)
        const highQualityData = canvas.toDataURL('image/jpeg', 0.95);
        resolve(highQualityData);
      };

      img.onerror = () => {
        resolve(imageData); // Fallback to original if image fails to load
      };

      img.src = imageData;
    });
  },

  // Create thumbnail for display only (separate from API submission)
  createDisplayThumbnail: (imageData: string, maxWidth: number = 300, maxHeight: number = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageData);
          return;
        }

        // Calculate thumbnail dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Enable high-quality rendering for thumbnails too
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw thumbnail
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with good quality for display
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.85);
        resolve(thumbnailData);
      };

      img.onerror = () => {
        resolve(imageData);
      };

      img.src = imageData;
    });
  },

  // Save image with automatic thumbnail creation for localStorage
  saveImage: async (enquiryId: number, stage: string, type: string, imageData: string): Promise<void> => {
    const key = imageStorage.generateKey(enquiryId, stage, type);
    // Create thumbnail for localStorage to save space
    const thumbnailData = await imageUploadHelper.createDisplayThumbnail(imageData);
    await imageStorage.save(key, thumbnailData);
  },

  // Get image thumbnail
  getImage: (enquiryId: number, stage: string, type: string): string | null => {
    const key = imageStorage.generateKey(enquiryId, stage, type);
    return imageStorage.get(key);
  },

  // Remove image
  removeImage: (enquiryId: number, stage: string, type: string): void => {
    const key = imageStorage.generateKey(enquiryId, stage, type);
    imageStorage.remove(key);
  }
};