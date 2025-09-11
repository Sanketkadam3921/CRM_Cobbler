// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
// import { CalendarDays, TrendingUp, DollarSign, Package, Users, Download, FileText, BarChart3 } from "lucide-react";

// const monthlyRevenue = [
//   { month: "Jan", revenue: 15000, orders: 45 },
//   { month: "Feb", revenue: 18000, orders: 52 },
//   { month: "Mar", revenue: 22000, orders: 68 },
//   { month: "Apr", revenue: 19000, orders: 58 },
//   { month: "May", revenue: 25000, orders: 75 },
//   { month: "Jun", revenue: 28000, orders: 82 },
// ];

// const serviceTypes = [
//   { name: "Shoe Repair", value: 45, color: "hsl(var(--primary))" },
//   { name: "Bag Repair", value: 30, color: "hsl(var(--secondary))" },
//   { name: "Cleaning", value: 15, color: "hsl(var(--accent))" },
//   { name: "Polish", value: 10, color: "hsl(var(--muted))" },
// ];

// const topCustomers = [
//   { name: "Rajesh Kumar", orders: 12, revenue: 4500 },
//   { name: "Priya Sharma", orders: 8, revenue: 3200 },
//   { name: "Amit Patel", orders: 6, revenue: 2800 },
//   { name: "Sunita Devi", orders: 5, revenue: 2100 },
//   { name: "Manoj Singh", orders: 4, revenue: 1800 },
// ];

// const dailyStats = [
//   { day: "Mon", orders: 12, revenue: 3200 },
//   { day: "Tue", orders: 15, revenue: 4100 },
//   { day: "Wed", orders: 18, revenue: 4800 },
//   { day: "Thu", orders: 14, revenue: 3900 },
//   { day: "Fri", orders: 20, revenue: 5500 },
//   { day: "Sat", orders: 25, revenue: 6200 },
//   { day: "Sun", orders: 8, revenue: 2100 },
// ];

// export function ReportsModule() {
//   const [selectedPeriod, setSelectedPeriod] = useState("month");
//   const [selectedReport, setSelectedReport] = useState("overview");

//   const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
//   const totalOrders = monthlyRevenue.reduce((sum, item) => sum + item.orders, 0);
//   const avgOrderValue = totalRevenue / totalOrders;

//   return (
//     <div className="space-y-6 animate-fade-in">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
//           <p className="text-muted-foreground">View detailed business reports and analytics</p>
//         </div>
//         <div className="flex space-x-2">
//           <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
//             <SelectTrigger className="w-32">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="week">This Week</SelectItem>
//               <SelectItem value="month">This Month</SelectItem>
//               <SelectItem value="quarter">This Quarter</SelectItem>
//               <SelectItem value="year">This Year</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant="outline">
//             <Download className="h-4 w-4 mr-2" />
//             Export
//           </Button>
//         </div>
//       </div>

//       {/* Key Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</div>
//               <div className="text-sm text-muted-foreground">Total Revenue</div>
//               <div className="text-xs text-success flex items-center mt-1">
//                 <TrendingUp className="h-3 w-3 mr-1" />
//                 +12.5% from last month
//               </div>
//             </div>
//             <DollarSign className="h-8 w-8 text-primary" />
//           </div>
//         </Card>
//         <Card className="p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
//               <div className="text-sm text-muted-foreground">Total Orders</div>
//               <div className="text-xs text-success flex items-center mt-1">
//                 <TrendingUp className="h-3 w-3 mr-1" />
//                 +8.2% from last month
//               </div>
//             </div>
//             <Package className="h-8 w-8 text-primary" />
//           </div>
//         </Card>
//         <Card className="p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-2xl font-bold text-foreground">₹{Math.round(avgOrderValue)}</div>
//               <div className="text-sm text-muted-foreground">Avg Order Value</div>
//               <div className="text-xs text-success flex items-center mt-1">
//                 <TrendingUp className="h-3 w-3 mr-1" />
//                 +4.1% from last month
//               </div>
//             </div>
//             <BarChart3 className="h-8 w-8 text-primary" />
//           </div>
//         </Card>
//         <Card className="p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-2xl font-bold text-foreground">89</div>
//               <div className="text-sm text-muted-foreground">Active Customers</div>
//               <div className="text-xs text-success flex items-center mt-1">
//                 <TrendingUp className="h-3 w-3 mr-1" />
//                 +15.3% from last month
//               </div>
//             </div>
//             <Users className="h-8 w-8 text-primary" />
//           </div>
//         </Card>
//       </div>

