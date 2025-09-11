import { executeQuery, executeTransaction } from '../config/database';
import { logDatabase } from '../utils/logger';

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

export interface BillingDetails {
  id?: number;
  enquiryId: number;
  finalAmount: number;
  gstIncluded: boolean;
  gstRate: number;
  gstAmount: number;
  subtotal: number;
  totalAmount: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  businessInfo?: any;
  notes?: string;
  generatedAt?: string;
  items: BillingItem[];
}

export interface BillingItem {
  id?: number;
  billingId?: number;
  serviceType: string;
  originalAmount: number;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
  gstRate: number;
  gstAmount: number;
  description?: string;
}

export class BillingModel {
  // Get billing statistics
  static async getBillingStats(): Promise<BillingStats> {
    try {
      logDatabase.query('Getting billing statistics');
      
      // Get pending billing count (enquiries in billing stage without billing details)
      const [pendingResult] = await executeQuery<{ count: number }>(`
        SELECT COUNT(*) as count 
        FROM enquiries e 
        LEFT JOIN billing_details bd ON e.id = bd.enquiry_id 
        WHERE e.current_stage = 'billing' AND bd.id IS NULL
      `);
      
      // Get invoices generated count
      const [invoicesResult] = await executeQuery<{ count: number }>(`
        SELECT COUNT(*) as count 
        FROM billing_details 
        WHERE invoice_number IS NOT NULL
      `);
      
      // Get total billed amount
      const [totalResult] = await executeQuery<{ total: number }>(`
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM billing_details
      `);
      
      // Get invoices sent count (assuming all generated invoices are sent for now)
      const [sentResult] = await executeQuery<{ count: number }>(`
        SELECT COUNT(*) as count 
        FROM billing_details 
        WHERE invoice_number IS NOT NULL
      `);
      
      const stats: BillingStats = {
        pendingBilling: Number(pendingResult.count) || 0,
        invoicesGenerated: Number(invoicesResult.count) || 0,
        totalBilled: Number(totalResult.total) || 0,
        invoicesSent: Number(sentResult.count) || 0
      };
      
      logDatabase.success('Billing statistics retrieved', { stats });
      return stats;
    } catch (error) {
      logDatabase.error('Failed to get billing statistics', error);
      throw error;
    }
  }

  // Get all billing stage enquiries
  static async getBillingEnquiries(): Promise<BillingEnquiry[]> {
    try {
      logDatabase.query('Getting billing stage enquiries');
      
      const enquiries = await executeQuery<any>(`
        SELECT 
          e.id,
          e.customer_name as customerName,
          e.phone,
          e.address,
          e.product,
          e.quantity,
          e.current_stage as currentStage,
          e.quoted_amount as quotedAmount,
          e.final_amount as finalAmount,
          sd.estimated_cost as estimatedCost,
          bd.id as billingId,
          bd.invoice_number as invoiceNumber,
          bd.total_amount as totalAmount,
          bd.gst_amount as gstAmount,
          bd.subtotal,
          bd.generated_at as generatedAt
        FROM enquiries e
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        LEFT JOIN billing_details bd ON e.id = bd.enquiry_id
        WHERE e.current_stage = 'billing'
        ORDER BY e.created_at DESC
      `);
      
      // Get service types for each enquiry
      const enquiriesWithServices = await Promise.all(
        enquiries.map(async (enquiry) => {
          const serviceTypes = await executeQuery<any>(`
            SELECT 
              st.service_type as type,
              st.status,
              st.work_notes as workNotes
            FROM service_types st
            WHERE st.enquiry_id = ?
            ORDER BY st.created_at
          `, [enquiry.id]);
          
          // Get billing items if billing exists
          let billingDetails = null;
          if (enquiry.billingId) {
            const billingItems = await executeQuery<any>(`
              SELECT 
                bi.service_type as serviceType,
                bi.original_amount as originalAmount,
                bi.discount_value as discountValue,
                bi.discount_amount as discountAmount,
                bi.final_amount as finalAmount,
                bi.gst_rate as gstRate,
                bi.gst_amount as gstAmount,
                bi.description
              FROM billing_items bi
              WHERE bi.billing_id = ?
              ORDER BY bi.id
            `, [enquiry.billingId]);
            
            billingDetails = {
              enquiryId: enquiry.id,
              finalAmount: enquiry.finalAmount,
              gstIncluded: true, // Default to true as per current implementation
              gstRate: 18,
              gstAmount: enquiry.gstAmount,
              subtotal: enquiry.subtotal,
              totalAmount: enquiry.totalAmount,
              invoiceNumber: enquiry.invoiceNumber,
              invoiceDate: enquiry.generatedAt,
              customerName: enquiry.customerName,
              customerPhone: enquiry.phone,
              customerAddress: enquiry.address,
              businessInfo: enquiry.business_info ? (() => {
                try {
                  return typeof enquiry.business_info === 'string' ? JSON.parse(enquiry.business_info) : enquiry.business_info;
                } catch (e) {
                  console.error('Failed to parse business_info in getBillingEnquiries:', e);
                  return null;
                }
              })() : null,
              items: billingItems
            };
          }
          
          return {
            id: enquiry.id,
            customerName: enquiry.customerName,
            phone: enquiry.phone,
            address: enquiry.address,
            product: enquiry.product,
            quantity: enquiry.quantity,
            currentStage: enquiry.currentStage,
            serviceDetails: {
              serviceTypes: serviceTypes.map(st => ({
                type: st.type,
                status: st.status,
                workNotes: st.workNotes
              })),
              estimatedCost: enquiry.estimatedCost,
              billingDetails: billingDetails || undefined
            }
          };
        })
      );
      
      logDatabase.success('Billing enquiries retrieved', { count: enquiriesWithServices.length });
      return enquiriesWithServices;
    } catch (error) {
      logDatabase.error('Failed to get billing enquiries', error);
      throw error;
    }
  }

