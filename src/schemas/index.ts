import { z } from "zod";

// Base schemas
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Invalid phone number format");

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .optional();

export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), "Invalid date format");

// Enquiry schemas
export const enquiryFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  address: z.string().min(10, "Address must be at least 10 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  inquiryType: z.enum(["Instagram", "Facebook", "WhatsApp", "Phone", "Walk-in", "Website"]),
  product: z.enum(["Bag", "Shoe", "Wallet", "Belt", "All type furniture"]),
  quantity: z.number().min(1, "Quantity must be at least 1").max(100, "Quantity cannot exceed 100"),
});

export const enquiryUpdateSchema = enquiryFormSchema.partial().extend({
  status: z.enum(["new", "contacted", "converted", "closed", "lost"]).optional(),
  contacted: z.boolean().optional(),
  contactedAt: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

// Service schemas
export const serviceFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  items: z.string().min(2, "Items description must be at least 2 characters"),
  serviceType: z.enum([
    "Sole Replacement",
    "Zipper Repair", 
    "Cleaning & Polish",
    "Stitching",
    "Leather Treatment",
    "Hardware Repair"
  ]),
  estimatedCost: z.number().min(0, "Cost cannot be negative"),
  notes: z.string().min(5, "Notes must be at least 5 characters"),
  beforePhoto: z.string().optional(),
  afterPhoto: z.string().optional(),
});

export const serviceUpdateSchema = serviceFormSchema.partial().extend({
  status: z.enum([
    "in-progress",
    "photos-taken", 
    "awaiting-approval",
    "completed",
    "billed",
    "sent-to-department",
    "work-in-department",
    "work-done"
  ]).optional(),
  actualCost: z.number().min(0).optional(),
  completedAt: z.string().optional(),
  department: z.string().optional(),
  assignedTo: z.string().optional(),
});

// Pickup schemas
export const pickupFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: phoneSchema,
  address: z.string().min(10, "Address must be at least 10 characters"),
  items: z.string().min(2, "Items description must be at least 2 characters"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  scheduledTime: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  expectedDelivery: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  quotedAmount: z.number().min(0, "Amount cannot be negative"),
});

export const pickupUpdateSchema = pickupFormSchema.partial().extend({
  status: z.enum(["pending", "assigned", "picked-up", "completed", "received", "in-service"]).optional(),
  receivedImage: z.string().optional(),
  receivedNotes: z.string().optional(),
  assignedTo: z.string().optional(),
});

// Inventory schemas
export const inventoryFormSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.enum(["Polish", "Soles", "Thread", "Hardware", "Tools", "Materials", "Supplies"]),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  minStock: z.number().min(0, "Minimum stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  cost: z.number().min(0, "Cost cannot be negative"),
  supplier: z.string().optional(),
  location: z.string().optional(),
});

export const inventoryUpdateSchema = inventoryFormSchema.partial();

// Expense schemas
export const expenseFormSchema = z.object({
  date: dateSchema,
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.enum([
    "Materials",
    "Tools", 
    "Rent",
    "Utilities",
    "Transportation",
    "Marketing",
    "Staff Salaries",
    "Office Supplies", 
    "Maintenance",
    "Professional Services",
    "Insurance",
    "Miscellaneous"
  ]),
  description: z.string().min(5, "Description must be at least 5 characters"),
  notes: z.string().optional(),
  receipt: z.string().optional(),
});

// Staff schemas
export const staffFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(["admin", "manager", "technician", "pickup", "receptionist"]),
  department: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Customer schemas
export const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().min(10, "Address must be at least 10 characters"),
});

// Search and filter schemas
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    status: z.string().optional(),
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    category: z.string().optional(),
    assignedTo: z.string().optional(),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// API response schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

// Export all schemas
export const schemas = {
  enquiry: {
    form: enquiryFormSchema,
    update: enquiryUpdateSchema,
  },
  service: {
    form: serviceFormSchema,
    update: serviceUpdateSchema,
  },
  pickup: {
    form: pickupFormSchema,
    update: pickupUpdateSchema,
  },
  inventory: {
    form: inventoryFormSchema,
    update: inventoryUpdateSchema,
  },
  expense: {
    form: expenseFormSchema,
  },
  staff: {
    form: staffFormSchema,
  },
  customer: {
    form: customerFormSchema,
  },
  search: searchParamsSchema,
} as const;

// Type exports from schemas
export type EnquiryFormData = z.infer<typeof enquiryFormSchema>;
export type ServiceFormData = z.infer<typeof serviceFormSchema>;
export type PickupFormData = z.infer<typeof pickupFormSchema>;
export type InventoryFormData = z.infer<typeof inventoryFormSchema>;
export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type StaffFormData = z.infer<typeof staffFormSchema>;
export type CustomerFormData = z.infer<typeof customerFormSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;