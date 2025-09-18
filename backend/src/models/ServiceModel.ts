import { executeQuery, executeTransaction } from '../config/database';
import {
  ServiceDetails,
  ServiceTypeStatus,
  ServiceStats,
  ServiceType,
  ServiceStatus,
  DatabaseServiceDetails,
  DatabaseServiceEnquiryJoin,
  DatabaseServiceType,
  DatabasePhoto
} from '../types';

export class ServiceModel {

  // Get all service stage enquiries with complete details
  static async getServiceEnquiries(): Promise<ServiceDetails[]> {
    try {
      const query = `
        SELECT 
          e.id as enquiry_id,
          e.customer_name,
          e.phone,
          e.address,
          e.product,
          e.quantity,
          e.quoted_amount,
          e.current_stage,
          COALESCE(sd.id, NULL) as service_detail_id,
          COALESCE(sd.estimated_cost, NULL) as estimated_cost,
          COALESCE(sd.actual_cost, NULL) as actual_cost,
          COALESCE(sd.work_notes, NULL) as work_notes,
          COALESCE(sd.completed_at, NULL) as completed_at,
          COALESCE(sd.received_photo_id, NULL) as received_photo_id,
          COALESCE(sd.received_notes, NULL) as received_notes,
          COALESCE(sd.overall_before_photo_id, NULL) as overall_before_photo_id,
          COALESCE(sd.overall_after_photo_id, NULL) as overall_after_photo_id,
          COALESCE(sd.overall_before_notes, NULL) as overall_before_notes,
          COALESCE(sd.overall_after_notes, NULL) as overall_after_notes,
          COALESCE(sd.created_at, e.created_at) as created_at,
          COALESCE(sd.updated_at, e.updated_at) as updated_at
        FROM enquiries e
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        WHERE e.current_stage = 'service'
        ORDER BY e.created_at DESC
      `;

      const enquiries = await executeQuery<DatabaseServiceEnquiryJoin>(query);

      console.log('🔍 ServiceModel.getServiceEnquiries - Raw query result:', enquiries);
      console.log('🔍 Found enquiries in service stage:', enquiries.length);

      // Get service types for each enquiry
      const serviceDetails: ServiceDetails[] = [];

      for (const enquiry of enquiries) {
        console.log('🔍 Processing enquiry:', enquiry.enquiry_id, enquiry.customer_name);

        const serviceTypes = await this.getServiceTypes(enquiry.enquiry_id);
        const overallPhotos = await this.getOverallPhotos(enquiry.enquiry_id);

        console.log('🔍 Service types for enquiry', enquiry.enquiry_id, ':', serviceTypes.length);
        console.log('🔍 Overall photos for enquiry', enquiry.enquiry_id, ':', overallPhotos);

        serviceDetails.push({
          id: enquiry.service_detail_id,
          enquiryId: enquiry.enquiry_id,
          customerName: enquiry.customer_name,
          phone: enquiry.phone,
          address: enquiry.address,
          product: enquiry.product,
          quantity: enquiry.quantity,
          quotedAmount: enquiry.quoted_amount,
          estimatedCost: enquiry.estimated_cost,
          actualCost: enquiry.actual_cost,
          workNotes: enquiry.work_notes,
          completedAt: enquiry.completed_at,
          receivedPhotoId: enquiry.received_photo_id,
          receivedNotes: enquiry.received_notes,
          overallBeforePhotoId: enquiry.overall_before_photo_id,
          overallAfterPhotoId: enquiry.overall_after_photo_id,
          overallBeforeNotes: enquiry.overall_before_notes,
          overallAfterNotes: enquiry.overall_after_notes,
          serviceTypes,
          overallPhotos: overallPhotos, // Add the actual photo data
          createdAt: enquiry.created_at,
          updatedAt: enquiry.updated_at
        });
      }

      console.log('🔍 Final service details to return:', serviceDetails.length);
      return serviceDetails;
    } catch (error) {
      console.error('Error getting service enquiries:', error);
      throw error;
    }
  }

