import { Request, Response } from 'express';
import { DeliveryModel } from '../models/DeliveryModel';
import { ApiResponse, DeliveryStats, DeliveryEnquiry } from '../types';

// Create delivery logger following the pattern from other modules
const logDelivery = {
  info: (message: string, data?: any) => console.log(`📦 DELIVERY: ${message}`, data || ''),
  success: (message: string, data?: any) => console.log(`✅ DELIVERY: ${message}`, data || ''),
  error: (message: string, error?: any) => console.error(`❌ DELIVERY: ${message}`, error || ''),
  request: (method: string, endpoint: string, data?: any) => console.log(`🔄 DELIVERY REQUEST: ${method} ${endpoint}`, data || ''),
  response: (method: string, endpoint: string, success: boolean, data?: any) => console.log(`📤 DELIVERY RESPONSE: ${method} ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'}`, data || '')
};

export class DeliveryController {
  // GET /api/delivery/stats - Get delivery statistics
  static async getDeliveryStats(req: Request, res: Response): Promise<void> {
    try {
      logDelivery.request('GET', '/api/delivery/stats');
      logDelivery.info('Fetching delivery statistics...');
      
      const stats = await DeliveryModel.getDeliveryStats();
      
      const response: ApiResponse<DeliveryStats> = {
        success: true,
        data: stats,
        message: 'Delivery statistics fetched successfully'
      };
      
      logDelivery.success('Delivery statistics fetched successfully', stats);
      logDelivery.response('GET', '/api/delivery/stats', true, stats);
      
      res.json(response);
    } catch (error) {
      logDelivery.error('Failed to fetch delivery statistics', error);
      logDelivery.response('GET', '/api/delivery/stats', false, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      const response: ApiResponse<DeliveryStats> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch delivery statistics',
        message: 'Failed to fetch delivery statistics'
      };
      
      res.status(500).json(response);
    }
  }

  // GET /api/delivery/enquiries - Get all delivery stage enquiries
  static async getDeliveryEnquiries(req: Request, res: Response): Promise<void> {
    try {
      logDelivery.request('GET', '/api/delivery/enquiries', { query: req.query });
      logDelivery.info('Fetching delivery enquiries...');
      
      const enquiries = await DeliveryModel.getDeliveryEnquiries();
      
      const response: ApiResponse<DeliveryEnquiry[]> = {
        success: true,
        data: enquiries,
        message: `Fetched ${enquiries.length} delivery enquiries successfully`
      };
      
      logDelivery.success('Delivery enquiries fetched successfully', { count: enquiries.length });
      logDelivery.response('GET', '/api/delivery/enquiries', true, { count: enquiries.length });
      
      res.json(response);
    } catch (error) {
      logDelivery.error('Failed to fetch delivery enquiries', error);
      logDelivery.response('GET', '/api/delivery/enquiries', false, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      const response: ApiResponse<DeliveryEnquiry[]> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch delivery enquiries',
        message: 'Failed to fetch delivery enquiries'
      };
      
      res.status(500).json(response);
    }
  }