//       {/* Report Type Selector */}
//       <Card className="p-4 bg-gradient-card border-0 shadow-soft">
//         <div className="flex space-x-2">
//           <Button 
//             variant={selectedReport === "overview" ? "default" : "outline"}
//             onClick={() => setSelectedReport("overview")}
//             className={selectedReport === "overview" ? "bg-gradient-primary hover:opacity-90" : ""}
//           >
//             Overview
//           </Button>
//           <Button 
//             variant={selectedReport === "revenue" ? "default" : "outline"}
//             onClick={() => setSelectedReport("revenue")}
//             className={selectedReport === "revenue" ? "bg-gradient-primary hover:opacity-90" : ""}
//           >
//             Revenue Analysis
//           </Button>
//           <Button 
//             variant={selectedReport === "customers" ? "default" : "outline"}
//             onClick={() => setSelectedReport("customers")}
//             className={selectedReport === "customers" ? "bg-gradient-primary hover:opacity-90" : ""}
//           >
//             Customer Reports
//           </Button>
//           <Button 
//             variant={selectedReport === "services" ? "default" : "outline"}
//             onClick={() => setSelectedReport("services")}
//             className={selectedReport === "services" ? "bg-gradient-primary hover:opacity-90" : ""}
//           >
//             Service Analysis
//           </Button>
//         </div>
//       </Card>

//       {/* Charts Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Monthly Revenue Chart */}
//         <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//           <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Revenue Trend</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={monthlyRevenue}>
//               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
//               <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
//               <YAxis stroke="hsl(var(--muted-foreground))" />
//               <Tooltip 
//                 contentStyle={{
//                   backgroundColor: "hsl(var(--card))",
//                   border: "1px solid hsl(var(--border))",
//                   borderRadius: "8px"
//                 }}
//               />
//               <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Service Types Distribution */}
//         <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//           <h3 className="text-lg font-semibold text-foreground mb-4">Service Types Distribution</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={serviceTypes}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={60}
//                 outerRadius={120}
//                 paddingAngle={5}
//                 dataKey="value"
//               >
//                 {serviceTypes.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip 
//                 contentStyle={{
//                   backgroundColor: "hsl(var(--card))",
//                   border: "1px solid hsl(var(--border))",
//                   borderRadius: "8px"
//                 }}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="flex flex-wrap gap-2 mt-4">
//             {serviceTypes.map((type, index) => (
//               <div key={index} className="flex items-center space-x-2">
//                 <div 
//                   className="w-3 h-3 rounded-full" 
//                   style={{ backgroundColor: type.color }}
//                 />
//                 <span className="text-sm text-muted-foreground">
//                   {type.name} ({type.value}%)
//                 </span>
//               </div>
//             ))}
//           </div>
//         </Card>

//         {/* Daily Performance */}
//         <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//           <h3 className="text-lg font-semibold text-foreground mb-4">Daily Performance</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={dailyStats}>
//               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
//               <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
//               <YAxis stroke="hsl(var(--muted-foreground))" />
//               <Tooltip 
//                 contentStyle={{
//                   backgroundColor: "hsl(var(--card))",
//                   border: "1px solid hsl(var(--border))",
//                   borderRadius: "8px"
//                 }}
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="orders" 
//                 stroke="hsl(var(--primary))" 
//                 strokeWidth={3}
//                 dot={{ fill: "hsl(var(--primary))" }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Top Customers */}
//         <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//           <h3 className="text-lg font-semibold text-foreground mb-4">Top Customers</h3>
//           <div className="space-y-4">
//             {topCustomers.map((customer, index) => (
//               <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
//                     {index + 1}
//                   </div>
//                   <div>
//                     <div className="font-medium text-foreground">{customer.name}</div>
//                     <div className="text-sm text-muted-foreground">{customer.orders} orders</div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="font-semibold text-foreground">₹{customer.revenue.toLocaleString()}</div>
//                   <div className="text-sm text-muted-foreground">revenue</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Card>
//       </div>

