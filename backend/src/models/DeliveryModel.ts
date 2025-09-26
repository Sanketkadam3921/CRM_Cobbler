import { executeQuery, executeTransaction } from '../config/database';
import { logDatabase } from '../utils/logger';
import { DeliveryDetails, DeliveryStats, DeliveryEnquiry, ProductItem, DatabaseEnquiryProduct } from '../types';

export class DeliveryModel {
  // Get products for an enquiry
  private static async getEnquiryProducts(enquiryId: number): Promise<ProductItem[]> {
    try {
      const query = `
        SELECT product, quantity 
        FROM enquiry_products 
        WHERE enquiry_id = ?
        ORDER BY id
      `;

      const rows = await executeQuery<DatabaseEnquiryProduct>(query, [enquiryId]);
      return rows.map(row => ({
        product: row.product,
        quantity: row.quantity
      }));
    } catch (error) {
      console.error('Failed to get enquiry products', error);
      return [];
    }
  }

  // Get delivery statistics for dashboard
  static async getDeliveryStats(): Promise<DeliveryStats> {
    try {
      logDatabase.query('Fetching delivery statistics...');

      const query = `
        SELECT 
          COUNT(CASE WHEN dd.status = 'ready' THEN 1 END) as readyForDelivery,
          COUNT(CASE WHEN dd.status = 'scheduled' THEN 1 END) as scheduledDeliveries,
          COUNT(CASE WHEN dd.status = 'out-for-delivery' THEN 1 END) as outForDelivery,
          COUNT(CASE WHEN dd.status = 'delivered' AND DATE(dd.delivered_at) = CURDATE() THEN 1 END) as deliveredToday
        FROM delivery_details dd
        INNER JOIN enquiries e ON dd.enquiry_id = e.id
        WHERE e.current_stage = 'delivery'
      `;

      const [stats] = await executeQuery<any>(query);

      const result: DeliveryStats = {
        readyForDelivery: parseInt(stats?.readyForDelivery) || 0,
        scheduledDeliveries: parseInt(stats?.scheduledDeliveries) || 0,
        outForDelivery: parseInt(stats?.outForDelivery) || 0,
        deliveredToday: parseInt(stats?.deliveredToday) || 0
      };

      logDatabase.success('Delivery statistics fetched successfully', result);
      return result;
    } catch (error) {
      logDatabase.error('Failed to fetch delivery statistics', error);
      throw error;
    }
  }

  // Get all enquiries in delivery stage
  static async getDeliveryEnquiries(): Promise<DeliveryEnquiry[]> {
    try {
      logDatabase.query('Fetching all delivery stage enquiries...');

      const query = `
        SELECT 
          e.*,
          dd.status as delivery_status,
          dd.delivery_method,
          dd.scheduled_time,
          dd.assigned_to as delivery_assigned_to,
          dd.delivery_address,
          dd.customer_signature,
          dd.delivery_notes,
          dd.delivered_at,
          sd.estimated_cost,
          sd.actual_cost,
          sd.work_notes,
          sd.completed_at as service_completed_at,
          -- Get service completion photo (overall after photo)
          p_service_after.photo_data as service_after_photo,
          -- Get delivery photos
          p_delivery_before.photo_data as delivery_before_photo,
          p_delivery_after.photo_data as delivery_after_photo
        FROM enquiries e
        INNER JOIN delivery_details dd ON e.id = dd.enquiry_id
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        -- Get service overall after photo as delivery before photo
        LEFT JOIN photos p_service_after ON e.id = p_service_after.enquiry_id 
          AND p_service_after.stage = 'service' 
          AND p_service_after.photo_type = 'overall_after'
        -- Get delivery before photo (should be same as service after)
        LEFT JOIN photos p_delivery_before ON e.id = p_delivery_before.enquiry_id 
          AND p_delivery_before.stage = 'delivery' 
          AND p_delivery_before.photo_type = 'before_photo'
        -- Get delivery after photo (delivery proof)
        LEFT JOIN photos p_delivery_after ON e.id = p_delivery_after.enquiry_id 
          AND p_delivery_after.stage = 'delivery' 
          AND p_delivery_after.photo_type = 'after_photo'
        WHERE e.current_stage = 'delivery'
        ORDER BY 
          CASE dd.status
            WHEN 'ready' THEN 1
            WHEN 'scheduled' THEN 2
            WHEN 'out-for-delivery' THEN 3
            WHEN 'delivered' THEN 4
          END,
          e.created_at DESC
      `;

      const enquiries = await executeQuery<any>(query);

      const result: DeliveryEnquiry[] = [];

      for (const row of enquiries) {
        const products = await this.getEnquiryProducts(row.id);

        result.push({
          id: row.id,
          customerName: row.customer_name,
          phone: row.phone,
          address: row.address,
          message: row.message,
          inquiryType: row.inquiry_type,
          product: row.product,
          quantity: row.quantity,
          products: products, // Add products array
          date: row.date,
          status: row.status,
          contacted: row.contacted,
          contactedAt: row.contacted_at,
          assignedTo: row.assigned_to,
          notes: row.notes,
          currentStage: row.current_stage,
          quotedAmount: parseFloat(row.quoted_amount) || 0,
          finalAmount: parseFloat(row.final_amount) || parseFloat(row.actual_cost) || parseFloat(row.quoted_amount) || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deliveryDetails: {
            status: row.delivery_status,
            deliveryMethod: row.delivery_method,
            scheduledTime: row.scheduled_time,
            assignedTo: row.delivery_assigned_to,
            deliveryAddress: row.delivery_address,
            customerSignature: row.customer_signature,
            deliveryNotes: row.delivery_notes,
            deliveredAt: row.delivered_at,
            photos: {
              // Use service after photo as delivery before photo (service completed photo)
              beforePhoto: row.delivery_before_photo || row.service_after_photo,
              afterPhoto: row.delivery_after_photo
            }
          },
          serviceDetails: {
            estimatedCost: parseFloat(row.estimated_cost) || 0,
            actualCost: parseFloat(row.actual_cost) || 0,
            workNotes: row.work_notes,
            completedAt: row.service_completed_at,
            overallPhotos: {
              afterPhoto: row.service_after_photo
            }
          }
        });
      }

      logDatabase.success('Delivery enquiries fetched successfully', { count: result.length });
      return result;
    } catch (error) {
      logDatabase.error('Failed to fetch delivery enquiries', error);
      throw error;
    }
  }