  // Get specific billing enquiry
  static async getBillingEnquiry(enquiryId: number): Promise<BillingEnquiry | null> {
    try {
      logDatabase.query('Getting specific billing enquiry', { enquiryId });
      
      const [enquiry] = await executeQuery<any>(`
        SELECT 
          e.id,
          e.customer_name as customerName,
          e.phone,
          e.address,
          e.product,
          e.quantity,
          e.current_stage as currentStage,
          e.quoted_amount as quotedAmount,
          e.final_amount as finalAmount,
          sd.estimated_cost as estimatedCost,
          bd.id as billingId,
          bd.invoice_number as invoiceNumber,
          bd.total_amount as totalAmount,
          bd.gst_amount as gstAmount,
          bd.subtotal,
          bd.generated_at as generatedAt
        FROM enquiries e
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        LEFT JOIN billing_details bd ON e.id = bd.enquiry_id
        WHERE e.id = ? AND e.current_stage = 'billing'
      `, [enquiryId]);
      
      if (!enquiry) {
        logDatabase.error('Billing enquiry not found', { enquiryId });
        return null;
      }
      
      // Get service types
      const serviceTypes = await executeQuery<any>(`
        SELECT 
          st.service_type as type,
          st.status,
          st.work_notes as workNotes
        FROM service_types st
        WHERE st.enquiry_id = ?
        ORDER BY st.created_at
      `, [enquiryId]);
      
      // Get billing items if billing exists
      let billingDetails = null;
      if (enquiry.billingId) {
        const billingItems = await executeQuery<any>(`
          SELECT 
            bi.service_type as serviceType,
            bi.original_amount as originalAmount,
            bi.discount_value as discountValue,
            bi.discount_amount as discountAmount,
            bi.final_amount as finalAmount,
            bi.gst_rate as gstRate,
            bi.gst_amount as gstAmount,
            bi.description
          FROM billing_items bi
          WHERE bi.billing_id = ?
          ORDER BY bi.id
        `, [enquiry.billingId]);
        
        billingDetails = {
          enquiryId: enquiry.id,
          finalAmount: enquiry.finalAmount,
          gstIncluded: true,
          gstRate: 18,
          gstAmount: enquiry.gstAmount,
          subtotal: enquiry.subtotal,
          totalAmount: enquiry.totalAmount,
          invoiceNumber: enquiry.invoiceNumber,
          invoiceDate: enquiry.generatedAt,
          customerName: enquiry.customerName,
          customerPhone: enquiry.phone,
          customerAddress: enquiry.address,
          businessInfo: enquiry.business_info ? (() => {
            try {
              return typeof enquiry.business_info === 'string' ? JSON.parse(enquiry.business_info) : enquiry.business_info;
            } catch (e) {
              console.error('Failed to parse business_info in getBillingEnquiry:', e);
              return null;
            }
          })() : null,
          items: billingItems
        };
      }
      
      const result: BillingEnquiry = {
        id: enquiry.id,
        customerName: enquiry.customerName,
        phone: enquiry.phone,
        address: enquiry.address,
        product: enquiry.product,
        quantity: enquiry.quantity,
        currentStage: enquiry.currentStage,
        serviceDetails: {
          serviceTypes: serviceTypes.map(st => ({
            type: st.type,
            status: st.status,
            workNotes: st.workNotes
          })),
          estimatedCost: enquiry.estimatedCost,
          billingDetails: billingDetails || undefined
        }
      };
      
      logDatabase.success('Billing enquiry retrieved', { enquiryId });
      return result;
    } catch (error) {
      logDatabase.error('Failed to get billing enquiry', error);
      throw error;
    }
  }

