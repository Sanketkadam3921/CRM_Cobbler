import { executeQuery, executeTransaction, getConnection } from '../config/database';
import { logDatabase } from '../utils/logger';
import {
  Enquiry,
  DatabaseEnquiry,
  DatabaseEnquiryProduct,
  DatabasePickupDetails,
  DatabaseServiceDetails,
  DatabasePhoto,
  PickupStatus,
  WorkflowStage,
  ProductItem
} from '../types';

export class PickupModel {

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
      logDatabase.error('Failed to get enquiry products', error);
      return [];
    }
  }

  // Convert database row to Enquiry object with pickup details
  private static mapDatabaseToEnquiry(dbEnquiry: DatabaseEnquiry, pickupDetails?: DatabasePickupDetails, products: ProductItem[] = []): Enquiry {
    return {
      id: dbEnquiry.id,
      customerName: dbEnquiry.customer_name,
      phone: dbEnquiry.phone,
      address: dbEnquiry.address,
      message: dbEnquiry.message,
      inquiryType: dbEnquiry.inquiry_type,
      product: dbEnquiry.product,
      quantity: dbEnquiry.quantity,
      products: products,
      date: dbEnquiry.date,
      status: dbEnquiry.status,
      contacted: dbEnquiry.contacted,
      contactedAt: dbEnquiry.contacted_at,
      assignedTo: dbEnquiry.assigned_to,
      notes: dbEnquiry.notes,
      currentStage: dbEnquiry.current_stage,
      quotedAmount: dbEnquiry.quoted_amount,
      finalAmount: dbEnquiry.final_amount,
      pickupDetails: pickupDetails ? {
        status: pickupDetails.status,
        scheduledTime: pickupDetails.scheduled_time,
        assignedTo: pickupDetails.assigned_to,
        collectionNotes: pickupDetails.collection_notes,
        collectedAt: pickupDetails.collected_at,
        pin: pickupDetails.pin,
        photos: {
          afterPhoto: undefined, // Will be populated from photos table
          beforePhoto: undefined, // Will be populated from photos table
        }
      } : undefined
    };
  }

  // Updated getStats method with proper NULL handling
  static async getStats(): Promise<{
    scheduledPickups: number;
    assignedPickups: number;
    collectedPickups: number;
    receivedPickups: number;
  }> {
    try {
      logDatabase.connection('Getting pickup statistics');

      const statsQuery = `
      SELECT 
        COUNT(CASE 
          WHEN pd.status IS NULL OR pd.status = 'scheduled' THEN 1 
        END) as scheduledPickups,
        
        COUNT(CASE 
          WHEN pd.status = 'assigned' THEN 1 
        END) as assignedPickups,
        
        COUNT(CASE 
          WHEN pd.status = 'collected' THEN 1 
        END) as collectedPickups,
        
        COUNT(CASE 
          WHEN pd.status = 'received' THEN 1 
        END) as receivedPickups
        
      FROM enquiries e
      LEFT JOIN pickup_details pd ON e.id = pd.enquiry_id
      WHERE e.current_stage = 'pickup'
    `;

      const result = await executeQuery<{
        scheduledPickups: number;
        assignedPickups: number;
        collectedPickups: number;
        receivedPickups: number;
      }>(statsQuery);

      const stats = result[0] || {
        scheduledPickups: 0,
        assignedPickups: 0,
        collectedPickups: 0,
        receivedPickups: 0
      };

      logDatabase.success('Retrieved pickup statistics successfully', stats);

      return stats;

    } catch (error) {
      logDatabase.error('Failed to get pickup statistics', error);
      throw error;
    }
  }
  // Get all pickup stage enquiries with optional search
  static async getPickupEnquiries(searchTerm?: string): Promise<Enquiry[]> {
    try {
      logDatabase.connection('Getting pickup enquiries', { searchTerm });

      let query = `
        SELECT 
          e.id, e.customer_name, e.phone, e.address, e.message, e.inquiry_type, 
          e.product, e.quantity, e.date, e.status, e.contacted, e.contacted_at, 
          e.assigned_to, e.notes, e.current_stage, e.quoted_amount, e.final_amount, 
          e.created_at, e.updated_at,
          pd.id as pd_id, pd.enquiry_id, pd.status as pd_status, pd.scheduled_time, 
          pd.assigned_to as pd_assigned_to, pd.collection_notes, pd.collected_at, 
          pd.pin, pd.collection_photo_id, pd.received_photo_id, pd.received_notes, 
          pd.created_at as pd_created_at, pd.updated_at as pd_updated_at
        FROM enquiries e
        LEFT JOIN pickup_details pd ON e.id = pd.enquiry_id
        WHERE e.current_stage = 'pickup'
      `;

      const params: any[] = [];

      if (searchTerm) {
        query += ` AND (e.customer_name LIKE ? OR e.address LIKE ? OR e.product LIKE ?)`;
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY e.created_at DESC, e.id DESC`;

      const dbRows = await executeQuery<any>(query, params);

      // Group by enquiry and create proper objects
      const enquiryMap = new Map<number, { enquiry: DatabaseEnquiry; pickupDetails?: DatabasePickupDetails }>();

      dbRows.forEach(row => {
        const enquiryId = row.id;
        if (!enquiryMap.has(enquiryId)) {
          // Extract enquiry data
          const enquiry: DatabaseEnquiry = {
            id: row.id,
            customer_name: row.customer_name,
            phone: row.phone,
            address: row.address,
            message: row.message,
            inquiry_type: row.inquiry_type,
            product: row.product,
            quantity: row.quantity,
            date: row.date,
            status: row.status,
            contacted: row.contacted,
            contacted_at: row.contacted_at,
            assigned_to: row.assigned_to,
            notes: row.notes,
            current_stage: row.current_stage,
            quoted_amount: row.quoted_amount,
            final_amount: row.final_amount,
            created_at: row.created_at,
            updated_at: row.updated_at
          };

          // Extract pickup details if they exist
          let pickupDetails: DatabasePickupDetails | undefined;
          if (row.pd_id) {
            pickupDetails = {
              id: row.pd_id,
              enquiry_id: row.enquiry_id,
              status: row.pd_status,
              scheduled_time: row.scheduled_time,
              assigned_to: row.pd_assigned_to,
              collection_notes: row.collection_notes,
              collected_at: row.collected_at,
              pin: row.pin,
              collection_photo_id: row.collection_photo_id,
              received_photo_id: row.received_photo_id,
              received_notes: row.received_notes,
              created_at: row.pd_created_at,
              updated_at: row.pd_updated_at
            };
          }

          enquiryMap.set(enquiryId, { enquiry, pickupDetails });
        }
      });

      // Fetch products for each enquiry
      const enquiries = await Promise.all(
        Array.from(enquiryMap.values()).map(async ({ enquiry, pickupDetails }) => {
          const products = await this.getEnquiryProducts(enquiry.id);
          return this.mapDatabaseToEnquiry(enquiry, pickupDetails, products);
        })
      );

      logDatabase.success('Retrieved pickup enquiries successfully', {
        count: enquiries.length
      });

      return enquiries;

    } catch (error) {
      logDatabase.error('Failed to get pickup enquiries', error);
      throw error;
    }
  }

  // Get pickup enquiry by ID
  static async getPickupEnquiry(id: number): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Getting pickup enquiry by ID', { id });

      const query = `
        SELECT 
          e.id, e.customer_name, e.phone, e.address, e.message, e.inquiry_type, 
          e.product, e.quantity, e.date, e.status, e.contacted, e.contacted_at, 
          e.assigned_to, e.notes, e.current_stage, e.quoted_amount, e.final_amount, 
          e.created_at, e.updated_at,
          pd.id as pd_id, pd.enquiry_id, pd.status as pd_status, pd.scheduled_time, 
          pd.assigned_to as pd_assigned_to, pd.collection_notes, pd.collected_at, 
          pd.pin, pd.collection_photo_id, pd.received_photo_id, pd.received_notes, 
          pd.created_at as pd_created_at, pd.updated_at as pd_updated_at
        FROM enquiries e
        LEFT JOIN pickup_details pd ON e.id = pd.enquiry_id
        WHERE e.id = ? AND e.current_stage = 'pickup'
      `;

      const dbRows = await executeQuery<any>(query, [id]);

      if (dbRows.length === 0) {
        logDatabase.success('Pickup enquiry not found', { id });
        return null;
      }

      const row = dbRows[0];

      // Extract enquiry data
      const enquiry: DatabaseEnquiry = {
        id: row.id,
        customer_name: row.customer_name,
        phone: row.phone,
        address: row.address,
        message: row.message,
        inquiry_type: row.inquiry_type,
        product: row.product,
        quantity: row.quantity,
        date: row.date,
        status: row.status,
        contacted: row.contacted,
        contacted_at: row.contacted_at,
        assigned_to: row.assigned_to,
        notes: row.notes,
        current_stage: row.current_stage,
        quoted_amount: row.quoted_amount,
        final_amount: row.final_amount,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      // Extract pickup details if they exist
      let pickupDetails: DatabasePickupDetails | undefined;
      if (row.pd_id) {
        pickupDetails = {
          id: row.pd_id,
          enquiry_id: row.enquiry_id,
          status: row.pd_status,
          scheduled_time: row.scheduled_time,
          assigned_to: row.pd_assigned_to,
          collection_notes: row.collection_notes,
          collected_at: row.collected_at,
          pin: row.pin,
          collection_photo_id: row.collection_photo_id,
          received_photo_id: row.received_photo_id,
          received_notes: row.received_notes,
          created_at: row.pd_created_at,
          updated_at: row.pd_updated_at
        };
      }

      // Fetch products for the enquiry
      const products = await this.getEnquiryProducts(enquiry.id);
      const result = this.mapDatabaseToEnquiry(enquiry, pickupDetails, products);

      logDatabase.success('Retrieved pickup enquiry successfully', { id });

      return result;

    } catch (error) {
      logDatabase.error('Failed to get pickup enquiry by ID', error);
      throw error;
    }
  }

  // Assign pickup to staff member
  static async assignPickup(enquiryId: number, assignedTo: string): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Assigning pickup', { enquiryId, assignedTo });

      // Check if enquiry exists and is in pickup stage
      const enquiry = await this.getPickupEnquiry(enquiryId);
      if (!enquiry) {
        logDatabase.success('Enquiry not found for pickup assignment', { enquiryId });
        return null;
      }

      // Create or update pickup details
      const pickupQuery = `
        INSERT INTO pickup_details (enquiry_id, status, assigned_to, created_at, updated_at)
        VALUES (?, 'assigned', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
          status = 'assigned',
          assigned_to = ?,
          updated_at = CURRENT_TIMESTAMP
      `;

      await executeQuery(pickupQuery, [enquiryId, assignedTo, assignedTo]);

      // Get updated enquiry
      const updatedEnquiry = await this.getPickupEnquiry(enquiryId);

      logDatabase.success('Pickup assigned successfully', { enquiryId, assignedTo });

      return updatedEnquiry;

    } catch (error) {
      logDatabase.error('Failed to assign pickup', error);
      throw error;
    }
  }

  // Mark pickup as collected
  static async markCollected(enquiryId: number, collectionPhoto: string, notes?: string): Promise<Enquiry | null> {
    const connection = await getConnection();

    try {
      logDatabase.connection('Marking pickup as collected', { enquiryId, hasPhoto: !!collectionPhoto });

      // Check if enquiry exists and is in pickup stage
      const enquiry = await this.getPickupEnquiry(enquiryId);
      if (!enquiry) {
        logDatabase.success('Enquiry not found for collection marking', { enquiryId });
        return null;
      }

      // Start transaction
      await connection.beginTransaction();

      // Insert collection photo and get the photo ID
      const [photoResult] = await connection.execute(
        `INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, created_at)
         VALUES (?, 'pickup', 'after_photo', ?, ?, CURRENT_TIMESTAMP)`,
        [enquiryId, collectionPhoto, notes || 'Collection proof photo']
      ) as any;

      const photoId = photoResult.insertId;

      // Update pickup details with the photo ID
      await connection.execute(
        `UPDATE pickup_details 
         SET status = 'collected', 
             collection_notes = ?,
             collected_at = CURRENT_TIMESTAMP,
             collection_photo_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE enquiry_id = ?`,
        [notes || '', photoId, enquiryId]
      );

      // Commit transaction
      await connection.commit();

      // Get updated enquiry
      const updatedEnquiry = await this.getPickupEnquiry(enquiryId);

      logDatabase.success('Pickup marked as collected successfully', { enquiryId });

      return updatedEnquiry;

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      logDatabase.error('Failed to mark pickup as collected', error);
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }

  // Mark item as received and move to service stage
  static async markReceived(enquiryId: number, receivedPhoto: string, notes?: string, estimatedCost?: number): Promise<Enquiry | null> {
    const connection = await getConnection();

    try {
      logDatabase.connection('Marking item as received and moving to service', { enquiryId, hasPhoto: !!receivedPhoto });

      // Check if enquiry exists and is in pickup stage
      const enquiry = await this.getPickupEnquiry(enquiryId);
      if (!enquiry) {
        logDatabase.success('Enquiry not found for receipt marking', { enquiryId });
        return null;
      }

      // Start transaction
      await connection.beginTransaction();

      // Insert received photo and get the photo ID
      const [photoResult] = await connection.execute(
        `INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, created_at)
         VALUES (?, 'pickup', 'before_photo', ?, ?, CURRENT_TIMESTAMP)`,
        [enquiryId, receivedPhoto, notes || 'Received condition photo']
      ) as any;

      const photoId = photoResult.insertId;

      // Update pickup details with the photo ID
      await connection.execute(
        `UPDATE pickup_details 
         SET status = 'received', 
             received_notes = ?,
             received_photo_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE enquiry_id = ?`,
        [notes || '', photoId, enquiryId]
      );

      // Update enquiry stage to service
      await connection.execute(
        `UPDATE enquiries 
         SET current_stage = 'service', 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [enquiryId]
      );

      // Create service details with the same photo ID
      await connection.execute(
        `INSERT INTO service_details (enquiry_id, estimated_cost, received_notes, received_photo_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [enquiryId, estimatedCost || enquiry.quotedAmount || 0, notes || '', photoId]
      );

      // Commit transaction
      await connection.commit();

      logDatabase.success('Item marked as received and moved to service successfully', { enquiryId });

      // Return updated enquiry in pickup stage response format (still in pickup controller); frontend will refetch service list
      const updated = await this.getPickupEnquiry(enquiryId);
      return updated || enquiry;

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      logDatabase.error('Failed to mark item as received', error);
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }

  // New: Mark multiple product items as received with multiple photos (up to 4 per item)
  static async markReceivedMulti(
    enquiryId: number,
    items: Array<{ product: string; itemIndex: number; photos: string[]; notes?: string }>,
    notes?: string,
    estimatedCost?: number
  ): Promise<Enquiry | null> {
    const connection = await getConnection();

    try {
      logDatabase.connection('Marking multiple items as received and moving to service', { enquiryId, items: items.length });

      const enquiry = await this.getPickupEnquiry(enquiryId);
      if (!enquiry) {
        logDatabase.success('Enquiry not found for receipt marking', { enquiryId });
        return null;
      }

      await connection.beginTransaction();

      // Ensure service_details exists and set estimated cost
      const [serviceInsert] = await connection.execute(
        `INSERT INTO service_details (enquiry_id, estimated_cost, received_notes, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE estimated_cost = VALUES(estimated_cost), received_notes = VALUES(received_notes), updated_at = CURRENT_TIMESTAMP`,
        [enquiryId, estimatedCost || enquiry.quotedAmount || 0, notes || '']
      ) as any;

      // Insert photos for each product item
      for (const item of items) {
        const product = item.product as any;
        const idx = item.itemIndex;
        const photos = Array.isArray(item.photos) ? item.photos.slice(0, 4) : [];
        let slot = 1;
        for (const photo of photos) {
          await connection.execute(
            `INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, product, item_index, slot_index, created_at)
             VALUES (?, 'pickup', 'before_photo', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [enquiryId, photo, item.notes || 'Received condition photo', product, idx, slot]
          );
          slot++;
        }
      }

      // Upsert pickup_details to received
      await connection.execute(
        `INSERT INTO pickup_details (enquiry_id, status, received_notes, created_at, updated_at)
         VALUES (?, 'received', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE status='received', received_notes = VALUES(received_notes), updated_at = CURRENT_TIMESTAMP`,
        [enquiryId, notes || '']
      );

      // Move enquiry to service stage
      await connection.execute(
        `UPDATE enquiries SET current_stage = 'service', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [enquiryId]
      );

      await connection.commit();

      logDatabase.success('Items marked as received and moved to service successfully', { enquiryId });
      // Return updated enquiry (for pickup context); service list will reflect via service endpoints
      const updated = await this.getPickupEnquiry(enquiryId);
      return updated || enquiry;
    } catch (error) {
      await connection.rollback();
      logDatabase.error('Failed to mark items as received', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update pickup status
  static async updateStatus(enquiryId: number, status: PickupStatus, additionalData?: any): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Updating pickup status', { enquiryId, status, additionalData });

      // Check if enquiry exists and is in pickup stage
      const enquiry = await this.getPickupEnquiry(enquiryId);
      if (!enquiry) {
        logDatabase.success('Enquiry not found for status update', { enquiryId });
        return null;
      }

      // Build update query based on status and additional data
      let updateQuery = 'UPDATE pickup_details SET status = ?, updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [status];

      if (status === 'assigned' && additionalData?.assignedTo) {
        updateQuery += ', assigned_to = ?';
        params.push(additionalData.assignedTo);
      }

      if (status === 'collected') {
        updateQuery += ', collected_at = CURRENT_TIMESTAMP';
        if (additionalData?.notes) {
          updateQuery += ', collection_notes = ?';
          params.push(additionalData.notes);
        }
      }

      if (status === 'received') {
        updateQuery += ', received_at = CURRENT_TIMESTAMP';
        if (additionalData?.notes) {
          updateQuery += ', received_notes = ?';
          params.push(additionalData.notes);
        }
      }

      updateQuery += ' WHERE enquiry_id = ?';
      params.push(enquiryId);

      await executeQuery(updateQuery, params);

      // Get updated enquiry
      const updatedEnquiry = await this.getPickupEnquiry(enquiryId);

      logDatabase.success('Pickup status updated successfully', { enquiryId, status });

      return updatedEnquiry;

    } catch (error) {
      logDatabase.error('Failed to update pickup status', error);
      throw error;
    }
  }
}