  // Get specific delivery enquiry by ID
  static async getDeliveryEnquiry(enquiryId: number): Promise<DeliveryEnquiry | null> {
    try {
      logDatabase.query('Fetching delivery enquiry by ID', { enquiryId });

      // Same query as above but with WHERE clause for specific enquiry
      const query = `
        SELECT 
          e.*,
          dd.status as delivery_status,
          dd.delivery_method,
          dd.scheduled_time,
          dd.assigned_to as delivery_assigned_to,
          dd.delivery_address,
          dd.customer_signature,
          dd.delivery_notes,
          dd.delivered_at,
          sd.estimated_cost,
          sd.actual_cost,
          sd.work_notes,
          sd.completed_at as service_completed_at,
          p_service_after.photo_data as service_after_photo,
          p_delivery_before.photo_data as delivery_before_photo,
          p_delivery_after.photo_data as delivery_after_photo
        FROM enquiries e
        INNER JOIN delivery_details dd ON e.id = dd.enquiry_id
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        LEFT JOIN photos p_service_after ON e.id = p_service_after.enquiry_id 
          AND p_service_after.stage = 'service' 
          AND p_service_after.photo_type = 'overall_after'
        LEFT JOIN photos p_delivery_before ON e.id = p_delivery_before.enquiry_id 
          AND p_delivery_before.stage = 'delivery' 
          AND p_delivery_before.photo_type = 'before_photo'
        LEFT JOIN photos p_delivery_after ON e.id = p_delivery_after.enquiry_id 
          AND p_delivery_after.stage = 'delivery' 
          AND p_delivery_after.photo_type = 'after_photo'
        WHERE e.id = ? AND e.current_stage = 'delivery'
      `;

      const [enquiry] = await executeQuery<any>(query, [enquiryId]);

      if (!enquiry) {
        logDatabase.query('Delivery enquiry not found', { enquiryId });
        return null;
      }

      const products = await this.getEnquiryProducts(enquiryId);

      const result: DeliveryEnquiry = {
        id: enquiry.id,
        customerName: enquiry.customer_name,
        phone: enquiry.phone,
        address: enquiry.address,
        message: enquiry.message,
        inquiryType: enquiry.inquiry_type,
        product: enquiry.product,
        quantity: enquiry.quantity,
        products: products, // Add products array
        date: enquiry.date,
        status: enquiry.status,
        contacted: enquiry.contacted,
        contactedAt: enquiry.contacted_at,
        assignedTo: enquiry.assigned_to,
        notes: enquiry.notes,
        currentStage: enquiry.current_stage,
        quotedAmount: parseFloat(enquiry.quoted_amount) || 0,
        finalAmount: parseFloat(enquiry.final_amount) || parseFloat(enquiry.actual_cost) || parseFloat(enquiry.quoted_amount) || 0,
        createdAt: enquiry.created_at,
        updatedAt: enquiry.updated_at,
        deliveryDetails: {
          status: enquiry.delivery_status,
          deliveryMethod: enquiry.delivery_method,
          scheduledTime: enquiry.scheduled_time,
          assignedTo: enquiry.delivery_assigned_to,
          deliveryAddress: enquiry.delivery_address,
          customerSignature: enquiry.customer_signature,
          deliveryNotes: enquiry.delivery_notes,
          deliveredAt: enquiry.delivered_at,
          photos: {
            beforePhoto: enquiry.delivery_before_photo || enquiry.service_after_photo,
            afterPhoto: enquiry.delivery_after_photo
          }
        },
        serviceDetails: {
          estimatedCost: parseFloat(enquiry.estimated_cost) || 0,
          actualCost: parseFloat(enquiry.actual_cost) || 0,
          workNotes: enquiry.work_notes,
          completedAt: enquiry.service_completed_at,
          overallPhotos: {
            afterPhoto: enquiry.service_after_photo
          }
        }
      };

      logDatabase.success('Delivery enquiry fetched successfully', { enquiryId });
      return result;
    } catch (error) {
      logDatabase.error('Failed to fetch delivery enquiry', { enquiryId, error });
      throw error;
    }
  }

