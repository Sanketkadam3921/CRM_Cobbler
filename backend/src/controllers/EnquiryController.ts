import { Request, Response } from 'express';
import { EnquiryModel } from '../models/EnquiryModel';
import { logApi } from '../utils/logger';
import { Enquiry, ApiResponse, PaginatedResponse, WorkflowStage } from '../types';

export class EnquiryController {
  
  // GET /api/enquiries - Get all enquiries with pagination and filtering
  static async getAll(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { 
        page = 1, 
        limit = 50, 
        status, 
        currentStage, 
        search 
      } = req.query;
      
      const filters = {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        currentStage: currentStage as string,
        search: search as string
      };
      
      const result = await EnquiryModel.getAll(filters);
      
      const response: PaginatedResponse<Enquiry> = {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 200, duration);
      
      res.json({
        success: true,
        data: response
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve enquiries',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/enquiries/:id - Get enquiry by ID
  static async getById(req: Request, res: Response): Promise<void> {
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
      
      const enquiry = await EnquiryModel.getById(enquiryId);
      
      if (!enquiry) {
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
        data: enquiry
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/enquiries - Create new enquiry
  static async create(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const enquiryData = req.body;
      
      // Validate required fields
      const requiredFields = ['customerName', 'phone', 'address', 'message', 'inquiryType', 'product', 'quantity'];
      const missingFields = requiredFields.filter(field => !enquiryData[field]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: `Required fields missing: ${missingFields.join(', ')}`
        });
        return;
      }
      
      // Set default values
      const newEnquiry = {
        ...enquiryData,
        date: enquiryData.date || new Date().toISOString().split('T')[0],
        status: enquiryData.status || 'new',
        contacted: enquiryData.contacted || false,
        currentStage: enquiryData.currentStage || 'enquiry'
      };
      
      const createdEnquiry = await EnquiryModel.create(newEnquiry);
      
      const duration = Date.now() - startTime;
      logApi.response(req.method, req.url, 201, duration);
      
      res.status(201).json({
        success: true,
        data: createdEnquiry,
        message: 'Enquiry created successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to create enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/enquiries/:id - Update enquiry
  static async update(req: Request, res: Response): Promise<void> {
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
      
      const updates = req.body;
      const updatedEnquiry = await EnquiryModel.update(enquiryId, updates);
      
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
        message: 'Enquiry updated successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/enquiries/:id - Delete enquiry
  static async delete(req: Request, res: Response): Promise<void> {
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
      
      const deleted = await EnquiryModel.delete(enquiryId);
      
      if (!deleted) {
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
        message: 'Enquiry deleted successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/enquiries/stats - Get CRM statistics
  static async getStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const stats = await EnquiryModel.getStats();
      
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
        error: 'Failed to retrieve statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/enquiries/:id/contact - Mark enquiry as contacted
  static async markContacted(req: Request, res: Response): Promise<void> {
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
      
      const updatedEnquiry = await EnquiryModel.markContacted(enquiryId);
      
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
        message: 'Enquiry marked as contacted successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to mark enquiry as contacted',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/enquiries/:id/convert - Convert enquiry
  static async convert(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const { quotedAmount } = req.body;
      
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      if (!quotedAmount || isNaN(Number(quotedAmount)) || Number(quotedAmount) < 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quoted amount',
          message: 'Quoted amount must be a valid number greater than or equal to 0'
        });
        return;
      }
      
      const updatedEnquiry = await EnquiryModel.convert(enquiryId, Number(quotedAmount));
      
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
        message: 'Enquiry converted successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to convert enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PATCH /api/enquiries/:id/stage - Transition enquiry to next stage
  static async transitionStage(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { id } = req.params;
      const { stage } = req.body;
      
      const enquiryId = Number(id);
      
      if (isNaN(enquiryId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      if (!stage) {
        res.status(400).json({
          success: false,
          error: 'Missing stage',
          message: 'Stage is required'
        });
        return;
      }
      
      const validStages = ['enquiry', 'pickup', 'service', 'billing', 'delivery', 'completed'];
      if (!validStages.includes(stage)) {
        res.status(400).json({
          success: false,
          error: 'Invalid stage',
          message: `Stage must be one of: ${validStages.join(', ')}`
        });
        return;
      }
      
      const updatedEnquiry = await EnquiryModel.transitionStage(enquiryId, stage as WorkflowStage);
      
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
        message: 'Enquiry stage transitioned successfully'
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logApi.error(req.method, req.url, error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to transition enquiry stage',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/enquiries/stage/:stage - Get enquiries by stage
  static async getByStage(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const { stage } = req.params;
      
      const validStages = ['enquiry', 'pickup', 'service', 'billing', 'delivery', 'completed'];
      if (!validStages.includes(stage)) {
        res.status(400).json({
          success: false,
          error: 'Invalid stage',
          message: `Stage must be one of: ${validStages.join(', ')}`
        });
        return;
      }
      
      const enquiries = await EnquiryModel.getByStage(stage as WorkflowStage);
      
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
        error: 'Failed to retrieve enquiries by stage',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
