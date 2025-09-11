// Core business entity types
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// Photo tracking for each stage
export interface StagePhotos {
  beforePhoto?: string;
  afterPhoto?: string;
  uploadedAt?: string;
  notes?: string;
}

// Pickup stage details
export interface PickupStage {
  status: PickupStatus;
  scheduledTime?: string;
  assignedTo?: string;
  photos: StagePhotos;
  collectionNotes?: string;
  collectedAt?: string;
  pin?: string;
}

// Individual service type status tracking
export interface ServiceTypeStatus {
  type: ServiceType;
  status: ServiceStatus;

  // Photos for this specific service
  photos: {
    beforePhoto?: string;
    afterPhoto?: string;
    beforeNotes?: string;
    afterNotes?: string;
  };

  // Work details
  department?: string;
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  workNotes?: string;

  // Backend-ready fields
  id?: number; // For backend reference
  createdAt?: string;
  updatedAt?: string;
}

// Service details for backend operations
export interface ServiceDetails {
  id?: number;
  enquiryId: number;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  quantity: number;
  quotedAmount?: number;
  estimatedCost?: number;
  actualCost?: number;
  workNotes?: string;
  completedAt?: string;
  receivedPhotoId?: number;
  receivedNotes?: string;
  overallBeforePhotoId?: number;
  overallAfterPhotoId?: number;
  overallBeforeNotes?: string;
  overallAfterNotes?: string;
  serviceTypes: ServiceTypeStatus[];
  overallPhotos?: {
    beforePhoto?: string;
    afterPhoto?: string;
    beforeNotes?: string;
    afterNotes?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Service statistics
export interface ServiceStats {
  pendingCount: number;
  inProgressCount: number;
  doneCount: number;
  totalServices: number;
}

// Service API request types
export interface ServiceAssignmentRequest {
  enquiryId: number;
  serviceTypes: ServiceType[];
}

export interface ServiceStartRequest {
  serviceTypeId: number;
  beforePhoto: string;
  notes?: string;
}

export interface ServiceCompleteRequest {
  serviceTypeId: number;
  afterPhoto: string;
  notes?: string;
}

export interface FinalPhotoRequest {
  enquiryId: number;
  afterPhoto: string;
  notes?: string;
}

export interface WorkflowCompleteRequest {
  enquiryId: number;
  actualCost: number;
  workNotes?: string;
}

// Business information types
export interface BusinessInfo {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  timezone: string;
  currency: string;
  logo?: string; // Base64 encoded logo
  website?: string;
  tagline?: string;
}

// Billing and invoice types
export interface BillingDetails {
  finalAmount: number;
  gstIncluded: boolean;
  gstRate: number; // Percentage (e.g., 18 for 18%)
  gstAmount: number;
  subtotal: number;
  totalAmount: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  businessInfo?: BusinessInfo; // Include business info in billing
  items: BillingItem[];
  notes?: string;
  generatedAt?: string;
}

export interface BillingItem {
  serviceType: string;
  originalAmount: number;
  discountValue: number; // Percentage discount only
  discountAmount: number;
  finalAmount: number;
  gstRate: number; // Individual GST rate per service
  gstAmount: number; // Individual GST amount per service
  description?: string;
}

// Service stage details  
export interface ServiceStage {
  overallPhotos: {
    beforePhoto?: string; // Pickup received photo
    afterPhoto?: string;  // Before work-done photo
    beforeNotes?: string;
    afterNotes?: string;
  };
  serviceTypes: ServiceTypeStatus[];
  estimatedCost?: number;
  actualCost?: number;
  workNotes?: string;
  workHistory?: WorkHistoryEntry[];
  completedAt?: string;
  billingDetails?: BillingDetails; // Add billing details to service stage
}

// Delivery stage details
export interface DeliveryStage {
  status: DeliveryStatus;
  deliveryMethod: DeliveryMethod;
  scheduledTime?: string;
  assignedTo?: string;
  photos: StagePhotos;
  deliveryAddress?: string;
  customerSignature?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
}

export interface Enquiry {
  name: string;
  location: string;
  number: string;
  id: number;
  customerId?: number;
  customerName: string;
  phone: string;
  address: string;
  message: string;
  inquiryType: InquiryType;
  product: ProductType;
  quantity: number;
  date: string;
  status: EnquiryStatus;
  contacted: boolean;
  contactedAt?: string;
  assignedTo?: string;
  notes?: string;

  // Workflow stages
  currentStage: WorkflowStage;
  pickupDetails?: PickupStage;
  serviceDetails?: ServiceStage;
  deliveryDetails?: DeliveryStage;

  // Pricing
  quotedAmount?: number;
  finalAmount?: number;


}

export interface ServiceOrder {
  id: number;
  customerId?: number;
  customerName: string;
  items: string;
  serviceType: ServiceType;
  status: ServiceStatus;
  beforePhoto?: string;
  afterPhoto?: string;
  estimatedCost: number;
  actualCost?: number;
  completedAt?: string;
  notes: string;
  department?: string;
  assignedTo?: string;
  workHistory?: WorkHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// Billing API types - Added for backend API integration
export interface BillingStats {
  pendingBilling: number;
  invoicesGenerated: number;
  totalBilled: number;
  invoicesSent: number;
}

export interface BillingEnquiry {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  quantity: number;
  currentStage: string;
  serviceDetails?: {
    serviceTypes?: Array<{
      type: string;
      status: string;
      workNotes?: string;
    }>;
    estimatedCost?: number;
    billingDetails?: BillingDetails;
  };
}

export interface BillingCreateRequest {
  finalAmount: number;
  gstIncluded: boolean;
  gstRate: number;
  gstAmount: number;
  subtotal: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  businessInfo?: BusinessInfo;
  notes?: string;
  items: BillingItem[];
}

export interface BillingMoveToDeliveryRequest {
  // No additional data needed for now
}

export interface PickupOrder {
  id: number;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  address: string;
  items: string;
  quantity: number;
  status: PickupStatus;
  scheduledTime: string;
  expectedDelivery: string;
  quotedAmount: number;
  receivedImage?: string;
  receivedNotes?: string;
  assignedTo?: string;
  pin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: InventoryCategory;
  quantity: number;
  minStock: number;
  unit: string;
  cost: number;
  supplier?: string;
  lastUpdated: string;
  location?: string;
}

export interface Expense {
  id: number;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  notes?: string;
  receipt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  department?: string;
  status: "active" | "inactive";
  createdAt: string;
}

// Enums and union types
export type InquiryType = "Instagram" | "Facebook" | "WhatsApp" | "Phone" | "Walk-in" | "Website";
export type ProductType = "Bag" | "Shoe" | "Wallet" | "Belt" | "All type furniture";
export type EnquiryStatus = "new" | "contacted" | "converted" | "closed" | "lost";

// Workflow stages
export type WorkflowStage = "enquiry" | "pickup" | "service" | "billing" | "delivery" | "completed";

// Stage-specific statuses
export type PickupStatus = "scheduled" | "assigned" | "collected" | "received";
export type ServiceType = "Sole Replacement" | "Zipper Repair" | "Cleaning & Polish" | "Stitching" | "Leather Treatment" | "Hardware Repair";
export type ServiceStatus = "pending" | "in-progress" | "done";
export type DeliveryStatus = "ready" | "scheduled" | "out-for-delivery" | "delivered";
export type DeliveryMethod = "customer-pickup" | "home-delivery";

export type InventoryCategory = "Polish" | "Soles" | "Thread" | "Hardware" | "Tools" | "Materials" | "Supplies";
export type ExpenseCategory = "Materials" | "Tools" | "Rent" | "Utilities" | "Transportation" | "Marketing" | "Staff Salaries" | "Office Supplies" | "Maintenance" | "Professional Services" | "Insurance" | "Miscellaneous";

export type StaffRole = "admin" | "manager" | "technician" | "pickup" | "receptionist";

// Supporting types
export interface WorkHistoryEntry {
  id: number;
  department: string;
  timestamp: string;
  action: string;
  notes?: string;
  performedBy?: string;
}

export interface DashboardStats {
  totalEnquiries: number;
  newEnquiries: number;
  convertedEnquiries: number;
  pendingFollowUp: number;
  inProgressServices: number;
  completedServices: number;
  totalRevenue: number;
  monthlyExpenses: number;
  lowStockItems: number;
  pendingPickups: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface EnquiryFormData {
  customerName: string;
  phone: string;
  address: string;
  message: string;
  inquiryType: string;
  product: string;
  quantity: number;
}

export interface ServiceFormData {
  customerName: string;
  items: string;
  serviceType: string;
  estimatedCost: number;
  notes: string;
}

export interface PickupFormData {
  customerName: string;
  customerPhone: string;
  address: string;
  items: string;
  quantity: number;
  scheduledTime: string;
  expectedDelivery: string;
  quotedAmount: number;
}

export interface ExpenseFormData {
  date: string;
  amount: number;
  category: string;
  description: string;
  notes?: string;
}

// Filter and search types
export interface FilterOptions {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  category?: string;
  assignedTo?: string;
}

export interface SearchParams {
  query: string;
  filters: FilterOptions;
  page: number;
  limit: number;
}

// Delivery statistics interface
export interface DeliveryStats {
  readyForDelivery: number;
  scheduledDeliveries: number;
  outForDelivery: number;
  deliveredToday: number;
}

// Delivery details interface
export interface DeliveryDetails {
  status: DeliveryStatus;
  deliveryMethod?: DeliveryMethod;
  scheduledTime?: string;
  assignedTo?: string;
  deliveryAddress?: string;
  customerSignature?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
  photos?: {
    beforePhoto?: string; // Service completed photo
    afterPhoto?: string;  // Delivery proof photo
  };
}

// Delivery enquiry interface (extends basic Enquiry with delivery-specific data)
export interface DeliveryEnquiry {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  message: string;
  inquiryType: 'Instagram' | 'Facebook' | 'WhatsApp' | 'Phone' | 'Walk-in' | 'Website';
  product: 'Bag' | 'Shoe' | 'Wallet' | 'Belt' | 'All type furniture';
  quantity: number;
  date: string;
  status: 'new' | 'contacted' | 'converted' | 'closed' | 'lost';
  contacted: boolean;
  contactedAt?: string;
  assignedTo?: string;
  notes?: string;
  currentStage: 'enquiry' | 'pickup' | 'service' | 'billing' | 'delivery' | 'completed';
  quotedAmount?: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;

  // Delivery-specific data
  deliveryDetails?: DeliveryDetails;

  // Service details (for showing service completed photo)
  serviceDetails?: {
    estimatedCost?: number;
    actualCost?: number;
    workNotes?: string;
    completedAt?: string;
    overallPhotos?: {
      afterPhoto?: string; // Service final photo to show in delivery
    };
  };
}

// Request interfaces for API calls
export interface ScheduleDeliveryRequest {
  deliveryMethod: DeliveryMethod;
  scheduledTime: string;
}

export interface MarkOutForDeliveryRequest {
  assignedTo: string;
}

export interface CompleteDeliveryRequest {
  deliveryProofPhoto: string;
  customerSignature?: string;
  deliveryNotes?: string;
}