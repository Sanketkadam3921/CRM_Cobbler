import { executeQuery } from '../config/database';
import { logDatabase } from '../utils/logger';

// Product item interface
export interface ProductItem {
  product: string;
  quantity: number;
}

// Completed enquiry interface for backend
export interface CompletedEnquiry {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  message: string;
  inquiryType: string;
  product: string; // Keep for backward compatibility
  quantity: number; // Keep for backward compatibility
  products: ProductItem[]; // New field for multiple products
  date: string;
  status: string;
  contacted: boolean;
  contactedAt?: string;
  assignedTo?: string;
  notes?: string;
  currentStage: string;
  quotedAmount?: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;

  // Billing details
  billedAmount?: number;
  subtotalAmount?: number;
  gstAmount?: number;
  invoiceNumber?: string;
  invoiceDate?: string;

  // Delivery details
  deliveredAt?: string;
  deliveryMethod?: string;
  deliveryNotes?: string;

  // Service details
  serviceTypes?: string;
  workNotes?: string;
}

// Completed statistics interface
export interface CompletedStats {
  totalCompleted: number;
  completedThisWeek: number;
  totalRevenue: number;
  avgCompletionTime: number;
}

export class CompletedModel {
  // Get all completed enquiries with billing and delivery details
  static async getCompletedEnquiries(): Promise<CompletedEnquiry[]> {
    try {
      logDatabase.query('Fetching completed enquiries with billing and delivery details');

      const query = `
        SELECT 
          e.id,
          e.customer_name as customerName,
          e.phone,
          e.address,
          e.message,
          e.inquiry_type as inquiryType,
          e.product,
          e.quantity,
          e.date,
          e.status,
          e.contacted,
          e.contacted_at as contactedAt,
          e.assigned_to as assignedTo,
          e.notes,
          e.current_stage as currentStage,
          e.quoted_amount as quotedAmount,
          e.final_amount as finalAmount,
          e.created_at as createdAt,
          e.updated_at as updatedAt,
          
          -- Billing details (using total_amount which is subtotal + GST)
          bd.total_amount as billedAmount,
          bd.subtotal as subtotalAmount,
          bd.gst_amount as gstAmount,
          bd.invoice_number as invoiceNumber,
          bd.invoice_date as invoiceDate,
          
          -- Delivery details
          dd.delivered_at as deliveredAt,
          dd.delivery_method as deliveryMethod,
          dd.delivery_notes as deliveryNotes,
          
          -- Service details
          sd.work_notes as workNotes,
          GROUP_CONCAT(DISTINCT st.service_type) as serviceTypes
          
        FROM enquiries e
        LEFT JOIN billing_details bd ON e.id = bd.enquiry_id
        LEFT JOIN delivery_details dd ON e.id = dd.enquiry_id
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        LEFT JOIN service_types st ON e.id = st.enquiry_id
        WHERE e.current_stage = 'completed'
        GROUP BY e.id
        ORDER BY dd.delivered_at DESC, e.updated_at DESC
      `;

      const results = await executeQuery<any>(query);

      // Fetch products for each enquiry
      const enquiriesWithProducts: CompletedEnquiry[] = [];

      for (const enquiry of results) {
        // Get products for this enquiry
        const productsQuery = `
          SELECT product, quantity 
          FROM enquiry_products 
          WHERE enquiry_id = ?
          ORDER BY id
        `;

        const products = await executeQuery<ProductItem>(productsQuery, [enquiry.id]);

        // Add products array to enquiry
        const enquiryWithProducts: CompletedEnquiry = {
          ...enquiry,
          products: products.length > 0 ? products : [{ product: enquiry.product, quantity: enquiry.quantity }]
        };

        enquiriesWithProducts.push(enquiryWithProducts);
      }

      logDatabase.success('Successfully fetched completed enquiries with products', {
        count: enquiriesWithProducts.length
      });

      return enquiriesWithProducts;
    } catch (error) {
      logDatabase.error('Failed to fetch completed enquiries', error);
      throw error;
    }
  }

