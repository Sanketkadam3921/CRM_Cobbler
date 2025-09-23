import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { CalendarDays, TrendingUp, Wallet, Package, Download, FileText, BarChart3, TrendingDown } from "lucide-react";
// REMOVED: import { enquiriesStorage, expensesStorage } from "@/utils/localStorage";
// REASON: Replacing localStorage usage with backend API calls
// REMOVED: import { Enquiry, Expense } from "@/types";
// REASON: Using API service types instead
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UserOptions } from "jspdf-autotable";
import { toast } from "sonner";
// ADDED: Backend API service integration
// REASON: Replacing localStorage with proper backend APIs
import {
  reportApiService,
  useReportData,
  ReportPeriod,
  ReportData,
  ReportMetrics,
  MonthlyRevenueData,
  ServiceDistributionData,
  TopCustomerData,
  ProfitLossData
} from "@/services/reportApiService";
import NotoSans from "../../../public/NotoSans-Black.ttf"; // <-- correct import
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
  lastAutoTable: { finalY: number };
}

// ADDED: Date formatting utility function for consistent DD-MM-YYYY HH:MM format
// REASON: Ensure consistent date formatting across all PDF exports matching other modules
const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

// ADDED: Number formatting utility function for PDF exports
// REASON: Fix PDF number formatting issues (removes formatting characters like ¹ and replaces with ₹)
const formatNumberForPDF = (num: number | string): string => {
  // Convert to string and handle special characters
  let numStr = num.toString();

  // Replace ¹, ², ³, etc. with empty string and clean the number
  let cleanNum = numStr.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '').replace(/[^\d.]/g, '');

  // Convert to number to ensure proper formatting
  const numericValue = parseFloat(cleanNum);

  if (isNaN(numericValue)) return '0.00';

  // Format with 2 decimal places
  const fixedDecimal = numericValue.toFixed(2);

  // Add commas for thousands separator
  const parts = fixedDecimal.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${integerPart}.${parts[1]}`;
};

// Main Component
export default function ReportsModule() {
  console.log('[ReportsModule] Component initializing');

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("month");

  // REMOVED: Local dashboard data state management
  // REASON: Replaced with backend API data fetching via useReportData hook
  // const [dashboardData, setDashboardData] = useState<{
  //   billedEnquiries: Enquiry[];
  //   expenses: Expense[];
  // }>({
  //   billedEnquiries: [],
  //   expenses: [],
  // });

  // ADDED: Backend API integration via custom hook
  // REASON: Replacing localStorage with proper backend data fetching
  const {
    reportData,
    loading,
    error,
    currentPeriod,
    fetchReportData,
    refreshData
  } = useReportData(selectedPeriod);

  // REMOVED: localStorage data loading and refresh interval
  // REASON: Replaced with backend API data fetching
  // useEffect(() => {
  //   const loadData = () => {
  //     const allEnquiries = enquiriesStorage.getAll();
  //     const billedEnquiries = allEnquiries.filter(e => e.serviceDetails?.billingDetails);
  //     const expenses = expensesStorage.getAll();
  //     setDashboardData({ billedEnquiries, expenses });
  //   };
  //   loadData();
  //   const interval = setInterval(loadData, 500000); // Refresh every 5 seconds
  //   return () => clearInterval(interval);
  // }, []);

  // ADDED: Period change handler with API integration
  // REASON: When user changes period, fetch new data from backend
  useEffect(() => {
    console.log('[ReportsModule] Period changed to:', selectedPeriod);
    if (selectedPeriod !== currentPeriod) {
      fetchReportData(selectedPeriod);
    }
  }, [selectedPeriod, currentPeriod, fetchReportData]);

  // REMOVED: Local data filtering logic
  // REASON: Backend now handles filtering by date range
  // const getFilteredData = () => {
  //   const now = new Date();
  //   const { billedEnquiries, expenses } = dashboardData;
  //   
  //   let startDate;
  //   switch (selectedPeriod) {
  //     case 'week':
  //       startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  //       break;
  //     case 'month':
  //       startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  //       break;
  //     case 'quarter':
  //       startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  //       break;
  //     case 'year':
  //       startDate = new Date(now.getFullYear(), 0, 1);
  //       break;
  //     default:
  //       startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  //   }
  //   const filteredEnquiries = billedEnquiries.filter(enquiry => 
  //     new Date(enquiry.serviceDetails!.billingDetails!.invoiceDate) >= startDate
  //   );
  //   const filteredExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
  //   
  //   return { billedEnquiries: filteredEnquiries, expenses: filteredExpenses };
  // };
  // const { billedEnquiries: filteredBilledEnquiries, expenses: filteredExpenses } = getFilteredData();

  // REMOVED: Local metrics calculation
  // REASON: Backend now calculates and returns metrics
  // const calculateMetrics = () => {
  //   const totalRevenue = filteredBilledEnquiries.reduce((sum, enquiry) => sum + enquiry.serviceDetails!.billingDetails!.totalAmount, 0);
  //   const totalOrders = filteredBilledEnquiries.length;
  //   const activeCustomers = [...new Set(filteredBilledEnquiries.map(e => e.customerName))].length;
  //   const totalExpenditure = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  //   const netProfit = totalRevenue - totalExpenditure;
  //   return { totalRevenue, totalOrders, activeCustomers, totalExpenditure, netProfit };
  // };

  // REMOVED: Local chart data preparation functions
  // REASON: Backend now prepares and returns chart-ready data
  // const getRevenueChartData = () => { ... }
  // const getServiceDistribution = () => { ... }
  // const getTopCustomers = () => { ... }
  // const getProfitLossChartData = () => { ... }

  // ADDED: Use data from backend API
  // REASON: All metrics and chart data now comes from backend
  const metrics: ReportMetrics = reportData?.metrics || {
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    totalExpenditure: 0,
    netProfit: 0
  };

  const revenueChartData: MonthlyRevenueData[] = reportData?.revenueChartData || [];
  const serviceDistribution: ServiceDistributionData[] = reportData?.serviceDistribution || [];
  const topCustomers: TopCustomerData[] = reportData?.topCustomers || [];
  const profitLossData: ProfitLossData[] = reportData?.profitLossData || [];

  // ADDED: Enhanced export function with backend data
  // REASON: Using backend API to get comprehensive export data instead of localStorage
  const exportReport = async () => {
    console.log('[ReportsModule] Export report initiated for period:', selectedPeriod);

    try {
      // ADDED: Fetch comprehensive export data from backend
      // REASON: Need all data including expense breakdown for PDF export
      const exportData = await reportApiService.getExportData(selectedPeriod);

      const doc = new jsPDF() as jsPDFWithAutoTable;
      const tableHeaderColor: [number, number, number] = [22, 160, 133];


      // Title
      doc.setFontSize(20);
      doc.text("Business Report", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(150);
      // Make text bold
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40);

      doc.text(`Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`, 14, 28);
      doc.text(`Generated on: ${formatDate(new Date())}`, 14, 33);

      // Reset to normal after
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);


      // Key Metrics Section - using backend data
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Key Metrics", 14, 45);
      const metricsData = [
        ["Total Revenue", `₹${formatNumberForPDF(exportData.metrics.totalRevenue)}`],
        ["Total Expenditure", `₹${formatNumberForPDF(exportData.metrics.totalExpenditure)}`],
        ["Net Profit", `₹${formatNumberForPDF(exportData.metrics.netProfit)}`],
        ["Total Orders", exportData.metrics.totalOrders.toString()],
        ["Active Customers", exportData.metrics.activeCustomers.toString()],
      ];
      autoTable(doc, {
        body: metricsData,
        startY: 48,
        theme: 'grid',
        headStyles: { fillColor: tableHeaderColor },
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });
      const firstTableEnd = doc.lastAutoTable.finalY;

      // Top Customers - using backend data
      if (exportData.topCustomers.length > 0) {
        doc.setFontSize(14);
        doc.text("Top 5 Customers", 14, firstTableEnd + 15);
        autoTable(doc, {
          head: [['Rank', 'Customer Name', 'Orders', 'Revenue']],
          body: exportData.topCustomers.map((c, i) => [i + 1, c.name, c.orders, `₹${formatNumberForPDF(c.revenue)}`]),
          startY: firstTableEnd + 18,
          headStyles: { fillColor: tableHeaderColor },
          styles: { fontSize: 10, cellPadding: 2 },
        });
      }

      // Expenses Breakdown - using backend data
      if (exportData.expenseBreakdown.length > 0) {
        const expenseTableEnd = doc.lastAutoTable.finalY || firstTableEnd;
        doc.setFontSize(14);
        doc.text("Expenses Breakdown", 14, expenseTableEnd + 15);
        autoTable(doc, {
          head: [['Date', 'Category', 'Amount', 'Description']],
          body: exportData.expenseBreakdown.map(e => [
            formatDate(e.date),
            e.category,
            `₹${formatNumberForPDF(e.amount)}`,
            e.description || e.title
          ]),
          startY: expenseTableEnd + 18,
          headStyles: { fillColor: tableHeaderColor },
          styles: { fontSize: 9, cellPadding: 2 },
        });
      }

      // Save the PDF
      doc.save(`Cobbler_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report successfully exported as PDF!");
      console.log('[ReportsModule] PDF export completed successfully');

    } catch (error) {
      console.error("[ReportsModule] Failed to export PDF:", error);
      toast.error("Could not export PDF. Please check the console for errors.");
    }
  };

  // ADDED: Loading and error states for better UX
  // REASON: Backend API calls can have loading/error states that need to be handled
  if (loading) {
    console.log('[ReportsModule] Showing loading state');
    return (
      <div className="space-y-6 animate-fade-in p-4 sm:p-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading report data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[ReportsModule] Showing error state:', error);
    return (
      <div className="space-y-6 animate-fade-in p-4 sm:p-6 bg-background min-h-screen">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-500 text-lg">Error loading report data</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={refreshData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  console.log('[ReportsModule] Rendering with data:', {
    metrics,
    chartDataLength: revenueChartData.length,
    selectedPeriod
  });

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base">View detailed business reports and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedPeriod}
            onValueChange={(value: ReportPeriod) => {
              console.log('[ReportsModule] Period selection changed to:', value);
              setSelectedPeriod(value);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">₹{metrics.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">{metrics.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">₹{metrics.totalExpenditure.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-muted-foreground">Total Expenditure</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{metrics.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Net Profit</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend ({selectedPeriod})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Service Distribution ({selectedPeriod})</h3>
          {serviceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value" nameKey="name">
                  {serviceDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-muted-foreground">No service data for this period.</div>}
        </Card>

        <Card className="p-6 bg-card border shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Profit & Loss Trend ({selectedPeriod})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitLossData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Customers ({selectedPeriod})</h3>
          <div className="space-y-4">
            {topCustomers.length > 0 ? topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">{index + 1}</div>
                  <div>
                    <div className="font-medium text-foreground">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.orders} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">₹{customer.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-sm text-muted-foreground">revenue</div>
                </div>
              </div>
            )) : <div className="text-center text-muted-foreground">No customer data for this period.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}