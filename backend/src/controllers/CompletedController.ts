import { Request, Response } from 'express';
import { CompletedModel, CompletedEnquiry, CompletedStats } from '../models/CompletedModel';
import { logDatabase } from '../utils/logger';

export class CompletedController {
  // Get all completed enquiries
  static async getCompletedEnquiries(req: Request, res: Response): Promise<void> {
    try {
      logDatabase.query('CompletedController.getCompletedEnquiries - Starting request');
      
      const enquiries = await CompletedModel.getCompletedEnquiries();
      
      logDatabase.success('CompletedController.getCompletedEnquiries - Success', {
        count: enquiries.length,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: enquiries,
        message: `Successfully fetched ${enquiries.length} completed enquiries`
      });
    } catch (error) {
      logDatabase.error('CompletedController.getCompletedEnquiries - Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch completed enquiries',
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Get completed enquiries statistics
  static async getCompletedStats(req: Request, res: Response): Promise<void> {
    try {
      logDatabase.query('CompletedController.getCompletedStats - Starting request');
      
      const stats = await CompletedModel.getCompletedStats();
      
      logDatabase.success('CompletedController.getCompletedStats - Success', {
        stats,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: stats,
        message: 'Successfully fetched completed statistics'
      });
    } catch (error) {
      logDatabase.error('CompletedController.getCompletedStats - Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch completed statistics',
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Get specific completed enquiry by ID
  static async getCompletedEnquiryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const enquiryId = parseInt(id);
      
      if (isNaN(enquiryId)) {
        logDatabase.query('CompletedController.getCompletedEnquiryById - Invalid ID', { id });
        res.status(400).json({
          success: false,
          error: 'Invalid enquiry ID',
          message: 'Enquiry ID must be a valid number'
        });
        return;
      }
      
      logDatabase.query('CompletedController.getCompletedEnquiryById - Starting request', { enquiryId });
      
      const enquiry = await CompletedModel.getCompletedEnquiryById(enquiryId);
      
      if (!enquiry) {
        logDatabase.query('CompletedController.getCompletedEnquiryById - Not found', { enquiryId });
        res.status(404).json({
          success: false,
          error: 'Completed enquiry not found',
          message: `No completed enquiry found with ID ${enquiryId}`
        });
        return;
      }
      
      logDatabase.success('CompletedController.getCompletedEnquiryById - Success', {
        enquiryId,
        found: true,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        data: enquiry,
        message: 'Successfully fetched completed enquiry'
      });
    } catch (error) {
      logDatabase.error('CompletedController.getCompletedEnquiryById - Error', {
        enquiryId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch completed enquiry',
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}

export default CompletedController;