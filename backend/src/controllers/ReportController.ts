import { Request, Response } from 'express';
import { ReportModel, ReportFilters } from '../models/ReportModel';
import { logApi } from '../utils/logger';

export class ReportController {

    // GET /api/reports/data - Get comprehensive report data for a time period
    static async getReportData(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const { period = 'month' } = req.query;

            // Calculate date range based on period
            const now = new Date();
            let startDate: Date;
            let endDate: Date = now;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const filters: ReportFilters = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                period: period as 'week' | 'month' | 'quarter' | 'year'
            };

            logApi.request('Fetching report data with filters', '', '', JSON.stringify(filters));

            const reportData = await ReportModel.getReportData(filters);

            const duration = Date.now() - startTime;
            logApi.response(req.method, req.url, 200, duration);

            res.json({
                success: true,
                data: reportData,
                period: period,
                dateRange: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logApi.error(req.method, req.url, error);

            res.status(500).json({
                success: false,
                error: 'Failed to retrieve report data',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // GET /api/reports/metrics - Get key business metrics only
    static async getMetrics(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const { period = 'month' } = req.query;

            // Calculate date range based on period
            const now = new Date();
            let startDate: Date;
            let endDate: Date = now;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const filters: ReportFilters = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                period: period as 'week' | 'month' | 'quarter' | 'year'
            };

            const metrics = await ReportModel.getReportMetrics(filters);

            const duration = Date.now() - startTime;
            logApi.response(req.method, req.url, 200, duration);

            res.json({
                success: true,
                data: metrics,
                period: period,
                dateRange: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logApi.error(req.method, req.url, error);

            res.status(500).json({
                success: false,
                error: 'Failed to retrieve metrics',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // GET /api/reports/revenue-chart - Get revenue trend chart data
    static async getRevenueChartData(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const { period = 'month' } = req.query;

            // Calculate date range based on period
            const now = new Date();
            let startDate: Date;
            let endDate: Date = now;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const filters: ReportFilters = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                period: period as 'week' | 'month' | 'quarter' | 'year'
            };

            const chartData = await ReportModel.getRevenueChartData(filters);

            const duration = Date.now() - startTime;
            logApi.response(req.method, req.url, 200, duration);

            res.json({
                success: true,
                data: chartData,
                period: period,
                dateRange: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logApi.error(req.method, req.url, error);

            res.status(500).json({
                success: false,
                error: 'Failed to retrieve revenue chart data',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // GET /api/reports/export-data - Get data for PDF export
    static async getExportData(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const { period = 'month' } = req.query;

            // Calculate date range based on period
            const now = new Date();
            let startDate: Date;
            let endDate: Date = now;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const filters: ReportFilters = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                period: period as 'week' | 'month' | 'quarter' | 'year'
            };

            // Get comprehensive data for export
            const [reportData, expenseBreakdown] = await Promise.all([
                ReportModel.getReportData(filters),
                ReportModel.getExpenseBreakdown(filters)
            ]);

            const exportData = {
                ...reportData,
                expenseBreakdown,
                period,
                dateRange: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                },
                generatedAt: new Date().toISOString()
            };

            const duration = Date.now() - startTime;
            logApi.response(req.method, req.url, 200, duration);

            res.json({
                success: true,
                data: exportData
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logApi.error(req.method, req.url, error);

            res.status(500).json({
                success: false,
                error: 'Failed to retrieve export data',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // GET /api/reports/custom - Get report data for custom date range
    static async getCustomReport(req: Request, res: Response): Promise<void> {
        const startTime = Date.now();

        try {
            logApi.request(req.method, req.url, req.ip || 'unknown', req.get('User-Agent') || 'unknown');

            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                    message: 'Both startDate and endDate are required for custom reports'
                });
                return;
            }

            const filters: ReportFilters = {
                startDate: startDate as string,
                endDate: endDate as string,
                period: 'month' // Default period for custom range
            };

            const reportData = await ReportModel.getReportData(filters);

            const duration = Date.now() - startTime;
            logApi.response(req.method, req.url, 200, duration);

            res.json({
                success: true,
                data: reportData,
                dateRange: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                },
                isCustomRange: true
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logApi.error(req.method, req.url, error);

            res.status(500).json({
                success: false,
                error: 'Failed to retrieve custom report data',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}