  // Get service types for a specific enquiry
  static async getServiceTypes(enquiryId: number): Promise<ServiceTypeStatus[]> {
    try {
      const query = `
        SELECT 
          st.id,
          st.service_type,
          st.status,
          st.department,
          st.assigned_to,
          st.started_at,
          st.completed_at,
          st.work_notes,
          st.created_at,
          st.updated_at
        FROM service_types st
        WHERE st.enquiry_id = ?
        ORDER BY st.created_at ASC
      `;

      const serviceTypes = await executeQuery<DatabaseServiceType>(query, [enquiryId]);

      // Get photos for each service type
      const serviceTypeStatuses: ServiceTypeStatus[] = [];

      for (const serviceType of serviceTypes) {
        const photos = await this.getServicePhotos(serviceType.id);

        serviceTypeStatuses.push({
          id: serviceType.id,
          type: serviceType.service_type as ServiceType,
          status: serviceType.status as ServiceStatus,
          department: serviceType.department,
          assignedTo: serviceType.assigned_to,
          startedAt: serviceType.started_at,
          completedAt: serviceType.completed_at,
          workNotes: serviceType.work_notes,
          photos,
          createdAt: serviceType.created_at,
          updatedAt: serviceType.updated_at
        });
      }

      return serviceTypeStatuses;
    } catch (error) {
      console.error('Error getting service types:', error);
      throw error;
    }
  }

