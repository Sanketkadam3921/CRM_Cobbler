import { Request, Response } from 'express';
import { BillingModel } from '../models/BillingModel';
import { logApi } from '../utils/logger';

export class BillingController {
  // Get billing statistics
  static async getBillingStats(req: Request, res: Response): Promise<void> {
    try {
      logApi.request('GET', '/api/billing/stats', req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const stats = await BillingModel.getBillingStats();
      
      logApi.response('GET', '/api/billing/stats', 200, Date.now());
      
      res.json({
        success: true,
        data: stats,
        message: 'Billing statistics retrieved successfully'
      });
    } catch (error) {
      logApi.error('GET', '/api/billing/stats', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get billing statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all billing stage enquiries
  static async getBillingEnquiries(req: Request, res: Response): Promise<void> {
    try {
      logApi.request('GET', '/api/billing/enquiries', req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const enquiries = await BillingModel.getBillingEnquiries();
      
      logApi.response('GET', '/api/billing/enquiries', 200, Date.now());
      
      res.json({
        success: true,
        data: enquiries,
        message: 'Billing enquiries retrieved successfully'
      });
    } catch (error) {
      logApi.error('GET', '/api/billing/enquiries', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get billing enquiries',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get specific billing enquiry
  static async getBillingEnquiry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiryId = parseInt(id);
      
      if (isNaN(enquiryId)) {
        logApi.error('GET', `/api/billing/enquiries/${id}`, new Error('Invalid enquiry ID provided'));
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }

      logApi.request('GET', `/api/billing/enquiries/${enquiryId}`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const enquiry = await BillingModel.getBillingEnquiry(enquiryId);
      
      if (!enquiry) {
        logApi.error('GET', `/api/billing/enquiries/${enquiryId}`, new Error('Billing enquiry not found'));
        res.status(404).json({
          success: false,
          error: 'Billing enquiry not found',
          message: `No billing enquiry found with ID ${enquiryId}`
        });
        return;
      }
      
      logApi.response('GET', `/api/billing/enquiries/${enquiryId}`, 200, Date.now());
      
      res.json({
        success: true,
        data: enquiry,
        message: 'Billing enquiry retrieved successfully'
      });
    } catch (error) {
      logApi.error('GET', `/api/billing/enquiries/${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to get billing enquiry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create/save billing details
  static async createBilling(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiryId = parseInt(id);
      
      if (isNaN(enquiryId)) {
        logApi.error('POST', `/api/billing/enquiries/${id}/billing`, new Error('Invalid enquiry ID provided'));
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }

      const billingData = req.body;
      
      logApi.request('POST', `/api/billing/enquiries/${enquiryId}/billing`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const billingDetails = await BillingModel.createBilling(enquiryId, billingData);
      
      logApi.response('POST', `/api/billing/enquiries/${enquiryId}/billing`, 200, Date.now());
      
      res.json({
        success: true,
        data: billingDetails,
        message: 'Billing details created successfully'
      });
    } catch (error) {
      logApi.error('POST', `/api/billing/enquiries/${req.params.id}/billing`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to create billing details',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get invoice data
  static async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiryId = parseInt(id);
      
      if (isNaN(enquiryId)) {
        logApi.error('GET', `/api/billing/enquiries/${id}/invoice`, new Error('Invalid enquiry ID provided'));
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }

      logApi.request('GET', `/api/billing/enquiries/${enquiryId}/invoice`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const invoiceData = await BillingModel.getInvoiceData(enquiryId);
      
      if (!invoiceData) {
        logApi.error('GET', `/api/billing/enquiries/${enquiryId}/invoice`, new Error('Invoice data not found'));
        res.status(404).json({
          success: false,
          error: 'Invoice data not found',
          message: `No invoice data found for enquiry ID ${enquiryId}`
        });
        return;
      }
      
      logApi.response('GET', `/api/billing/enquiries/${enquiryId}/invoice`, 200, Date.now());
      
      res.json({
        success: true,
        data: invoiceData,
        message: 'Invoice data retrieved successfully'
      });
    } catch (error) {
      logApi.error('GET', `/api/billing/enquiries/${req.params.id}/invoice`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to get invoice data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Move to delivery stage
  static async moveToDelivery(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiryId = parseInt(id);
      
      if (isNaN(enquiryId)) {
        logApi.error('PATCH', `/api/billing/enquiries/${id}/move-to-delivery`, new Error('Invalid enquiry ID provided'));
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }

      logApi.request('PATCH', `/api/billing/enquiries/${enquiryId}/move-to-delivery`, req.ip || 'unknown', req.get('User-Agent') || 'unknown');
      
      const updatedEnquiry = await BillingModel.moveToDelivery(enquiryId);
      
      logApi.response('PATCH', `/api/billing/enquiries/${enquiryId}/move-to-delivery`, 200, Date.now());
      
      res.json({
        success: true,
        data: updatedEnquiry,
        message: 'Enquiry moved to delivery stage successfully'
      });
    } catch (error) {
      logApi.error('PATCH', `/api/billing/enquiries/${req.params.id}/move-to-delivery`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to move enquiry to delivery stage',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}