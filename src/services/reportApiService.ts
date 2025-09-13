import { ApiResponse } from '@/types';
import { useState, useEffect, useCallback } from 'react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
    typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173'
        ? `${window.location.origin}/api`
        : 'http://localhost:3001/api'
);

// const API_BASE_URL='http://localhost:3001/api';


const X_TOKEN = import.meta.env.VITE_X_TOKEN || 'cobbler_super_secret_token_2024';

// Report Data Types - matching backend ReportModel
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

export interface ReportData {
    metrics: ReportMetrics;
    revenueChartData: MonthlyRevenueData[];
    serviceDistribution: ServiceDistributionData[];
    topCustomers: TopCustomerData[];
    profitLossData: ProfitLossData[];
}

export interface ReportExportData extends ReportData {
    expenseBreakdown: any[];
    period: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    generatedAt: string;
}

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

// HTTP Client for Report API calls
class ReportApiClient {
    private baseURL: string;
    private token: string;

    constructor(baseURL: string, token: string) {
        this.baseURL = baseURL;
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}/reports${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'X-Token': this.token,
                ...options.headers,
            },
            ...options,
        };

        try {
            console.log(`[ReportAPI] Making request to: ${url}`); // Frontend logging
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                console.error(`[ReportAPI] Request failed:`, errorMessage);
                throw new Error(errorMessage);
            }

            const result: ApiResponse<T> = await response.json();

            if (!result.success) {
                console.error(`[ReportAPI] API error:`, result.error);
                throw new Error(result.error || 'API request failed');
            }

            console.log(`[ReportAPI] Request successful for: ${endpoint}`);
            return result.data;
        } catch (error) {
            console.error(`[ReportAPI] Request failed for ${endpoint}:`, error);
            throw error instanceof Error ? error : new Error('Network request failed');
        }
    }

    // Get comprehensive report data for a period
    async getReportData(period: ReportPeriod = 'month'): Promise<ReportData> {
        return this.request<ReportData>(`/data?period=${period}`);
    }

    // Get only key business metrics
    async getMetrics(period: ReportPeriod = 'month'): Promise<ReportMetrics> {
        return this.request<ReportMetrics>(`/metrics?period=${period}`);
    }

    // Get revenue chart data
    async getRevenueChartData(period: ReportPeriod = 'month'): Promise<MonthlyRevenueData[]> {
        return this.request<MonthlyRevenueData[]>(`/revenue-chart?period=${period}`);
    }

    // Get data for PDF export
    async getExportData(period: ReportPeriod = 'month'): Promise<ReportExportData> {
        return this.request<ReportExportData>(`/export-data?period=${period}`);
    }

    // Get custom date range report
    async getCustomReport(startDate: string, endDate: string): Promise<ReportData> {
        return this.request<ReportData>(`/custom?startDate=${startDate}&endDate=${endDate}`);
    }
}

// Create API client instance
const reportApiClient = new ReportApiClient(API_BASE_URL, X_TOKEN);

// Report API Service
export const reportApiService = {
    // Get comprehensive report data
    getReportData: async (period: ReportPeriod = 'month'): Promise<ReportData> => {
        try {
            console.log(`[ReportService] Fetching report data for period: ${period}`);
            return await reportApiClient.getReportData(period);
        } catch (error) {
            console.error('[ReportService] Error fetching report data:', error);
            throw error;
        }
    },

    // Get metrics only
    getMetrics: async (period: ReportPeriod = 'month'): Promise<ReportMetrics> => {
        try {
            console.log(`[ReportService] Fetching metrics for period: ${period}`);
            return await reportApiClient.getMetrics(period);
        } catch (error) {
            console.error('[ReportService] Error fetching metrics:', error);
            throw error;
        }
    },

    // Get revenue chart data
    getRevenueChartData: async (period: ReportPeriod = 'month'): Promise<MonthlyRevenueData[]> => {
        try {
            console.log(`[ReportService] Fetching revenue chart data for period: ${period}`);
            return await reportApiClient.getRevenueChartData(period);
        } catch (error) {
            console.error('[ReportService] Error fetching revenue chart data:', error);
            throw error;
        }
    },

    // Get export data
    getExportData: async (period: ReportPeriod = 'month'): Promise<ReportExportData> => {
        try {
            console.log(`[ReportService] Fetching export data for period: ${period}`);
            return await reportApiClient.getExportData(period);
        } catch (error) {
            console.error('[ReportService] Error fetching export data:', error);
            throw error;
        }
    },

    // Get custom date range report
    getCustomReport: async (startDate: string, endDate: string): Promise<ReportData> => {
        try {
            console.log(`[ReportService] Fetching custom report from ${startDate} to ${endDate}`);
            return await reportApiClient.getCustomReport(startDate, endDate);
        } catch (error) {
            console.error('[ReportService] Error fetching custom report:', error);
            throw error;
        }
    },
};

// React Hook for Report Data Management
export function useReportData(initialPeriod: ReportPeriod = 'month') {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPeriod, setCurrentPeriod] = useState<ReportPeriod>(initialPeriod);

    const fetchReportData = useCallback(async (period: ReportPeriod) => {
        try {
            console.log(`[useReportData] Starting fetch for period: ${period}`);
            setLoading(true);
            setError(null);

            const data = await reportApiService.getReportData(period);
            setReportData(data);
            setCurrentPeriod(period);

            console.log(`[useReportData] Successfully fetched report data:`, data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report data';
            setError(errorMessage);
            console.error('[useReportData] Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshData = useCallback(() => {
        console.log(`[useReportData] Refreshing data for current period: ${currentPeriod}`);
        fetchReportData(currentPeriod);
    }, [currentPeriod, fetchReportData]);

    // Auto-fetch on mount and when period changes
    useEffect(() => {
        console.log(`[useReportData] Effect triggered for period: ${currentPeriod}`);
        fetchReportData(currentPeriod);
    }, [currentPeriod, fetchReportData]);

    return {
        reportData,
        loading,
        error,
        currentPeriod,
        fetchReportData,
        refreshData,
    };
}

export default reportApiService;