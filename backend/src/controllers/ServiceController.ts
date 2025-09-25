import { Request, Response } from 'express';
import { ServiceModel } from '../models/ServiceModel';
import {
  ServiceAssignmentRequest,
  ServiceStartRequest,
  ServiceCompleteRequest,
  FinalPhotoRequest,
  WorkflowCompleteRequest
} from '../types';

export class ServiceController {

  // Get all service stage enquiries
  static async getServiceEnquiries(req: Request, res: Response): Promise<void> {
    try {
      const serviceEnquiries = await ServiceModel.getServiceEnquiries();

      res.status(200).json({
        success: true,
        data: serviceEnquiries,
        message: 'Service enquiries retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting service enquiries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve service enquiries',
        message: 'Internal server error'
      });
    }
  }

  // Get service statistics
  static async getServiceStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ServiceModel.getServiceStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Service statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting service stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve service statistics',
        message: 'Internal server error'
      });
    }
  }

  // Get specific enquiry service details
  static async getEnquiryServiceDetails(req: Request, res: Response): Promise<void> {
    try {
      const { enquiryId } = req.params;
      const id = parseInt(enquiryId);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }

      const serviceDetails = await ServiceModel.getEnquiryServiceDetails(id);

      if (!serviceDetails) {
        res.status(404).json({
          success: false,
          error: 'Service details not found',
          message: 'No service details found for this enquiry'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: serviceDetails,
        message: 'Service details retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting enquiry service details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve service details',
        message: 'Internal server error'
      });
    }
  }

  // Assign services to an enquiry
  static async assignServices(req: Request, res: Response): Promise<void> {
    try {
      const { enquiryId, serviceTypes, product, itemIndex }: ServiceAssignmentRequest = req.body;

      if (!enquiryId || !serviceTypes || !Array.isArray(serviceTypes) || serviceTypes.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          message: 'Enquiry ID and service types array are required'
        });
        return;
      }

      await ServiceModel.assignServices(enquiryId, serviceTypes, product as any, itemIndex as any);

      res.status(200).json({
        success: true,
        message: 'Services assigned successfully',
        data: { enquiryId, serviceTypes, product: product || null, itemIndex: itemIndex || null }
      });
    } catch (error) {
      console.error('Error assigning services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign services',
        message: 'Internal server error'
      });
    }
  }

  // Start a service
  static async startService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceTypeId, beforePhoto, notes }: ServiceStartRequest = req.body;

      if (!serviceTypeId || !beforePhoto) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          message: 'Service type ID and before photo are required'
        });
        return;
      }

      await ServiceModel.startService(serviceTypeId, beforePhoto, notes);

      res.status(200).json({
        success: true,
        message: 'Service started successfully',
        data: { serviceTypeId, status: 'in-progress' }
      });
    } catch (error) {
      console.error('Error starting service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start service',
        message: 'Internal server error'
      });
    }
  }

  // Complete a service
  static async completeService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceTypeId, afterPhoto, notes }: ServiceCompleteRequest = req.body;

      if (!serviceTypeId || !afterPhoto) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          message: 'Service type ID and after photo are required'
        });
        return;
      }

      await ServiceModel.completeService(serviceTypeId, afterPhoto, notes);

      res.status(200).json({
        success: true,
        message: 'Service completed successfully',
        data: { serviceTypeId, status: 'done' }
      });
    } catch (error) {
      console.error('Error completing service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete service',
        message: 'Internal server error'
      });
    }
  }

  // Save final overall photo
  static async saveFinalPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { enquiryId, afterPhoto, notes }: FinalPhotoRequest = req.body;

      if (!enquiryId || !afterPhoto) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          message: 'Enquiry ID and after photo are required'
        });
        return;
      }

      await ServiceModel.saveFinalPhoto(enquiryId, afterPhoto, notes);

      res.status(200).json({
        success: true,
        message: 'Final photo saved successfully',
        data: { enquiryId, photoSaved: true }
      });
    } catch (error) {
      console.error('Error saving final photo:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save final photo',
        message: 'Internal server error'
      });
    }
  }

  // Complete workflow and move to billing
  static async completeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { enquiryId, actualCost, workNotes }: WorkflowCompleteRequest = req.body;

      if (!enquiryId || actualCost === undefined) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          message: 'Enquiry ID and actual cost are required'
        });
        return;
      }

      await ServiceModel.completeWorkflow(enquiryId, actualCost, workNotes);

      res.status(200).json({
        success: true,
        message: 'Workflow completed successfully, moved to billing',
        data: { enquiryId, newStage: 'billing' }
      });
    } catch (error) {
      console.error('Error completing workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete workflow',
        message: 'Internal server error'
      });
    }
  }
}