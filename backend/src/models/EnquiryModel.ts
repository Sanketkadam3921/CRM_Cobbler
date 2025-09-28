import { executeQuery, executeTransaction, getConnection } from '../config/database';
import { logDatabase } from '../utils/logger';
import {
  Enquiry,
  DatabaseEnquiry,
  DatabaseEnquiryProduct,
  DatabasePickupDetails,
  DatabaseServiceDetails,
  DatabaseServiceType,
  DatabasePhoto,
  DatabaseDeliveryDetails,
  DatabaseBillingDetails,
  DatabaseBillingItem,
  InquiryType,
  ProductType,
  EnquiryStatus,
  WorkflowStage,
  ProductItem
} from '../types';

export class EnquiryModel {

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

  // Save products for an enquiry
  private static async saveEnquiryProducts(enquiryId: number, products: ProductItem[]): Promise<void> {
    try {
      if (products.length === 0) return;

      // Delete existing products
      await executeQuery('DELETE FROM enquiry_products WHERE enquiry_id = ?', [enquiryId]);

      // Insert new products
      const values = products.map(() => '(?, ?, ?)').join(', ');
      const params = products.flatMap(p => [enquiryId, p.product, p.quantity]);

      const query = `INSERT INTO enquiry_products (enquiry_id, product, quantity) VALUES ${values}`;
      await executeQuery(query, params);
    } catch (error) {
      logDatabase.error('Failed to save enquiry products', error);
      throw error;
    }
  }