  // GET /api/delivery/enquiries/:id - Get specific delivery enquiry
  static async getDeliveryEnquiry(req: Request, res: Response): Promise<void> {
    try {
      const enquiryId = parseInt(req.params.id);
      
      if (isNaN(enquiryId)) {
        logDelivery.error('Invalid enquiry ID provided', { id: req.params.id });
        const response: ApiResponse<DeliveryEnquiry> = {
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        };
        res.status(400).json(response);
        return;
      }
      
      logDelivery.request('GET', `/api/delivery/enquiries/${enquiryId}`);
      logDelivery.info('Fetching delivery enquiry by ID', { enquiryId });
      
      const enquiry = await DeliveryModel.getDeliveryEnquiry(enquiryId);
      
      if (!enquiry) {
        logDelivery.error('Delivery enquiry not found', { enquiryId });
        logDelivery.response('GET', `/api/delivery/enquiries/${enquiryId}`, false, 'Not found');
        
        const response: ApiResponse<DeliveryEnquiry> = {
          success: false,
          error: 'Delivery enquiry not found',
          message: 'The requested delivery enquiry does not exist'
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse<DeliveryEnquiry> = {
        success: true,
        data: enquiry,
        message: 'Delivery enquiry fetched successfully'
      };
      
      logDelivery.success('Delivery enquiry fetched successfully', { enquiryId });
      logDelivery.response('GET', `/api/delivery/enquiries/${enquiryId}`, true, { enquiryId });
      
      res.json(response);
    } catch (error) {
      logDelivery.error('Failed to fetch delivery enquiry', error);
      logDelivery.response('GET', `/api/delivery/enquiries/${req.params.id}`, false, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      const response: ApiResponse<DeliveryEnquiry> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch delivery enquiry',
        message: 'Failed to fetch delivery enquiry'
      };
      
      res.status(500).json(response);
    }
  }

  // PATCH /api/delivery/enquiries/:id/schedule - Schedule delivery
  static async scheduleDelivery(req: Request, res: Response): Promise<void> {
    try {
      const enquiryId = parseInt(req.params.id);
      const { deliveryMethod, scheduledTime } = req.body;
      
      if (isNaN(enquiryId)) {
        logDelivery.error('Invalid enquiry ID provided for scheduling', { id: req.params.id });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        };
        res.status(400).json(response);
        return;
      }
      
      if (!deliveryMethod || !scheduledTime) {
        logDelivery.error('Missing required fields for delivery scheduling', { deliveryMethod, scheduledTime });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Missing required fields',
          message: 'deliveryMethod and scheduledTime are required'
        };
        res.status(400).json(response);
        return;
      }
      
      if (!['customer-pickup', 'home-delivery'].includes(deliveryMethod)) {
        logDelivery.error('Invalid delivery method', { deliveryMethod });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Invalid delivery method',
          message: 'deliveryMethod must be either customer-pickup or home-delivery'
        };
        res.status(400).json(response);
        return;
      }
      
      logDelivery.request('PATCH', `/api/delivery/enquiries/${enquiryId}/schedule`, { deliveryMethod, scheduledTime });
      logDelivery.info('Scheduling delivery for enquiry', { enquiryId, deliveryMethod, scheduledTime });
      
      await DeliveryModel.scheduleDelivery(enquiryId, deliveryMethod, scheduledTime);
      
      const response: ApiResponse<any> = {
        success: true,
        data: { enquiryId, deliveryMethod, scheduledTime },
        message: 'Delivery scheduled successfully'
      };
      
      logDelivery.success('Delivery scheduled successfully', { enquiryId, deliveryMethod, scheduledTime });
      logDelivery.response('PATCH', `/api/delivery/enquiries/${enquiryId}/schedule`, true, { enquiryId });
      
      res.json(response);
    } catch (error) {
      logDelivery.error('Failed to schedule delivery', error);
      logDelivery.response('PATCH', `/api/delivery/enquiries/${req.params.id}/schedule`, false, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      const response: ApiResponse<any> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule delivery',
        message: 'Failed to schedule delivery'
      };
      
      res.status(500).json(response);
    }
  }

  // PATCH /api/delivery/enquiries/:id/out-for-delivery - Mark as out for delivery
  static async markOutForDelivery(req: Request, res: Response): Promise<void> {
    try {
      const enquiryId = parseInt(req.params.id);
      const { assignedTo } = req.body;
      
      if (isNaN(enquiryId)) {
        logDelivery.error('Invalid enquiry ID provided for out-for-delivery', { id: req.params.id });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        };
        res.status(400).json(response);
        return;
      }
      
      if (!assignedTo) {
        logDelivery.error('Missing assignedTo field for out-for-delivery', { assignedTo });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Missing required field',
          message: 'assignedTo is required'
        };
        res.status(400).json(response);
        return;
      }
      
      logDelivery.request('PATCH', `/api/delivery/enquiries/${enquiryId}/out-for-delivery`, { assignedTo });
      logDelivery.info('Marking delivery as out-for-delivery', { enquiryId, assignedTo });
      
      await DeliveryModel.markOutForDelivery(enquiryId, assignedTo);
      
      const response: ApiResponse<any> = {
        success: true,
        data: { enquiryId, assignedTo },
        message: 'Marked as out for delivery successfully'
      };
      
      logDelivery.success('Marked as out for delivery successfully', { enquiryId, assignedTo });
      logDelivery.response('PATCH', `/api/delivery/enquiries/${enquiryId}/out-for-delivery`, true, { enquiryId });
      
      res.json(response);
    } catch (error) {
      logDelivery.error('Failed to mark as out for delivery', error);
      logDelivery.response('PATCH', `/api/delivery/enquiries/${req.params.id}/out-for-delivery`, false, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      const response: ApiResponse<any> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark as out for delivery',
        message: 'Failed to mark as out for delivery'
      };
      
      res.status(500).json(response);
    }
  }

  // PATCH /api/delivery/enquiries/:id/complete - Complete delivery
  static async completeDelivery(req: Request, res: Response): Promise<void> {
    try {
      const enquiryId = parseInt(req.params.id);
      const { deliveryProofPhoto, customerSignature, deliveryNotes } = req.body;
      
      if (isNaN(enquiryId)) {
        logDelivery.error('Invalid enquiry ID provided for completion', { id: req.params.id });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        };
        res.status(400).json(response);
        return;
      }
      
      if (!deliveryProofPhoto) {
        logDelivery.error('Missing delivery proof photo for completion', { deliveryProofPhoto });
        const response: ApiResponse<any> = {
          success: false,
          error: 'Missing required field',
          message: 'deliveryProofPhoto is required'
        };
        res.status(400).json(response);
        return;
      }
      
      logDelivery.request('PATCH', `/api/delivery/enquiries/${enquiryId}/complete`, {
        hasProofPhoto: !!deliveryProofPhoto,
        hasSignature: !!customerSignature,
        hasNotes: !!deliveryNotes
      });
      logDelivery.info('Completing delivery for enquiry', { 
        enquiryId, 
        hasProofPhoto: !!deliveryProofPhoto, 
        hasSignature: !!customerSignature,
        hasNotes: !!deliveryNotes 
      });
      
      await DeliveryModel.completeDelivery(enquiryId, deliveryProofPhoto, customerSignature, deliveryNotes);
      
      const response: ApiResponse<any> = {
        success: true,
        data: { enquiryId },
        message: 'Delivery completed successfully'
      };
      
      logDelivery.success('Delivery completed successfully', { enquiryId });
      logDelivery.response('PATCH', `/api/delivery/enquiries/${enquiryId}/complete`, true, { enquiryId });
      
      res.json(response);
    } catch (error) {
      logDelivery.error('Failed to complete delivery', error);
      logDelivery.response('PATCH', `/api/delivery/enquiries/${req.params.id}/complete`, false, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      const response: ApiResponse<any> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete delivery',
        message: 'Failed to complete delivery'
      };
      
      res.status(500).json(response);
    }
  }
}