import { executeQuery } from '../config/database';
import { logDatabase } from '../utils/logger';

// Report-specific interfaces
export interface ReportMetrics {
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    totalExpenditure: number;
    netProfit: number;
}

export interface MonthlyRevenueData {
    month: string;
    revenue: number;
    orders: number;
}

export interface ServiceDistributionData {
    name: string;
    value: number; // percentage
    color: string;
}

export interface TopCustomerData {
    name: string;
    orders: number;
    revenue: number;
}

export interface ProfitLossData {
    date: string;
    revenue: number;
    expense: number;
}

export interface ReportFilters {
    startDate: string;
    endDate: string;
    period: 'week' | 'month' | 'quarter' | 'year';
}

export interface ReportData {
    metrics: ReportMetrics;
    revenueChartData: MonthlyRevenueData[];
    serviceDistribution: ServiceDistributionData[];
    topCustomers: TopCustomerData[];
    profitLossData: ProfitLossData[];
}

export class ReportModel {

    // Get comprehensive report data for a given time period
    static async getReportData(filters: ReportFilters): Promise<ReportData> {
        try {
            logDatabase.connection('Fetching comprehensive report data', filters);

            // Get all required data in parallel for better performance
            const [
                metrics,
                revenueChartData,
                serviceDistribution,
                topCustomers,
                profitLossData
            ] = await Promise.all([
                this.getReportMetrics(filters),
                this.getRevenueChartData(filters),
                this.getServiceDistribution(filters),
                this.getTopCustomers(filters),
                this.getProfitLossData(filters)
            ]);

            const reportData: ReportData = {
                metrics,
                revenueChartData,
                serviceDistribution,
                topCustomers,
                profitLossData
            };

            logDatabase.success('Comprehensive report data fetched successfully', {
                metricsCount: 1,
                revenueDataPoints: revenueChartData.length,
                serviceTypes: serviceDistribution.length,
                topCustomersCount: topCustomers.length,
                profitLossDataPoints: profitLossData.length
            });

            return reportData;

        } catch (error) {
            logDatabase.error('Failed to fetch comprehensive report data', error);
            throw error;
        }
    }

    // Get key business metrics for the time period
    static async getReportMetrics(filters: ReportFilters): Promise<ReportMetrics> {
        try {
            logDatabase.connection('Calculating report metrics', filters);

            // Get revenue data from billing_details table
            const revenueQuery = `
        SELECT 
          COUNT(DISTINCT bd.enquiry_id) as totalOrders,
          COUNT(DISTINCT e.customer_name) as activeCustomers,
          COALESCE(SUM(bd.total_amount), 0) as totalRevenue
        FROM billing_details bd
        JOIN enquiries e ON bd.enquiry_id = e.id
        WHERE bd.invoice_date >= ? AND bd.invoice_date <= ?
      `;

            const revenueResult = await executeQuery<any>(revenueQuery, [filters.startDate, filters.endDate]);
            const revenueData = revenueResult[0] || { totalOrders: 0, activeCustomers: 0, totalRevenue: 0 };

            // Get expenditure data from expenses table
            const expenseQuery = `
        SELECT COALESCE(SUM(amount), 0) as totalExpenditure
        FROM expenses
        WHERE date >= ? AND date <= ?
      `;

            const expenseResult = await executeQuery<any>(expenseQuery, [filters.startDate, filters.endDate]);
            const totalExpenditure = expenseResult[0]?.totalExpenditure || 0;

            const metrics: ReportMetrics = {
                totalRevenue: revenueData.totalRevenue,
                totalOrders: revenueData.totalOrders,
                activeCustomers: revenueData.activeCustomers,
                totalExpenditure: totalExpenditure,
                netProfit: revenueData.totalRevenue - totalExpenditure
            };

            logDatabase.success('Report metrics calculated successfully', metrics);

            return metrics;

        } catch (error) {
            logDatabase.error('Failed to calculate report metrics', error);
            throw error;
        }
    }

    // Get monthly revenue trend data
    static async getRevenueChartData(filters: ReportFilters): Promise<MonthlyRevenueData[]> {
        try {
            logDatabase.connection('Fetching revenue chart data', filters);

            const query = `
        SELECT 
          DATE_FORMAT(bd.invoice_date, '%b') as month,
          MONTH(bd.invoice_date) as monthNum,
          COALESCE(SUM(bd.total_amount), 0) as revenue,
          COUNT(bd.enquiry_id) as orders
        FROM billing_details bd
        WHERE bd.invoice_date >= ? AND bd.invoice_date <= ?
        GROUP BY YEAR(bd.invoice_date), MONTH(bd.invoice_date), DATE_FORMAT(bd.invoice_date, '%b')
        ORDER BY YEAR(bd.invoice_date), MONTH(bd.invoice_date)
      `;

            const result = await executeQuery<any>(query, [filters.startDate, filters.endDate]);

            const chartData: MonthlyRevenueData[] = result.map(row => ({
                month: row.month,
                revenue: row.revenue,
                orders: row.orders
            }));

            logDatabase.success('Revenue chart data fetched successfully', {
                dataPoints: chartData.length
            });

            return chartData;

        } catch (error) {
            logDatabase.error('Failed to fetch revenue chart data', error);
            throw error;
        }
    }