  // Create billing details
  static async createBilling(enquiryId: number, billingData: any): Promise<BillingDetails> {
    try {
      logDatabase.query('Creating billing details', { enquiryId, billingData });
      
      // Generate invoice number
      const invoiceNumber = BillingModel.generateInvoiceNumber();
      const invoiceDate = new Date().toISOString().split('T')[0];
      
      // Start transaction
      const results = await executeTransaction([
        // Insert billing details
        {
          query: `
            INSERT INTO billing_details (
              enquiry_id, final_amount, gst_included, gst_rate, gst_amount, 
              subtotal, total_amount, invoice_number, invoice_date,
              customer_name, customer_phone, customer_address, business_info, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: [
            enquiryId,
            billingData.finalAmount,
            billingData.gstIncluded,
            billingData.gstRate,
            billingData.gstAmount,
            billingData.subtotal,
            billingData.totalAmount,
            invoiceNumber,
            invoiceDate,
            billingData.customerName,
            billingData.customerPhone,
            billingData.customerAddress,
            typeof billingData.businessInfo === 'string' ? billingData.businessInfo : JSON.stringify(billingData.businessInfo || {}),
            billingData.notes || ''
          ]
        }
      ]);
      
      const billingId = results[0].insertId;
      
      // Insert billing items
      if (billingData.items && billingData.items.length > 0) {
        const itemQueries = billingData.items.map((item: BillingItem) => ({
          query: `
            INSERT INTO billing_items (
              billing_id, service_type, original_amount, discount_value, 
              discount_amount, final_amount, gst_rate, gst_amount, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: [
            billingId,
            item.serviceType,
            item.originalAmount,
            item.discountValue,
            item.discountAmount,
            item.finalAmount,
            item.gstRate,
            item.gstAmount,
            item.description || ''
          ]
        }));
        
        await executeTransaction(itemQueries);
      }
      
      // Get the created billing details
      const [billingDetails] = await executeQuery<any>(`
        SELECT * FROM billing_details WHERE id = ?
      `, [billingId]);
      
      const billingItems = await executeQuery<any>(`
        SELECT * FROM billing_items WHERE billing_id = ? ORDER BY id
      `, [billingId]);
      
      const result: BillingDetails = {
        id: billingDetails.id,
        enquiryId: billingDetails.enquiry_id,
        finalAmount: billingDetails.final_amount,
        gstIncluded: Boolean(billingDetails.gst_included),
        gstRate: billingDetails.gst_rate,
        gstAmount: billingDetails.gst_amount,
        subtotal: billingDetails.subtotal,
        totalAmount: billingDetails.total_amount,
        invoiceNumber: billingDetails.invoice_number,
        invoiceDate: billingDetails.invoice_date,
        customerName: billingDetails.customer_name,
        customerPhone: billingDetails.customer_phone,
        customerAddress: billingDetails.customer_address,
        businessInfo: billingDetails.business_info ? (() => {
          try {
            return typeof billingDetails.business_info === 'string' ? JSON.parse(billingDetails.business_info) : billingDetails.business_info;
          } catch (e) {
            console.error('Failed to parse business_info:', e);
            return null;
          }
        })() : null,
        notes: billingDetails.notes,
        generatedAt: billingDetails.generated_at,
        items: billingItems.map((item: any) => ({
          id: item.id,
          billingId: item.billing_id,
          serviceType: item.service_type,
          originalAmount: item.original_amount,
          discountValue: item.discount_value,
          discountAmount: item.discount_amount,
          finalAmount: item.final_amount,
          gstRate: item.gst_rate,
          gstAmount: item.gst_amount,
          description: item.description
        }))
      };
      
      logDatabase.success('Billing details created', { enquiryId, billingId, invoiceNumber });
      return result;
    } catch (error) {
      logDatabase.error('Failed to create billing details', error);
      throw error;
    }
  }

