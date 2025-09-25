import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Calendar, Package, TrendingUp, ClipboardCheck, AlertTriangle, Truck, Clock, MapPin, RefreshCw } from "lucide-react";
import { useDashboardData, DashboardData } from "@/services/dashboardApiService";
import { useDeliveryEnquiries, DeliveryEnquiry } from "@/services/deliveryApiService";
import { usePickupEnquiries } from "@/services/pickupApiService"; // Import pickup enquiries hook
import { useServiceEnquiries } from "@/services/serviceApiService"; // Import service enquiries hook
import { useInventoryItems } from "@/services/inventoryApiService";
import { useEnquiriesWithPolling } from "@/services/enquiryApiService"; // Import enquiry hook for new date fields
import { AllEnquiriesView } from './AllEnquiriesView';
import { PendingPickupsView } from './PendingPickupsView';
import { InServiceView } from './InServiceView';
import { CompletedServicesView } from './CompletedServiceView';
import { useCompletedStats } from '@/services/completedApiService';

const defaultStats = [
  {
    name: "Total Enquiries",
    value: "0",
    changeType: "neutral" as const,
    icon: Users,
    redirectTo: "all-enquiries"
  },
  {
    name: "Pending Pickups",
    value: "0",
    changeType: "neutral" as const,
    icon: Calendar,
    redirectTo: "pending-pickups",
  },
  {
    name: "In Service",
    value: "0",
    changeType: "neutral" as const,
    icon: Package,
    redirectTo: "in-service",
  },
  {
    name: "Completed Services",
    value: "0/0",
    changeType: "neutral" as const,
    icon: ClipboardCheck,
    redirectTo: "service-completion",
  },
];

interface DashboardOverviewProps {
  onNavigate: (view: string, action?: string, id?: number) => void;
}

// Helper function to format date for display
const formatDeliveryDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatWithSlash = (d: Date) =>
    d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // keep AM/PM
    });

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else {
    return formatWithSlash(date);
  }
};

// ✅ NEW: Helper function to format date for new pickupDate/deliveryDate fields
const formatNewDeliveryDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time to start of day for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "Today";
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return dateString; // Return original string if formatting fails
  }
};