//       {/* Export Options */}
//       <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//         <h3 className="text-lg font-semibold text-foreground mb-4">Export Reports</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <Button variant="outline" className="justify-start">
//             <FileText className="h-4 w-4 mr-2" />
//             Revenue Report (PDF)
//           </Button>
//           <Button variant="outline" className="justify-start">
//             <FileText className="h-4 w-4 mr-2" />
//             Customer List (Excel)
//           </Button>
//           <Button variant="outline" className="justify-start">
//             <FileText className="h-4 w-4 mr-2" />
//             Service Analytics (PDF)
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { CalendarDays, TrendingUp, Wallet, Package, Download, FileText, BarChart3, TrendingDown } from "lucide-react";
import { enquiriesStorage, expensesStorage } from "@/utils/localStorage";
import { Enquiry, Expense } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UserOptions } from "jspdf-autotable";
import { toast } from "sonner";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
  lastAutoTable: { finalY: number };
}

// Main Component
export default function ReportsModule() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [dashboardData, setDashboardData] = useState<{
    billedEnquiries: Enquiry[];
    expenses: Expense[];
  }>({
    billedEnquiries: [],
    expenses: [],
  });

  // Load data from localStorage on mount and set up a refresh interval
  useEffect(() => {
    const loadData = () => {
      const allEnquiries = enquiriesStorage.getAll();
      const billedEnquiries = allEnquiries.filter(e => e.serviceDetails?.billingDetails);
      const expenses = expensesStorage.getAll();
      setDashboardData({ billedEnquiries, expenses });
    };

    loadData();
    const interval = setInterval(loadData, 500000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter data based on the selected time period
  const getFilteredData = () => {
    const now = new Date();
    const { billedEnquiries, expenses } = dashboardData;
    
    let startDate;
    switch (selectedPeriod) {
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

    const filteredEnquiries = billedEnquiries.filter(enquiry => 
      new Date(enquiry.serviceDetails!.billingDetails!.invoiceDate) >= startDate
    );
    const filteredExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
    
    return { billedEnquiries: filteredEnquiries, expenses: filteredExpenses };
  };

  const { billedEnquiries: filteredBilledEnquiries, expenses: filteredExpenses } = getFilteredData();

  // Calculate key metrics
  const calculateMetrics = () => {
    const totalRevenue = filteredBilledEnquiries.reduce((sum, enquiry) => sum + enquiry.serviceDetails!.billingDetails!.totalAmount, 0);
    const totalOrders = filteredBilledEnquiries.length;
    const activeCustomers = [...new Set(filteredBilledEnquiries.map(e => e.customerName))].length;
    const totalExpenditure = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenditure;

    return { totalRevenue, totalOrders, activeCustomers, totalExpenditure, netProfit };
  };

  // Prepare data for the revenue trend chart
  const getRevenueChartData = () => {
    const monthlyData: { [key: string]: { month: string; revenue: number; orders: number } } = {};
    
    filteredBilledEnquiries.forEach(enquiry => {
      const date = new Date(enquiry.serviceDetails!.billingDetails!.invoiceDate);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, orders: 0 };
      }
      monthlyData[month].revenue += enquiry.serviceDetails!.billingDetails!.totalAmount;
      monthlyData[month].orders += 1;
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.values(monthlyData).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  };

  // Prepare data for the service distribution pie chart
  const getServiceDistribution = () => {
    const serviceCount: { [key: string]: number } = {};
    let totalServices = 0;

    filteredBilledEnquiries.forEach(enquiry => {
      enquiry.serviceDetails!.billingDetails!.items.forEach(item => {
        serviceCount[item.serviceType] = (serviceCount[item.serviceType] || 0) + 1;
        totalServices++;
      });
    });

    if (totalServices === 0) return [];

    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    return Object.entries(serviceCount).map(([name, count], index) => ({
      name,
      value: Math.round((count / totalServices) * 100),
      color: colors[index % colors.length]
    }));
  };

  // Get top 5 customers by revenue
  const getTopCustomers = () => {
    const customerStats: { [key: string]: { name: string; orders: number; revenue: number } } = {};

    filteredBilledEnquiries.forEach(enquiry => {
      const name = enquiry.customerName;
      if (!customerStats[name]) {
        customerStats[name] = { name, orders: 0, revenue: 0 };
      }
      customerStats[name].orders += 1;
      customerStats[name].revenue += enquiry.serviceDetails!.billingDetails!.totalAmount;
    });

    return Object.values(customerStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Get profit/loss data for line chart
  const getProfitLossChartData = () => {
    const data: { [key: string]: { date: string; revenue: number; expense: number } } = {};

    filteredBilledEnquiries.forEach(enquiry => {
      const dateStr = new Date(enquiry.serviceDetails!.billingDetails!.invoiceDate).toISOString().split('T')[0];
      if (!data[dateStr]) data[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
      data[dateStr].revenue += enquiry.serviceDetails!.billingDetails!.totalAmount;
    });

    filteredExpenses.forEach(exp => {
      const dateStr = new Date(exp.date).toISOString().split('T')[0];
      if (!data[dateStr]) data[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
      data[dateStr].expense += exp.amount;
    });

    return Object.values(data).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const metrics = calculateMetrics();
  const revenueChartData = getRevenueChartData();
  const serviceDistribution = getServiceDistribution();
  const topCustomers = getTopCustomers();
  const profitLossData = getProfitLossChartData();

  const exportReport = () => {
    try {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      const tableHeaderColor: [number, number, number] = [22, 160, 133]; // A nice teal color

      // Title
      doc.setFontSize(20);
      doc.text("Business Report", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`, 14, 28);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 33);

      // Key Metrics Section
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Key Metrics", 14, 45);
      const metricsData = [
        ["Total Revenue", `₹${metrics.totalRevenue.toLocaleString()}`],
        ["Total Expenditure", `₹${metrics.totalExpenditure.toLocaleString()}`],
        ["Net Profit", `₹${metrics.netProfit.toLocaleString()}`],
        ["Total Orders", metrics.totalOrders.toString()],
        ["Active Customers", metrics.activeCustomers.toString()],
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

      // Top Customers
      if (topCustomers.length > 0) {
        doc.setFontSize(14);
        doc.text("Top 5 Customers", 14, firstTableEnd + 15);
        autoTable(doc, {
          head: [['Rank', 'Customer Name', 'Orders', 'Revenue']],
          body: topCustomers.map((c, i) => [i + 1, c.name, c.orders, `₹${c.revenue.toLocaleString()}`]),
          startY: firstTableEnd + 18,
          headStyles: { fillColor: tableHeaderColor },
          styles: { fontSize: 10, cellPadding: 2 },
        });
      }

      // Expenses Breakdown
      if (filteredExpenses.length > 0) {
        const expenseTableEnd = doc.lastAutoTable.finalY || firstTableEnd;
        doc.setFontSize(14);
        doc.text("Expenses Breakdown", 14, expenseTableEnd + 15);
        autoTable(doc, {
          head: [['Date', 'Category', 'Amount']],
          body: filteredExpenses.map(e => [new Date(e.date).toLocaleDateString(), e.category, `₹${e.amount.toLocaleString()}`]),
          startY: expenseTableEnd + 18,
          headStyles: { fillColor: tableHeaderColor },
          styles: { fontSize: 9, cellPadding: 2 },
        });
      }

      // Save the PDF
      doc.save(`Cobbler_Report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report successfully exported as PDF!");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Could not export PDF. Please check the console for errors.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base">View detailed business reports and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
              <div className="text-2xl font-bold text-foreground">₹{metrics.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <Wallet className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">{metrics.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">₹{metrics.totalExpenditure.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Expenditure</div>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4 bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{metrics.netProfit.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Net Profit</div>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
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
                  <div className="font-semibold text-foreground">₹{customer.revenue.toLocaleString()}</div>
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