  // Get invoice data
  static async getInvoiceData(enquiryId: number): Promise<any> {
    try {
      logDatabase.query('Getting invoice data', { enquiryId });
      
      const [enquiry] = await executeQuery<any>(`
        SELECT 
          e.id,
          e.customer_name as customerName,
          e.phone,
          e.address,
          e.product,
          e.quantity,
          bd.*
        FROM enquiries e
        JOIN billing_details bd ON e.id = bd.enquiry_id
        WHERE e.id = ?
      `, [enquiryId]);
      
      if (!enquiry) {
        logDatabase.error('Invoice data not found', { enquiryId });
        return null;
      }
      
      const billingItems = await executeQuery<any>(`
        SELECT * FROM billing_items WHERE billing_id = ? ORDER BY id
      `, [enquiry.billingId]);
      
      const result = {
        id: enquiry.id,
        customerName: enquiry.customerName,
        phone: enquiry.phone,
        address: enquiry.address,
        product: enquiry.product,
        quantity: enquiry.quantity,
        serviceDetails: {
          billingDetails: {
            id: enquiry.id,
            enquiryId: enquiry.enquiry_id,
            finalAmount: enquiry.final_amount,
            gstIncluded: Boolean(enquiry.gst_included),
            gstRate: enquiry.gst_rate,
            gstAmount: enquiry.gst_amount,
            subtotal: enquiry.subtotal,
            totalAmount: enquiry.total_amount,
            invoiceNumber: enquiry.invoice_number,
            invoiceDate: enquiry.invoice_date,
            customerName: enquiry.customer_name,
            customerPhone: enquiry.customer_phone,
            customerAddress: enquiry.customer_address,
            businessInfo: enquiry.business_info ? (() => {
              try {
                return typeof enquiry.business_info === 'string' ? JSON.parse(enquiry.business_info) : enquiry.business_info;
              } catch (e) {
                console.error('Failed to parse business_info:', e);
                return null;
              }
            })() : null,
            notes: enquiry.notes,
            generatedAt: enquiry.generated_at,
            items: billingItems.map((item: any) => ({
              id: item.id,
              billingId: item.billing_id,
              serviceType: item.service_type,
              originalAmount: item.original_amount,
              discountValue: item.discount_value,
              discountAmount: item.discount_amount,
              finalAmount: item.final_amount,
              gstRate: item.gst_rate,
              gstAmount: item.gst_amount,
              description: item.description
            }))
          }
        }
      };
      
      logDatabase.success('Invoice data retrieved', { enquiryId });
      return result;
    } catch (error) {
      logDatabase.error('Failed to get invoice data', error);
      throw error;
    }
  }

  // Move to delivery stage
  static async moveToDelivery(enquiryId: number): Promise<any> {
    try {
      logDatabase.query('Moving enquiry to delivery stage', { enquiryId });
      
      // Update enquiry stage to delivery
      await executeQuery(`
        UPDATE enquiries 
        SET current_stage = 'delivery', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [enquiryId]);
      
      // Create delivery details
      await executeQuery(`
        INSERT INTO delivery_details (
          enquiry_id, status, delivery_method, created_at, updated_at
        ) VALUES (?, 'ready', 'customer-pickup', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [enquiryId]);
      
      // Get updated enquiry
      const [enquiry] = await executeQuery<any>(`
        SELECT * FROM enquiries WHERE id = ?
      `, [enquiryId]);
      
      logDatabase.success('Enquiry moved to delivery stage', { enquiryId });
      return enquiry;
    } catch (error) {
      logDatabase.error('Failed to move enquiry to delivery stage', error);
      throw error;
    }
  }

  // Generate invoice number
  private static generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  }
}