// Helper to convert "out-for-delivery" -> "Out For Delivery"
const formatStatus = (status: string) => {
  return status
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to get delivery status color
const getDeliveryStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'out-for-delivery':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'ready-for-delivery':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const [dynamicStats, setDynamicStats] = useState(defaultStats);
  const [currentView, setCurrentView] = useState<'dashboard' | 'all-enquiries' | 'pending-pickups' | 'in-service' | 'service-completion'>('dashboard');
  const { stats: completedStats, loading: completedLoading, error: completedError } = useCompletedStats();

  // Dashboard data for total enquiries and completion ratio
  const { data: dashboardData, loading, error, refreshData } = useDashboardData();

  // Get delivery enquiries for upcoming deliveries and in-service count
  const { enquiries: deliveryEnquiries, loading: deliveryLoading, error: deliveryError } = useDeliveryEnquiries();

  // ✅ Get pickup enquiries for ACCURATE pending pickups count
  const { enquiries: pickupEnquiries, loading: pickupLoading } = usePickupEnquiries(30000);

  // ✅ Get service enquiries for ACCURATE in-service count
  const { enquiries: serviceEnquiries, loading: serviceLoading } = useServiceEnquiries(30000);

  // ✅ Get all enquiries with new pickupDate and deliveryDate fields
  const { enquiries: allEnquiries, loading: allEnquiriesLoading, error: allEnquiriesError } = useEnquiriesWithPolling(30000);

  // Get inventory items for low stock alerts
  const { items: inventoryItems, loading: inventoryLoading } = useInventoryItems();

  // ✅ NEW: Get upcoming deliveries based on pickupDate/deliveryDate from enquiry API
  // This replaces the old deliveryEnquiries logic with new date fields
  const getUpcomingDeliveries = (enquiries: any[]) => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days in milliseconds

    return enquiries
      .filter(enquiry => {
        // Use deliveryDate if available, fallback to pickupDate
        // This ensures we show delivery dates when available, otherwise pickup dates
        const targetDate = enquiry.deliveryDate || enquiry.pickupDate;

        if (!targetDate) return false;

        try {
          const deliveryDate = new Date(targetDate);

          // Check if date is valid and within next 3 days
          if (isNaN(deliveryDate.getTime())) return false;

          // Include today and next 3 days (inclusive)
          // Reset time to start of day for accurate comparison
          const dateOnly = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
          const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const threeDaysOnly = new Date(threeDaysFromNow.getFullYear(), threeDaysFromNow.getMonth(), threeDaysFromNow.getDate());

          return dateOnly >= nowOnly && dateOnly <= threeDaysOnly;
        } catch (error) {
          console.warn('Invalid date format for enquiry:', enquiry.id, targetDate);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by deliveryDate (or pickupDate fallback) - earliest first
        const aDate = new Date(a.deliveryDate || a.pickupDate || '');
        const bDate = new Date(b.deliveryDate || b.pickupDate || '');
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5); // Limit to 5 upcoming deliveries for dashboard display
  };

  // Get upcoming deliveries using new date fields
  const upcomingDeliveries = getUpcomingDeliveries(allEnquiries);

  // Keep old logic as fallback for backward compatibility (can be removed later)
  const legacyUpcomingDeliveries = deliveryEnquiries
    .filter(enquiry =>
      enquiry.deliveryDetails?.status === 'scheduled' ||
      enquiry.deliveryDetails?.status === 'ready-for-delivery' ||
      enquiry.deliveryDetails?.status === 'out-for-delivery'
    )
    .sort((a, b) => {
      const aTime = a.deliveryDetails?.scheduledTime || '';
      const bTime = b.deliveryDetails?.scheduledTime || '';
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    })
    .slice(0, 5);

  // Get low stock items from inventory (items with quantity <= 5 or quantity <= minStock)
  const lowStockItems = inventoryItems.filter(item =>
    item.quantity <= (item.minStock || 5)
  );

  useEffect(() => {
    if (dashboardData && deliveryEnquiries && pickupEnquiries && serviceEnquiries) {
      const pendingPickups = pickupEnquiries.filter(
        enquiry =>
          enquiry.currentStage === 'pickup' &&
          enquiry.pickupDetails?.status !== 'received'
      ).length;

      const inService = serviceEnquiries.filter(enquiry =>
        enquiry.serviceTypes &&
        enquiry.serviceTypes.length > 0 &&
        !enquiry.serviceTypes.every(service => service.status === "done")
      ).length;

      setDynamicStats([
        {
          ...defaultStats[0],
          value: dashboardData.totalEnquiries.toString(),
          changeType: "positive",
        },
        {
          ...defaultStats[1],
          value: pendingPickups.toString(),
          changeType: "neutral",
        },
        {
          ...defaultStats[2],
          value: inService.toString(),
          changeType: "warning",
        },
        {
          ...defaultStats[3],
          value: completedStats.totalCompleted.toString(), // ✅ total completed services
          changeType: "positive",
        },
      ]);
    }
  }, [dashboardData, deliveryEnquiries, pickupEnquiries, serviceEnquiries, completedStats]);


  // Handle navigation internally
  const handleNavigate = (view: string, action?: string, id?: number) => {
    if (view === 'all-enquiries') {
      setCurrentView('all-enquiries');
    } else if (view === 'pending-pickups') {
      setCurrentView('pending-pickups');
    } else if (view === 'in-service') {
      setCurrentView('in-service');
    } else if (view === 'service-completion') {
      setCurrentView('service-completion');
    } else {
      // Pass through to parent for other views
      onNavigate(view, action, id);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (currentView === 'all-enquiries') {
    return (
      <AllEnquiriesView
        onNavigate={handleNavigate}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'pending-pickups') {
    return (
      <PendingPickupsView
        onNavigate={handleNavigate}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'in-service') {
    return (
      <InServiceView
        onNavigate={handleNavigate}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'service-completion') {
    return (
      <CompletedServicesView
        onNavigate={handleNavigate}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>

        {/* API Status and Refresh */}
        <div className="flex items-center gap-2">
          {(loading || deliveryLoading || pickupLoading || serviceLoading || allEnquiriesLoading) && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {error && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 h-9 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Unable to load dashboard data</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={refreshData}
                className="text-sm text-red-700 underline hover:text-red-800 mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State for Stats */}
      {loading && !dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 sm:p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Grid - Only show when we have data */}
      {dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {dynamicStats.map((stat) => (
            <Card
              key={stat.name}
              className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer group"
              onClick={() => handleNavigate(stat.redirectTo)}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors truncate">{stat.name}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-xs sm:text-sm ${stat.changeType === "positive" ? "text-success" :
                    stat.changeType === "warning" ? "text-warning" :
                      "text-muted-foreground"
                    }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg group-hover:scale-105 transition-transform flex-shrink-0 ${stat.changeType === "positive" ? "bg-success/10" :
                  stat.changeType === "warning" ? "bg-warning/10" :
                    "bg-primary/10"
                  }`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.changeType === "positive" ? "text-success" :
                    stat.changeType === "warning" ? "text-warning" :
                      "text-primary"
                    }`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rest of the component remains the same */}
      {/* Upcoming Deliveries Card */}
      <Card className="p-4 sm:p-6 bg-white border border-gray-200 shadow-md rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Upcoming Deliveries (Next 3 Days)
          </h3>
          <button
            onClick={() => handleNavigate("delivery")}
            className="whitespace-nowrap text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            View All
          </button>
        </div>


        {(deliveryLoading || allEnquiriesLoading) ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-gray-600">Loading upcoming deliveries...</span>
          </div>
        ) : (deliveryError || allEnquiriesError) ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-red-300 mb-3" />
            <p className="text-sm text-red-600 font-medium">Unable to load deliveries</p>
            <p className="text-xs text-red-500 mt-1">{deliveryError || allEnquiriesError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-700 underline hover:text-red-800 mt-3"
            >
              Refresh
            </button>
          </div>
        ) : (() => {
          // ✅ NEW: Use upcomingDeliveries from new date fields (already filtered for next 3 days)
          // Group deliveries by date in DD/MM/YYYY format
          const groupedDeliveries: Record<string, typeof upcomingDeliveries> = {};
          upcomingDeliveries.forEach((enquiry) => {
            // Use deliveryDate if available, fallback to pickupDate
            const targetDate = enquiry.deliveryDate || enquiry.pickupDate;
            if (targetDate) {
              const date = new Date(targetDate).toLocaleDateString("en-GB");
              if (!groupedDeliveries[date]) groupedDeliveries[date] = [];
              groupedDeliveries[date].push(enquiry);
            }
          });

          return Object.keys(groupedDeliveries).length > 0 ? (
            <div className="space-y-5">
              {Object.entries(groupedDeliveries).map(([date, deliveries]) => (
                <div key={date}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1">
                    {date}
                  </h4>
                  <div className="space-y-3">
                    {deliveries.map((enquiry) => (
                      <div
                        key={enquiry.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow transition"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {enquiry.customerName}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${enquiry.deliveryDate
                                    ? 'text-green-600 bg-green-50 border-green-200'
                                    : 'text-blue-600 bg-blue-50 border-blue-200'
                                  }`}
                              >
                                {enquiry.deliveryDate ? 'Delivery' : 'Pickup'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              {(enquiry.deliveryDate || enquiry.pickupDate) && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatNewDeliveryDate(enquiry.deliveryDate || enquiry.pickupDate)}
                                </div>
                              )}

                              {enquiry.address && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-32">{enquiry.address}</span>
                                </div>
                              )}

                              {enquiry.quotedAmount && (
                                <div className="text-green-600 font-medium">
                                  ₹{enquiry.quotedAmount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-2 text-right">
                          <p className="text-xs text-gray-500 font-mono">{enquiry.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Truck className="h-12 w-12 text-blue-300 mb-3" />
              <p className="text-sm text-gray-700 font-medium">No deliveries in the next 3 days</p>
              <p className="text-xs text-gray-500 mt-1">
                All deliveries are either completed or scheduled later
              </p>
            </div>
          );
        })()}
      </Card>

      {/* Recent Activity and Quick Actions - Only show when we have data */}
      {dashboardData ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3 sm:space-y-4">
              {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground break-words">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.time).toLocaleDateString("en-GB")}{" "}
                        {new Date(activity.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => handleNavigate("crm", "add-enquiry")}
                className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="text-xs sm:text-sm font-medium text-foreground">Add New Enquiry</div>
                <div className="text-xs text-muted-foreground"></div>
              </button>
              <button
                onClick={() => handleNavigate("pickup", "schedule-pickup")}
                className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="text-xs sm:text-sm font-medium text-foreground">Schedule Pickup</div>
              </button>
              <button
                onClick={() => handleNavigate("inventory", "add-inventory")}
                className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="text-xs sm:text-sm font-medium text-foreground">Add Inventory</div>
              </button>
              <button
                onClick={() => handleNavigate("expenses", "add-expense")}
                className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="text-xs sm:text-sm font-medium text-foreground">Add Expense</div>
              </button>
            </div>
          </Card>

          {/* Low Stock Alerts - Show when we have inventory data with low stock items */}
          {lowStockItems.length > 0 && (
            <Card className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft xl:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Low Stock Alerts ({lowStockItems.length})
              </h3>
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-muted-foreground">Loading inventory...</span>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-amber-800 block">{item.name}</span>
                          <span className="text-xs text-amber-600">{item.category} • {item.unit}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-amber-700 block">
                          {item.quantity} left
                        </span>
                        <span className="text-xs text-amber-600">
                          Min: {item.minStock || 5}
                        </span>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <button
                      onClick={() => handleNavigate("inventory")}
                      className="w-full text-center text-sm text-amber-700 hover:text-amber-800 font-medium py-2 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      View all {lowStockItems.length} low stock items
                    </button>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      ) : !loading && (
        /* Show skeleton for sections when no data and not loading */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-28 mb-4"></div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}