  // Get photos for a specific service type
  static async getServicePhotos(serviceTypeId: number): Promise<{
    beforePhoto?: string;
    afterPhoto?: string;
    beforeNotes?: string;
    afterNotes?: string;
  }> {
    try {
      const query = `
        SELECT 
          photo_type,
          photo_data,
          notes
        FROM photos
        WHERE service_type_id = ?
        ORDER BY created_at ASC
      `;

      const photos = await executeQuery<DatabasePhoto>(query, [serviceTypeId]);

      const result: {
        beforePhoto?: string;
        afterPhoto?: string;
        beforeNotes?: string;
        afterNotes?: string;
      } = {};

      photos.forEach(photo => {
        if (photo.photo_type === 'before_photo') {
          result.beforePhoto = photo.photo_data;
          result.beforeNotes = photo.notes;
        } else if (photo.photo_type === 'after_photo') {
          result.afterPhoto = photo.photo_data;
          result.afterNotes = photo.notes;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting service photos:', error);
      throw error;
    }
  }

  // Get overall photos for an enquiry
  static async getOverallPhotos(enquiryId: number): Promise<{
    beforePhoto?: string;
    afterPhoto?: string;
    beforeNotes?: string;
    afterNotes?: string;
  }> {
    try {
      // First, try to get overall photos (service stage photos)
      const overallQuery = `
        SELECT 
          photo_type,
          photo_data,
          notes
        FROM photos
        WHERE enquiry_id = ? AND (photo_type = 'overall_before' OR photo_type = 'overall_after')
        ORDER BY created_at ASC
      `;

      const overallPhotos = await executeQuery<DatabasePhoto>(overallQuery, [enquiryId]);

      // Also get pickup photos (before_photo and after_photo) as they serve as the initial "before" photos
      const pickupQuery = `
        SELECT 
          photo_type,
          photo_data,
          notes
        FROM photos
        WHERE enquiry_id = ? AND (photo_type = 'before_photo' OR photo_type = 'after_photo')
        ORDER BY created_at ASC
      `;

      const pickupPhotos = await executeQuery<DatabasePhoto>(pickupQuery, [enquiryId]);

      const result: {
        beforePhoto?: string;
        afterPhoto?: string;
        beforeNotes?: string;
        afterNotes?: string;
      } = {};

      // Process overall photos first (service stage)
      overallPhotos.forEach(photo => {
        if (photo.photo_type === 'overall_before') {
          result.beforePhoto = photo.photo_data;
          result.beforeNotes = photo.notes;
        } else if (photo.photo_type === 'overall_after') {
          result.afterPhoto = photo.photo_data;
          result.afterNotes = photo.notes;
        }
      });

      // If no overall before photo exists, use pickup before_photo as the initial before photo
      if (!result.beforePhoto) {
        const pickupBeforePhoto = pickupPhotos.find(photo => photo.photo_type === 'before_photo');
        if (pickupBeforePhoto) {
          result.beforePhoto = pickupBeforePhoto.photo_data;
          result.beforeNotes = pickupBeforePhoto.notes || 'Photo from pickup stage';
        }
      }

      // If no overall before photo exists, use pickup after_photo as the initial before photo
      // (the photo collected at pickup becomes the "before" photo for service)
      if (!result.beforePhoto) {
        const pickupAfterPhoto = pickupPhotos.find(photo => photo.photo_type === 'after_photo');
        if (pickupAfterPhoto) {
          result.beforePhoto = pickupAfterPhoto.photo_data;
          result.beforeNotes = pickupAfterPhoto.notes || 'Photo from pickup stage';
        }
      }

      // afterPhoto should remain empty until service is completed
      // (we don't use pickup after_photo for this)

      return result;
    } catch (error) {
      console.error('Error getting overall photos:', error);
      throw error;
    }
  }

  // Assign services to an enquiry
  static async assignServices(enquiryId: number, serviceTypes: ServiceType[]): Promise<void> {
    try {
      // First, ensure service_details record exists
      await this.ensureServiceDetailsExist(enquiryId);

      // Insert service types
      const queries = serviceTypes.map(serviceType => ({
        query: `
          INSERT INTO service_types (enquiry_id, service_type, status, created_at, updated_at)
          VALUES (?, ?, 'pending', NOW(), NOW())
        `,
        params: [enquiryId, serviceType]
      }));

      await executeTransaction(queries);
    } catch (error) {
      console.error('Error assigning services:', error);
      throw error;
    }
  }

  // Ensure service_details record exists
  static async ensureServiceDetailsExist(enquiryId: number): Promise<void> {
    try {
      const checkQuery = 'SELECT id FROM service_details WHERE enquiry_id = ?';
      const existing = await executeQuery(checkQuery, [enquiryId]);

      if (existing.length === 0) {
        const insertQuery = `
          INSERT INTO service_details (enquiry_id, created_at, updated_at)
          VALUES (?, NOW(), NOW())
        `;
        await executeQuery(insertQuery, [enquiryId]);
      }
    } catch (error) {
      console.error('Error ensuring service details exist:', error);
      throw error;
    }
  }

  // Start a service
  static async startService(serviceTypeId: number, beforePhoto: string, notes?: string): Promise<void> {
    try {
      const queries = [
        {
          query: `
            UPDATE service_types 
            SET status = 'in-progress', started_at = NOW(), updated_at = NOW()
            WHERE id = ?
          `,
          params: [serviceTypeId]
        },
        {
          query: `
            INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, service_type_id, created_at)
            VALUES (
              (SELECT enquiry_id FROM service_types WHERE id = ?),
              'service',
              'before_photo',
              ?,
              ?,
              ?,
              NOW()
            )
          `,
          params: [serviceTypeId, beforePhoto, notes || null, serviceTypeId]
        }
      ];

      await executeTransaction(queries);
    } catch (error) {
      console.error('Error starting service:', error);
      throw error;
    }
  }

  // Complete a service
  static async completeService(serviceTypeId: number, afterPhoto: string, notes?: string): Promise<void> {
    try {
      const queries = [
        {
          query: `
            UPDATE service_types 
            SET status = 'done', completed_at = NOW(), updated_at = NOW()
            WHERE id = ?
          `,
          params: [serviceTypeId]
        },
        {
          query: `
            INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, service_type_id, created_at)
            VALUES (
              (SELECT enquiry_id FROM service_types WHERE id = ?),
              'service',
              'after_photo',
              ?,
              ?,
              ?,
              NOW()
            )
          `,
          params: [serviceTypeId, afterPhoto, notes || null, serviceTypeId]
        }
      ];

      await executeTransaction(queries);
    } catch (error) {
      console.error('Error completing service:', error);
      throw error;
    }
  }

  // Save final overall photo
  static async saveFinalPhoto(enquiryId: number, afterPhoto: string, notes?: string): Promise<void> {
    try {
      const queries = [
        {
          query: `
            INSERT INTO photos (enquiry_id, stage, photo_type, photo_data, notes, created_at)
            VALUES (?, 'service', 'overall_after', ?, ?, NOW())
          `,
          params: [enquiryId, afterPhoto, notes || null]
        },
        {
          query: `
            UPDATE service_details 
            SET overall_after_photo_id = LAST_INSERT_ID(), updated_at = NOW()
            WHERE enquiry_id = ?
          `,
          params: [enquiryId]
        }
      ];

      await executeTransaction(queries);
    } catch (error) {
      console.error('Error saving final photo:', error);
      throw error;
    }
  }

  // Complete workflow and move to billing
  static async completeWorkflow(enquiryId: number, actualCost: number, workNotes?: string): Promise<void> {
    try {
      const queries = [
        {
          query: `
            UPDATE enquiries 
            SET current_stage = 'billing', updated_at = NOW()
            WHERE id = ?
          `,
          params: [enquiryId]
        },
        {
          query: `
            UPDATE service_details 
            SET actual_cost = ?, work_notes = ?, completed_at = NOW(), updated_at = NOW()
            WHERE enquiry_id = ?
          `,
          params: [actualCost, workNotes || null, enquiryId]
        }
      ];

      await executeTransaction(queries);
    } catch (error) {
      console.error('Error completing workflow:', error);
      throw error;
    }
  }

  // Get service statistics
  static async getServiceStats(): Promise<ServiceStats> {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN st.status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN st.status = 'in-progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN st.status = 'done' THEN 1 END) as done_count,
          COUNT(*) as total_count
        FROM service_types st
        INNER JOIN enquiries e ON st.enquiry_id = e.id
        WHERE e.current_stage = 'service'
      `;

      const result = await executeQuery<{
        pending_count: number;
        in_progress_count: number;
        done_count: number;
        total_count: number;
      }>(query);

      if (result.length === 0) {
        return { pendingCount: 0, inProgressCount: 0, doneCount: 0, totalServices: 0 };
      }

      const stats = result[0];
      return {
        pendingCount: stats.pending_count,
        inProgressCount: stats.in_progress_count,
        doneCount: stats.done_count,
        totalServices: stats.total_count
      };
    } catch (error) {
      console.error('Error getting service stats:', error);
      throw error;
    }
  }

  // Get specific enquiry service details
  static async getEnquiryServiceDetails(enquiryId: number): Promise<ServiceDetails | null> {
    try {
      const serviceTypes = await this.getServiceTypes(enquiryId);
      const overallPhotos = await this.getOverallPhotos(enquiryId);

      const query = `
        SELECT 
          e.customer_name,
          e.phone,
          e.address,
          e.product,
          e.quantity,
          e.quoted_amount,
          sd.id,
          sd.estimated_cost,
          sd.actual_cost,
          sd.work_notes,
          sd.completed_at,
          sd.received_photo_id,
          sd.received_notes,
          sd.overall_before_photo_id,
          sd.overall_after_photo_id,
          sd.overall_before_notes,
          sd.overall_after_notes,
          sd.created_at,
          sd.updated_at
        FROM enquiries e
        LEFT JOIN service_details sd ON e.id = sd.enquiry_id
        WHERE e.id = ?
      `;

      const result = await executeQuery<DatabaseServiceEnquiryJoin>(query, [enquiryId]);

      if (result.length === 0) {
        return null;
      }

      const detail = result[0];

      return {
        id: detail.service_detail_id,
        enquiryId,
        customerName: detail.customer_name,
        phone: detail.phone,
        address: detail.address,
        product: detail.product,
        quantity: detail.quantity,
        quotedAmount: detail.quoted_amount,
        estimatedCost: detail.estimated_cost,
        actualCost: detail.actual_cost,
        workNotes: detail.work_notes,
        completedAt: detail.completed_at,
        receivedPhotoId: detail.received_photo_id,
        receivedNotes: detail.received_notes,
        overallBeforePhotoId: detail.overall_before_photo_id,
        overallAfterPhotoId: detail.overall_after_photo_id,
        overallBeforeNotes: detail.overall_before_notes,
        overallAfterNotes: detail.overall_after_notes,
        serviceTypes,
        overallPhotos,
        createdAt: detail.created_at,
        updatedAt: detail.updated_at
      };
    } catch (error) {
      console.error('Error getting enquiry service details:', error);
      throw error;
    }
  }
}