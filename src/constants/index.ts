// Status options
export const ENQUIRY_STATUS_OPTIONS = [
  { value: "new", label: "New", color: "blue" },
  { value: "contacted", label: "Contacted", color: "yellow" },
  { value: "converted", label: "Converted", color: "green" },
  { value: "closed", label: "Closed", color: "gray" },
  { value: "lost", label: "Lost", color: "red" },
] as const;

export const SERVICE_STATUS_OPTIONS = [
  { value: "in-progress", label: "In Progress", color: "blue" },
  { value: "photos-taken", label: "Photos Taken", color: "purple" },
  { value: "awaiting-approval", label: "Awaiting Approval", color: "yellow" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "billed", label: "Billed", color: "orange" },
  { value: "sent-to-department", label: "Sent to Department", color: "indigo" },
  { value: "work-in-department", label: "Work in Department", color: "cyan" },
  { value: "work-done", label: "Work Done", color: "emerald" },
] as const;

export const PICKUP_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "gray" },
  { value: "assigned", label: "Assigned", color: "blue" },
  { value: "picked-up", label: "Picked Up", color: "yellow" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "received", label: "Received", color: "purple" },
  { value: "in-service", label: "In Service", color: "orange" },
] as const;

// Category options
export const INQUIRY_TYPE_OPTIONS = [
  { value: "Instagram", label: "Instagram", icon: "instagram" },
  { value: "Facebook", label: "Facebook", icon: "facebook" },
  { value: "WhatsApp", label: "WhatsApp", icon: "message-circle" },
  { value: "Phone", label: "Phone", icon: "phone" },
  { value: "Walk-in", label: "Walk-in", icon: "user" },
  { value: "Website", label: "Website", icon: "globe" },
] as const;

export const PRODUCT_TYPE_OPTIONS = [
  { value: "Bag", label: "Bag", icon: "briefcase" },
  { value: "Shoe", label: "Shoe", icon: "shoe" },
  { value: "Wallet", label: "Wallet", icon: "credit-card" },
  { value: "Belt", label: "Belt", icon: "circle" },
  { value: "All type furniture", label: "All type furniture", icon: "package" },
  { value: "Jacket", label: "Jacket", icon: "shirt" },
  { value: "Other", label: "Other", icon: "package" },
] as const;

export const SERVICE_TYPE_OPTIONS = [
  { value: "Sole Replacement", label: "Sole Replacement" },
  { value: "Zipper Repair", label: "Zipper Repair" },
  { value: "Cleaning & Polish", label: "Cleaning & Polish" },
  { value: "Stitching", label: "Stitching" },
  { value: "Leather Treatment", label: "Leather Treatment" },
  { value: "Hardware Repair", label: "Hardware Repair" },
] as const;

export const INVENTORY_CATEGORY_OPTIONS = [
  { value: "Polish", label: "Polish" },
  { value: "Soles", label: "Soles" },
  { value: "Thread", label: "Thread" },
  { value: "Hardware", label: "Hardware" },
  { value: "Tools", label: "Tools" },
  { value: "Materials", label: "Materials" },
  { value: "Supplies", label: "Supplies" },
] as const;

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "Materials", label: "Materials" },
  { value: "Tools", label: "Tools" },
  { value: "Rent", label: "Rent" },
  { value: "Utilities", label: "Utilities" },
  { value: "Transportation", label: "Transportation" },
  { value: "Marketing", label: "Marketing" },
  { value: "Staff Salaries", label: "Staff Salaries" },
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Insurance", label: "Insurance" },
  { value: "Miscellaneous", label: "Miscellaneous" },
] as const;

export const STAFF_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "technician", label: "Technician" },
  { value: "pickup", label: "Pickup Staff" },
  { value: "receptionist", label: "Receptionist" },
] as const;

export const DEPARTMENT_OPTIONS = [
  { value: "sole-repair", label: "Sole Repair" },
  { value: "polishing", label: "Polishing" },
  { value: "stitching", label: "Stitching" },
  { value: "quality-check", label: "Quality Check" },
  { value: "leather-treatment", label: "Leather Treatment" },
  { value: "hardware-repair", label: "Hardware Repair" },
] as const;

// UI Constants
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
} as const;

export const DATE_FORMATS = {
  display: "dd/MM/yyyy",
  input: "yyyy-MM-dd",
  datetime: "dd/MM/yyyy HH:mm",
  time: "HH:mm",
} as const;

export const CURRENCY = {
  symbol: "₹",
  code: "INR",
  locale: "en-IN",
} as const;

// Validation constants
export const VALIDATION_LIMITS = {
  name: { min: 2, max: 50 },
  phone: { min: 10, max: 15 },
  email: { max: 100 },
  address: { min: 10, max: 200 },
  message: { min: 10, max: 500 },
  notes: { max: 1000 },
  quantity: { min: 1, max: 100 },
  cost: { min: 0, max: 100000 },
} as const;

// File upload constants
export const FILE_UPLOAD = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFiles: 5,
} as const;

// Notification constants
export const NOTIFICATION_TYPES = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
} as const;

// Theme constants
export const THEME = {
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  theme: "cobbler-theme",
  user: "cobbler-user",
  token: "cobbler-token",
  settings: "cobbler-settings",
} as const;

// API constants
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;

// Business logic constants
export const BUSINESS_RULES = {
  lowStockThreshold: 0.2, // 20% of min stock
  urgentStockThreshold: 0.1, // 10% of min stock
  defaultServiceDuration: 3, // days
  maxPickupDistance: 50, // km
  workingHours: {
    start: "09:00",
    end: "18:00",
  },
} as const;

// Export all constants
export const CONSTANTS = {
  status: {
    enquiry: ENQUIRY_STATUS_OPTIONS,
    service: SERVICE_STATUS_OPTIONS,
    pickup: PICKUP_STATUS_OPTIONS,
  },
  categories: {
    inquiry: INQUIRY_TYPE_OPTIONS,
    product: PRODUCT_TYPE_OPTIONS,
    service: SERVICE_TYPE_OPTIONS,
    inventory: INVENTORY_CATEGORY_OPTIONS,
    expense: EXPENSE_CATEGORY_OPTIONS,
    staff: STAFF_ROLE_OPTIONS,
    department: DEPARTMENT_OPTIONS,
  },
  ui: {
    pagination: PAGINATION_DEFAULTS,
    dateFormats: DATE_FORMATS,
    currency: CURRENCY,
    theme: THEME,
  },
  validation: VALIDATION_LIMITS,
  fileUpload: FILE_UPLOAD,
  notifications: NOTIFICATION_TYPES,
  storage: STORAGE_KEYS,
  api: {
    timeout: API_TIMEOUT,
    retryAttempts: API_RETRY_ATTEMPTS,
  },
  business: BUSINESS_RULES,
} as const;