  // Convert database row to Enquiry object
  private static mapDatabaseToEnquiry(dbEnquiry: DatabaseEnquiry, products: ProductItem[] = []): Enquiry {
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
      pickupDate: dbEnquiry.pickup_date,
      deliveryDate: dbEnquiry.delivery_date,
    };
  }

  // Convert Enquiry object to database row
  private static mapEnquiryToDatabase(enquiry: Partial<Enquiry>): Partial<DatabaseEnquiry> {
    // Helper function to convert ISO date string to YYYY-MM-DD format
    const formatDateForDB = (dateString: string | undefined): string | undefined => {
      if (!dateString) return undefined;
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
      } catch (error) {
        logDatabase.error('Failed to parse date', { dateString, error });
        return undefined;
      }
    };

    // Helper function to convert ISO datetime string to MySQL datetime format
    const formatDateTimeForDB = (dateTimeString: string | undefined): string | undefined => {
      if (!dateTimeString) return undefined;
      try {
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 19).replace('T', ' '); // Returns YYYY-MM-DD HH:MM:SS
      } catch (error) {
        logDatabase.error('Failed to parse datetime', { dateTimeString, error });
        return undefined;
      }
    };

    return {
      customer_name: enquiry.customerName,
      phone: enquiry.phone,
      address: enquiry.address,
      message: enquiry.message,
      inquiry_type: enquiry.inquiryType,
      product: enquiry.product,
      quantity: enquiry.quantity,
      date: formatDateForDB(enquiry.date),
      status: enquiry.status,
      contacted: enquiry.contacted,
      contacted_at: formatDateTimeForDB(enquiry.contactedAt),
      assigned_to: enquiry.assignedTo,
      notes: enquiry.notes,
      current_stage: enquiry.currentStage,
      quoted_amount: enquiry.quotedAmount,
      final_amount: enquiry.finalAmount,
      pickup_date: formatDateForDB(enquiry.pickupDate),
      delivery_date: formatDateForDB(enquiry.deliveryDate)
    };
  }

  // Get all enquiries with optional filtering and pagination
  static async getAll(filters: {
    page?: number;
    limit?: number;
    status?: string;
    currentStage?: string;
    search?: string;
  } = {}): Promise<{ data: Enquiry[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      logDatabase.connection('Getting all enquiries with filters', filters);

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filters.status) {
        whereConditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.currentStage) {
        whereConditions.push('current_stage = ?');
        params.push(filters.currentStage);
      }

      if (filters.search) {
        whereConditions.push('(customer_name LIKE ? OR phone LIKE ? OR address LIKE ? OR message LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM enquiries ${whereClause}`;
      const countResult = await executeQuery<{ total: number }>(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Get paginated data
      const dataQuery = `
        SELECT * FROM enquiries 
        ${whereClause}
        ORDER BY created_at DESC, id DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `;
      const dataParams = [...params];
      const dbEnquiries = await executeQuery<DatabaseEnquiry>(dataQuery, dataParams);

      // Convert to Enquiry objects with products
      const enquiries = await Promise.all(
        dbEnquiries.map(async (dbEnquiry) => {
          const products = await this.getEnquiryProducts(dbEnquiry.id);
          return this.mapDatabaseToEnquiry(dbEnquiry, products);
        })
      );

      const totalPages = Math.ceil(total / limit);

      logDatabase.success('Retrieved enquiries successfully', {
        count: enquiries.length,
        total,
        page,
        limit,
        totalPages
      });

      return {
        data: enquiries,
        total,
        page,
        limit,
        totalPages
      };

    } catch (error) {
      logDatabase.error('Failed to get all enquiries', error);
      throw error;
    }
  }

  // Get enquiry by ID with all related data
  static async getById(id: number): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Getting enquiry by ID', { id });

      const query = 'SELECT * FROM enquiries WHERE id = ?';
      const dbEnquiries = await executeQuery<DatabaseEnquiry>(query, [id]);

      if (dbEnquiries.length === 0) {
        logDatabase.success('Enquiry not found', { id });
        return null;
      }

      const products = await this.getEnquiryProducts(id);
      const enquiry = this.mapDatabaseToEnquiry(dbEnquiries[0], products);

      logDatabase.success('Retrieved enquiry successfully', { id });

      return enquiry;

    } catch (error) {
      logDatabase.error('Failed to get enquiry by ID', error);
      throw error;
    }
  }

  // Create new enquiry
  static async create(enquiryData: Omit<Enquiry, 'id'>): Promise<Enquiry> {
    try {
      logDatabase.connection('Creating new enquiry', { customerName: enquiryData.customerName });

      const dbData = this.mapEnquiryToDatabase(enquiryData);

      const query = `
        INSERT INTO enquiries (
          customer_name, phone, address, message, inquiry_type, product, 
          quantity, date, status, contacted, contacted_at, assigned_to, 
          notes, current_stage, quoted_amount, final_amount, pickup_date, delivery_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        dbData.customer_name,
        dbData.phone,
        dbData.address,
        dbData.message,
        dbData.inquiry_type,
        dbData.product,
        dbData.quantity,
        dbData.date,
        dbData.status || 'new',
        dbData.contacted || false,
        dbData.contacted_at ?? null,
        dbData.assigned_to ?? null,
        dbData.notes ?? null,
        dbData.current_stage || 'enquiry',
        dbData.quoted_amount ?? null,
        dbData.final_amount ?? null,
        dbData.pickup_date ?? null,
        dbData.delivery_date ?? null
      ];

      // For INSERT operations, we need to get the insertId
      const connection = await getConnection();
      let newId: number;
      try {
        const [result] = await connection.execute(query, params);
        newId = (result as any).insertId;

        if (!newId) {
          throw new Error('Failed to get insert ID');
        }
      } finally {
        connection.release();
      }

      // Save products if provided
      if (enquiryData.products && enquiryData.products.length > 0) {
        await this.saveEnquiryProducts(newId, enquiryData.products);
      }

      // Get the created enquiry
      const createdEnquiry = await this.getById(newId);

      if (!createdEnquiry) {
        throw new Error('Failed to retrieve created enquiry');
      }

      logDatabase.success('Enquiry created successfully', {
        id: newId,
        customerName: enquiryData.customerName
      });

      return createdEnquiry;

    } catch (error) {
      logDatabase.error('Failed to create enquiry', error);
      throw error;
    }
  }

  // Update enquiry
  static async update(id: number, updates: Partial<Enquiry>): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Updating enquiry', { id, updates });

      // Check if enquiry exists
      const existingEnquiry = await this.getById(id);
      if (!existingEnquiry) {
        logDatabase.success('Enquiry not found for update', { id });
        return null;
      }

      const dbUpdates = this.mapEnquiryToDatabase(updates);

      // Build SET clause
      const setFields: string[] = [];
      const params: any[] = [];

      Object.entries(dbUpdates).forEach(([key, value]) => {
        if (value !== undefined) {
          setFields.push(`${key} = ?`);
          params.push(value);
        }
      });

      if (setFields.length === 0) {
        logDatabase.success('No updates to apply', { id });
        return existingEnquiry;
      }

      // Add updated_at timestamp
      setFields.push('updated_at = CURRENT_TIMESTAMP');

      const query = `UPDATE enquiries SET ${setFields.join(', ')} WHERE id = ?`;
      params.push(id);

      await executeQuery(query, params);

      // Update products if provided
      if (updates.products !== undefined) {
        await this.saveEnquiryProducts(id, updates.products);
      }

      // Get updated enquiry
      const updatedEnquiry = await this.getById(id);

      logDatabase.success('Enquiry updated successfully', { id });

      return updatedEnquiry;

    } catch (error) {
      logDatabase.error('Failed to update enquiry', error);
      throw error;
    }
  }

  // Delete enquiry
  static async delete(id: number): Promise<boolean> {
    try {
      logDatabase.connection('Deleting enquiry', { id });

      // Check if enquiry exists
      const existingEnquiry = await this.getById(id);
      if (!existingEnquiry) {
        logDatabase.success('Enquiry not found for deletion', { id });
        return false;
      }

      const query = 'DELETE FROM enquiries WHERE id = ?';
      await executeQuery(query, [id]);

      logDatabase.success('Enquiry deleted successfully', { id });

      return true;

    } catch (error) {
      logDatabase.error('Failed to delete enquiry', error);
      throw error;
    }
  }
  // Get CRM statistics

  // Get CRM statistics
  static async getStats(): Promise<{
    totalCurrentMonth: number;
    newThisWeek: number;
    converted: number;
    pendingFollowUp: number;
  }> {
    try {
      logDatabase.connection('Getting CRM statistics');

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // MySQL months are 1-indexed
      const currentYear = now.getFullYear();

      // Get start of current week (Monday)
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Handle Sunday as 0
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);

      const statsQuery = `
        SELECT 
          COUNT(CASE WHEN MONTH(date) = ? AND YEAR(date) = ? THEN 1 END) as totalCurrentMonth,
          COUNT(CASE WHEN date >= ? AND status = 'new' THEN 1 END) as newThisWeek,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
          COUNT(CASE WHEN status = 'contacted' THEN 1 END) as pendingFollowUp
        FROM enquiries
      `;

      const params = [currentMonth, currentYear, startOfWeek.toISOString().split('T')[0]];
      const result = await executeQuery<{
        totalCurrentMonth: number;
        newThisWeek: number;
        converted: number;
        pendingFollowUp: number;
      }>(statsQuery, params);

      const stats = result[0] || {
        totalCurrentMonth: 0,
        newThisWeek: 0,
        converted: 0,
        pendingFollowUp: 0
      };

      logDatabase.success('Retrieved CRM statistics successfully', stats);

      return stats;

    } catch (error) {
      logDatabase.error('Failed to get CRM statistics', error);
      throw error;
    }
  }



  // Mark enquiry as contacted
  static async markContacted(id: number): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Marking enquiry as contacted', { id });

      const updates = {
        contacted: true,
        contactedAt: new Date().toISOString(),
        status: 'contacted' as EnquiryStatus
      };

      const result = await this.update(id, updates);

      logDatabase.success('Enquiry marked as contacted', { id });

      return result;

    } catch (error) {
      logDatabase.error('Failed to mark enquiry as contacted', error);
      throw error;
    }
  }

  // Convert enquiry
  static async convert(id: number, quotedAmount: number): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Converting enquiry', { id, quotedAmount });

      const updates = {
        status: 'converted' as EnquiryStatus,
        contacted: true,
        contactedAt: new Date().toISOString(),
        quotedAmount
      };

      const result = await this.update(id, updates);

      logDatabase.success('Enquiry converted successfully', { id, quotedAmount });

      return result;

    } catch (error) {
      logDatabase.error('Failed to convert enquiry', error);
      throw error;
    }
  }

  // Transition enquiry to next stage
  static async transitionStage(id: number, newStage: WorkflowStage): Promise<Enquiry | null> {
    try {
      logDatabase.connection('Transitioning enquiry stage', { id, newStage });

      const updates = {
        currentStage: newStage
      };

      const result = await this.update(id, updates);

      logDatabase.success('Enquiry stage transitioned successfully', { id, newStage });

      return result;

    } catch (error) {
      logDatabase.error('Failed to transition enquiry stage', error);
      throw error;
    }
  }

  // Get enquiries by stage
  static async getByStage(stage: WorkflowStage): Promise<Enquiry[]> {
    try {
      logDatabase.connection('Getting enquiries by stage', { stage });

      const query = 'SELECT * FROM enquiries WHERE current_stage = ? ORDER BY created_at DESC, id DESC';
      const dbEnquiries = await executeQuery<DatabaseEnquiry>(query, [stage]);

      const enquiries = await Promise.all(
        dbEnquiries.map(async (dbEnquiry) => {
          const products = await this.getEnquiryProducts(dbEnquiry.id);
          return this.mapDatabaseToEnquiry(dbEnquiry, products);
        })
      );

      logDatabase.success('Retrieved enquiries by stage successfully', {
        stage,
        count: enquiries.length
      });

      return enquiries;

    } catch (error) {
      logDatabase.error('Failed to get enquiries by stage', error);
      throw error;
    }
  }
}