  // Schedule delivery - Update delivery details with schedule info
  static async scheduleDelivery(
    enquiryId: number,
    deliveryMethod: 'customer-pickup' | 'home-delivery',
    scheduledTime: string
  ): Promise<void> {
    try {
      logDatabase.query('Scheduling delivery', { enquiryId, deliveryMethod, scheduledTime });

      const updateQuery = `
        UPDATE delivery_details 
        SET 
          status = 'scheduled',
          delivery_method = ?,
          scheduled_time = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE enquiry_id = ?
      `;

      await executeQuery(updateQuery, [deliveryMethod, scheduledTime, enquiryId]);

      logDatabase.success('Delivery scheduled successfully', { enquiryId, deliveryMethod, scheduledTime });
    } catch (error) {
      logDatabase.error('Failed to schedule delivery', { enquiryId, deliveryMethod, scheduledTime, error });
      throw error;
    }
  }

  // Mark delivery as out for delivery
  static async markOutForDelivery(enquiryId: number, assignedTo: string): Promise<void> {
    try {
      logDatabase.query('Marking delivery as out for delivery', { enquiryId, assignedTo });

      const updateQuery = `
        UPDATE delivery_details 
        SET 
          status = 'out-for-delivery',
          assigned_to = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE enquiry_id = ?
      `;

      await executeQuery(updateQuery, [assignedTo, enquiryId]);

      logDatabase.success('Delivery marked as out for delivery', { enquiryId, assignedTo });
    } catch (error) {
      logDatabase.error('Failed to mark delivery as out for delivery', { enquiryId, assignedTo, error });
      throw error;
    }
  }

  // Complete delivery - Mark as delivered and move enquiry to completed stage
  static async completeDelivery(
    enquiryId: number,
    deliveryProofPhoto: string,
    customerSignature?: string,
    deliveryNotes?: string
  ): Promise<void> {
    try {
      logDatabase.query('Completing delivery', { enquiryId, hasProofPhoto: !!deliveryProofPhoto, hasSignature: !!customerSignature });

      const currentTime = new Date().toISOString().split('T')[0];

      // Use transaction to ensure consistency
      const queries = [
        // Update delivery details
        {
          query: `
            UPDATE delivery_details 
            SET 
              status = 'delivered',
              customer_signature = ?,
              delivery_notes = ?,
              delivered_at = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE enquiry_id = ?
          `,
          params: [customerSignature, deliveryNotes, currentTime, enquiryId]
        },
        // Move enquiry to completed stage
        {
          query: `
            UPDATE enquiries 
            SET 
              current_stage = 'completed',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          params: [enquiryId]
        },
        // Save delivery proof photo
        {
          query: `
            INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, created_at)
            VALUES (?, 'delivery', 'after_photo', ?, 'Delivery proof photo', CURRENT_TIMESTAMP)
          `,
          params: [enquiryId, deliveryProofPhoto]
        }
      ];

      await executeTransaction(queries);

      logDatabase.success('Delivery completed successfully', { enquiryId });
    } catch (error) {
      logDatabase.error('Failed to complete delivery', { enquiryId, error });
      throw error;
    }
  }

  // Initialize delivery details when enquiry moves from billing to delivery
  // This should be called from BillingController.moveToDelivery
  static async initializeDeliveryDetails(enquiryId: number): Promise<void> {
    try {
      logDatabase.query('Initializing delivery details', { enquiryId });

      // Check if delivery details already exist
      const checkQuery = 'SELECT id FROM delivery_details WHERE enquiry_id = ?';
      const existing = await executeQuery(checkQuery, [enquiryId]);

      if (existing.length > 0) {
        logDatabase.query('Delivery details already exist, skipping initialization', { enquiryId });
        return;
      }

      // Copy service after photo as delivery before photo
      const copyPhotoQuery = `
        INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, created_at)
        SELECT 
          enquiry_id, 
          'delivery' as stage, 
          'before_photo' as photo_type, 
          photo_data, 
          'Service completed photo (copied for delivery)' as notes,
          CURRENT_TIMESTAMP as created_at
        FROM photos 
        WHERE enquiry_id = ? 
          AND stage = 'service' 
          AND photo_type = 'overall_after'
        LIMIT 1
      `;

      const queries = [
        // Create delivery details record
        {
          query: `
            INSERT INTO delivery_details (
              enquiry_id, 
              status, 
              delivery_method, 
              created_at, 
              updated_at
            ) VALUES (?, 'ready', 'customer-pickup', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
          params: [enquiryId]
        },
        // Copy service photo as delivery before photo
        {
          query: copyPhotoQuery,
          params: [enquiryId]
        }
      ];

      await executeTransaction(queries);

      logDatabase.success('Delivery details initialized successfully', { enquiryId });
    } catch (error) {
      logDatabase.error('Failed to initialize delivery details', { enquiryId, error });
      throw error;
    }
  }
}