    // Get service type distribution data
    static async getServiceDistribution(filters: ReportFilters): Promise<ServiceDistributionData[]> {
        try {
            logDatabase.connection('Fetching service distribution data', filters);

            const query = `
        SELECT 
          bi.service_type,
          COUNT(*) as count
        FROM billing_items bi
        JOIN billing_details bd ON bi.billing_id = bd.id
        WHERE bd.invoice_date >= ? AND bd.invoice_date <= ?
        GROUP BY bi.service_type
        ORDER BY count DESC
      `;

            const result = await executeQuery<any>(query, [filters.startDate, filters.endDate]);

            const totalServices = result.reduce((sum: number, row: any) => sum + row.count, 0);
            const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

            const distributionData: ServiceDistributionData[] = result.map((row: any, index: number) => ({
                name: row.service_type,
                value: totalServices > 0 ? Math.round((row.count / totalServices) * 100) : 0,
                color: colors[index % colors.length]
            }));

            logDatabase.success('Service distribution data fetched successfully', {
                serviceTypes: distributionData.length,
                totalServices
            });

            return distributionData;

        } catch (error) {
            logDatabase.error('Failed to fetch service distribution data', error);
            throw error;
        }
    }

    // Get top 5 customers by revenue
    static async getTopCustomers(filters: ReportFilters): Promise<TopCustomerData[]> {
        try {
            logDatabase.connection('Fetching top customers data', filters);

            const query = `
        SELECT 
          e.customer_name as name,
          COUNT(bd.enquiry_id) as orders,
          COALESCE(SUM(bd.total_amount), 0) as revenue
        FROM billing_details bd
        JOIN enquiries e ON bd.enquiry_id = e.id
        WHERE bd.invoice_date >= ? AND bd.invoice_date <= ?
        GROUP BY e.customer_name
        ORDER BY revenue DESC
        LIMIT 5
      `;

            const result = await executeQuery<any>(query, [filters.startDate, filters.endDate]);

            const topCustomers: TopCustomerData[] = result.map(row => ({
                name: row.name,
                orders: row.orders,
                revenue: row.revenue
            }));

            logDatabase.success('Top customers data fetched successfully', {
                customersCount: topCustomers.length
            });

            return topCustomers;

        } catch (error) {
            logDatabase.error('Failed to fetch top customers data', error);
            throw error;
        }
    }

    // Get profit/loss trend data by day
    static async getProfitLossData(filters: ReportFilters): Promise<ProfitLossData[]> {
        try {
            logDatabase.connection('Fetching profit/loss trend data', filters);

            // Get revenue by date
            const revenueQuery = `
        SELECT 
          DATE(bd.invoice_date) as date,
          COALESCE(SUM(bd.total_amount), 0) as revenue
        FROM billing_details bd
        WHERE bd.invoice_date >= ? AND bd.invoice_date <= ?
        GROUP BY DATE(bd.invoice_date)
      `;

            // Get expenses by date
            const expenseQuery = `
        SELECT 
          DATE(date) as date,
          COALESCE(SUM(amount), 0) as expense
        FROM expenses
        WHERE date >= ? AND date <= ?
        GROUP BY DATE(date)
      `;

            const [revenueResult, expenseResult] = await Promise.all([
                executeQuery<any>(revenueQuery, [filters.startDate, filters.endDate]),
                executeQuery<any>(expenseQuery, [filters.startDate, filters.endDate])
            ]);

            // Merge revenue and expense data by date
            const dataMap: { [key: string]: ProfitLossData } = {};

            revenueResult.forEach(row => {
                const dateStr = new Date(row.date).toISOString().split('T')[0];
                dataMap[dateStr] = {
                    date: dateStr,
                    revenue: row.revenue,
                    expense: 0
                };
            });

            expenseResult.forEach(row => {
                const dateStr = new Date(row.date).toISOString().split('T')[0];
                if (dataMap[dateStr]) {
                    dataMap[dateStr].expense = row.expense;
                } else {
                    dataMap[dateStr] = {
                        date: dateStr,
                        revenue: 0,
                        expense: row.expense
                    };
                }
            });

            const profitLossData = Object.values(dataMap).sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            logDatabase.success('Profit/loss trend data fetched successfully', {
                dataPoints: profitLossData.length
            });

            return profitLossData;

        } catch (error) {
            logDatabase.error('Failed to fetch profit/loss trend data', error);
            throw error;
        }
    }

    // Get expense breakdown for PDF export
    static async getExpenseBreakdown(filters: ReportFilters): Promise<any[]> {
        try {
            logDatabase.connection('Fetching expense breakdown for export', filters);

            const query = `
        SELECT 
          date,
          category,
          amount,
          title,
          description
        FROM expenses
        WHERE date >= ? AND date <= ?
        ORDER BY date DESC, amount DESC
      `;

            const result = await executeQuery<any>(query, [filters.startDate, filters.endDate]);

            logDatabase.success('Expense breakdown fetched for export', {
                expenseCount: result.length
            });

            return result;

        } catch (error) {
            logDatabase.error('Failed to fetch expense breakdown for export', error);
            throw error;
        }
    }
}