  // Get completed enquiries statistics
  static async getCompletedStats(): Promise<CompletedStats> {
    try {
      logDatabase.query('Calculating completed enquiries statistics');

      // Total completed count
      const totalQuery = `
        SELECT COUNT(*) as totalCompleted
        FROM enquiries e
        WHERE e.current_stage = 'completed'
      `;

      // Completed this week
      const weekQuery = `
        SELECT COUNT(*) as completedThisWeek
        FROM enquiries e
        LEFT JOIN delivery_details dd ON e.id = dd.enquiry_id
        WHERE e.current_stage = 'completed'
        AND dd.delivered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `;

      // Total revenue from billing (using total_amount which is subtotal + GST)
      const revenueQuery = `
        SELECT COALESCE(SUM(bd.total_amount), 0) as totalRevenue
        FROM enquiries e
        LEFT JOIN billing_details bd ON e.id = bd.enquiry_id
        WHERE e.current_stage = 'completed'
      `;

      // Average completion time
      const avgTimeQuery = `
        SELECT 
          COALESCE(AVG(DATEDIFF(dd.delivered_at, e.date)), 0) as avgCompletionTime
        FROM enquiries e
        LEFT JOIN delivery_details dd ON e.id = dd.enquiry_id
        WHERE e.current_stage = 'completed'
        AND dd.delivered_at IS NOT NULL
      `;

      const [totalResult] = await executeQuery<{ totalCompleted: number }>(totalQuery);
      const [weekResult] = await executeQuery<{ completedThisWeek: number }>(weekQuery);
      const [revenueResult] = await executeQuery<{ totalRevenue: number }>(revenueQuery);
      const [avgTimeResult] = await executeQuery<{ avgCompletionTime: number }>(avgTimeQuery);

      const stats: CompletedStats = {
        totalCompleted: totalResult?.totalCompleted || 0,
        completedThisWeek: weekResult?.completedThisWeek || 0,
        totalRevenue: revenueResult?.totalRevenue || 0,
        avgCompletionTime: Math.round(avgTimeResult?.avgCompletionTime || 0)
      };

      logDatabase.success('Successfully calculated completed statistics', stats);

      return stats;
    } catch (error) {
      logDatabase.error('Failed to calculate completed statistics', error);
      throw error;
    }
  }

  // Get completed enquiry by ID (for detailed view if needed)
  static async getCompletedEnquiryById(id: number): Promise<CompletedEnquiry | null> {
    try {
      logDatabase.query('Fetching completed enquiry by ID', { id });

      const query = `
        SELECT 
          e.id,
          e.customer_name as customerName,
          e.phone,
          e.address,
          e.message,
          e.inquiry_type as inquiryType,
          e.product,
          e.quantity,
          e.date,
          e.status,
          e.contacted,
          e.contacted_at as contactedAt,
          e.assigned_to as assignedTo,
          e.notes,
          e.current_stage as currentStage,
          e.quoted_amount as quotedAmount,
          e.final_amount as finalAmount,
          e.created_at as createdAt,
          e.updated_at as updatedAt,
          
          -- Billing details (using total_amount which is subtotal + GST)
          bd.total_amount as billedAmount,
          bd.subtotal as subtotalAmount,
          bd.gst_amount as gstAmount,
          bd.invoice_number as invoiceNumber,
          bd.invoice_date as invoiceDate,
          
          -- Delivery details
          dd.delivered_at as deliveredAt,
          dd.delivery_method as deliveryMethod,
          dd.delivery_notes as deliveryNotes,
          
          -- Service details
          sd.work_notes as workNotes,
          GROUP_CONCAT(DISTINCT st.service_type) as serviceTypes
          
        FROM enquiries e
        LEFT JOIN billing_details bd ON e.id = bd.enquiry_id
        LEFT JOIN delivery_details dd ON e.id = dd.enquiry_id
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        LEFT JOIN service_types st ON e.id = st.enquiry_id
        WHERE e.id = ? AND e.current_stage = 'completed'
        GROUP BY e.id
      `;

      const results = await executeQuery<any>(query, [id]);

      if (results.length === 0) {
        logDatabase.query('No completed enquiry found with ID', { id });
        return null;
      }

      const enquiry = results[0];

      // Get products for this enquiry
      const productsQuery = `
        SELECT product, quantity 
        FROM enquiry_products 
        WHERE enquiry_id = ?
        ORDER BY id
      `;

      const products = await executeQuery<ProductItem>(productsQuery, [id]);

      // Add products array to enquiry
      const enquiryWithProducts: CompletedEnquiry = {
        ...enquiry,
        products: products.length > 0 ? products : [{ product: enquiry.product, quantity: enquiry.quantity }]
      };

      logDatabase.success('Successfully fetched completed enquiry by ID with products', {
        id,
        found: true,
        productsCount: enquiryWithProducts.products.length
      });

      return enquiryWithProducts;
    } catch (error) {
      logDatabase.error('Failed to fetch completed enquiry by ID', { id, error });
      throw error;
    }
  }
}

export default CompletedModel;