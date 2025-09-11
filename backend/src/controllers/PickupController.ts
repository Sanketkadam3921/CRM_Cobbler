import { Request, Response } from 'express';
import { PickupModel } from '../models/PickupModel';
import { logApi } from '../utils/logger';
import { PickupStatus, WorkflowStage } from '../types';

export class PickupController {
  
  // GET /api/pickup/stats - Get pickup statistics
  static async getStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const stats = await PickupModel.getStats();
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pickup statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/pickup/enquiries - Get all pickup stage enquiries
  static async getPickupEnquiries(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { search } = req.query;
      const searchTerm = search as string;
      
      const enquiries = await PickupModel.getPickupEnquiries(searchTerm);
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: enquiries
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pickup enquiries',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/pickup/enquiries/:id - Get pickup enquiry by ID
  static async getPickupEnquiry(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      const enquiry = await PickupModel.getPickupEnquiry(enquiryId);
      
      if (!enquiry) {
        res.status(404).json({
          success: false,
          error: 'Pickup enquiry not found',
          message: `Pickup enquiry with ID ${enquiryId} not found`
        });
        return;
      }
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: enquiry
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pickup enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/pickup/enquiries/:id/assign - Assign pickup to staff member
  static async assignPickup(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const { assignedTo } = req.body;
      
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      if (!assignedTo) {
        res.status(400).json({
          success: false,
          error: 'Missing assignedTo',
          message: 'Staff member assignment is required'
        });
        return;
      }
      
      const updatedEnquiry = await PickupModel.assignPickup(enquiryId, assignedTo);
      
      if (!updatedEnquiry) {
        res.status(404).json({
          success: false,
          error: 'Enquiry not found',
          message: `Enquiry with ID ${enquiryId} not found`
        });
        return;
      }
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: updatedEnquiry,
        message: 'Pickup assigned successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to assign pickup',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/pickup/enquiries/:id/collect - Mark pickup as collected
  static async markCollected(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const { collectionPhoto, notes } = req.body;
      
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      if (!collectionPhoto) {
        res.status(400).json({
          success: false,
          error: 'Missing collection photo',
          message: 'Collection proof photo is required'
        });
        return;
      }
      
      const updatedEnquiry = await PickupModel.markCollected(enquiryId, collectionPhoto, notes);
      
      if (!updatedEnquiry) {
        res.status(404).json({
          success: false,
          error: 'Enquiry not found',
          message: `Enquiry with ID ${enquiryId} not found`
        });
        return;
      }
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: updatedEnquiry,
        message: 'Pickup marked as collected successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to mark pickup as collected',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/pickup/enquiries/:id/receive - Mark item as received and move to service
  static async markReceived(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const { receivedPhoto, notes, estimatedCost } = req.body;
      
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      if (!receivedPhoto) {
        res.status(400).json({
          success: false,
          error: 'Missing received photo',
          message: 'Received condition photo is required'
        });
        return;
      }
      
      const updatedEnquiry = await PickupModel.markReceived(enquiryId, receivedPhoto, notes, estimatedCost);
      
      if (!updatedEnquiry) {
        res.status(404).json({
          success: false,
          error: 'Enquiry not found',
          message: `Enquiry with ID ${enquiryId} not found`
        });
        return;
      }
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: updatedEnquiry,
        message: 'Item received and moved to service successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to mark item as received',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/pickup/enquiries/:id/status - Update pickup status
  static async updateStatus(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const { status, additionalData } = req.body;
      
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Missing status',
          message: 'Pickup status is required'
        });
        return;
      }
      
      const validStatuses = ['scheduled', 'assigned', 'collected', 'received'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }
      
      const updatedEnquiry = await PickupModel.updateStatus(enquiryId, status as PickupStatus, additionalData);
      
      if (!updatedEnquiry) {
        res.status(404).json({
          success: false,
          error: 'Enquiry not found',
          message: `Enquiry with ID ${enquiryId} not found`
        });
        return;
      }
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: updatedEnquiry,
        message: 'Pickup status updated successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update pickup status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}