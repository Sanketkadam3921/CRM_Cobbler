import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Calendar, Package, TrendingUp, ClipboardCheck, AlertTriangle, Truck, Clock, MapPin } from "lucide-react";
import { enquiriesStorage, workflowHelpers } from "@/utils/localStorage";
import { useDashboardData, DashboardData } from "@/services/dashboardApiService";
import { useDeliveryEnquiries, DeliveryEnquiry } from "@/services/deliveryApiService";

const stats = [
  {
    name: "Total Enquiries",
    value: "24",
    change: "+12%",
    changeType: "positive",
    icon: Users,
    redirectTo: "all-enquiries"
  },
  {
    name: "Pending Pickups",
    value: "8",
    change: "+2",
    changeType: "neutral",
    icon: Calendar,
    redirectTo: "pending-pickups",
  },
  {
    name: "In Service",
    value: "15",
    change: "3 urgent",
    changeType: "warning",
    icon: Package,
    redirectTo: "in-service",
  },
  {
    name: "Service Completion Rate",
    value: "32/37",
    change: "delivered",
    changeType: "positive",
    icon: ClipboardCheck,
    redirectTo: "service-completion",
  },
];

// Fallback data for local-only mode or when API is unavailable
const fallbackRecentActivity = [
  {
    id: 1,
    type: "enquiry",
    message: "New enquiry from Instagram - Leather bag repair",
    time: "2 minutes ago",
    status: "new",
  },
  {
    id: 2,
    type: "pickup",
    message: "Pickup scheduled for Ravi Kumar - 3 shoes",
    time: "15 minutes ago",
    status: "scheduled",
  },
  {
    id: 3,
    type: "service",
    message: "Service completed for Order #1243",
    time: "1 hour ago",
    status: "completed",
  },
  {
    id: 4,
    type: "inventory",
    message: "Low stock alert - Leather polish (2 units left)",
    time: "2 hours ago",
    status: "warning",
  },
];

interface DashboardOverviewProps {
  onNavigate: (view: string, action?: string) => void;
}

// Helper function to format date for display
const formatDeliveryDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
  const [dynamicStats, setDynamicStats] = useState(stats);
  const [recentActivity, setRecentActivity] = useState(fallbackRecentActivity);
  const [lowStockAlerts, setLowStockAlerts] = useState<Array<{ item: string; stock: number }>>([]);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Try to use API data first, fallback to localStorage if API fails
  const { data: dashboardData, loading, error, refreshData } = useDashboardData();

  // Get delivery enquiries for upcoming deliveries
  const { enquiries: deliveryEnquiries, loading: deliveryLoading, error: deliveryError } = useDeliveryEnquiries();

  // Get upcoming deliveries (next 5 scheduled or ready for delivery)
  const upcomingDeliveries = deliveryEnquiries
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

  useEffect(() => {
    // Avoid unnecessary re-renders by checking if data actually changed
    if (dashboardData && !error) {
      // Use API data
      setUseLocalStorage(false);
      setDynamicStats([
        {
          ...stats[0],
          value: dashboardData.totalEnquiries.toString(),
        },
        {
          ...stats[1],
          value: dashboardData.pendingPickups.toString(),
        },
        {
          ...stats[2],
          value: dashboardData.inService.toString(),
        },
        {
          ...stats[3],
          value: dashboardData.completedDeliveredRatio,
        }
      ]);

      // Transform API recent activity data
      if (dashboardData.recentActivity) {
        const transformedActivity = dashboardData.recentActivity.map((item, index) => ({
          id: index + 1,
          type: "activity",
          message: item.text,
          time: item.time,
          status: "info",
        }));
        setRecentActivity(transformedActivity);
      }

      // Set low stock alerts
      if (dashboardData.lowStockAlerts) {
        setLowStockAlerts(dashboardData.lowStockAlerts);
      }
    } else if (error && !dashboardData) {
      // Only fallback to localStorage when API completely fails and we have no data
      console.warn('Dashboard API failed, using localStorage:', error);
      setUseLocalStorage(true);

      // Calculate real-time stats from localStorage using new integrated workflow
      const enquiries = enquiriesStorage.getAll();
      const pickupEnquiries = workflowHelpers.getPickupEnquiries();
      const serviceEnquiries = workflowHelpers.getServiceEnquiries();

      const pendingPickups = pickupEnquiries.filter(e =>
        e.pickupDetails?.status === 'scheduled' || e.pickupDetails?.status === 'assigned'
      ).length;
      const inServiceItems = serviceEnquiries.filter(e =>
        e.currentStage === 'service'
      ).length;
      const completedServices = serviceEnquiries.filter(e =>
        e.currentStage === 'completed' || e.currentStage === 'delivery'
      ).length;
      const totalServices = serviceEnquiries.length;

      setDynamicStats([
        {
          ...stats[0],
          value: enquiries.length.toString(),
        },
        {
          ...stats[1],
          value: pendingPickups.toString(),
        },
        {
          ...stats[2],
          value: inServiceItems.toString(),
        },
        {
          ...stats[3],
          value: `${completedServices}/${totalServices}`,
        }
      ]);

      // Use fallback activity
      setRecentActivity(fallbackRecentActivity);

      // Set fallback low stock alerts
      setLowStockAlerts([
        { item: 'Leather polish', stock: 2 },
        { item: 'Sole adhesive', stock: 1 }
      ]);
    }
  }, [dashboardData, error]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back! Here's what's happening with your business.
            {useLocalStorage && (
              <span className="ml-2 text-xs text-amber-600">
                (Using local data - API unavailable)
              </span>
            )}
          </p>
        </div>

        {/* API Status and Refresh */}
        <div className="flex items-center gap-2">
          {(loading || deliveryLoading) && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {error && !useLocalStorage && (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
          {!loading && (
            <button
              onClick={refreshData}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Upcoming Deliveries Card */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 flex items-center">
            <Truck className="h-5 w-5 mr-2 text-blue-600" />
            Upcoming Deliveries & Delivery Status
          </h3>
          <button
            onClick={() => onNavigate("delivery")}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            View All
          </button>
        </div>

        {deliveryLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-blue-600">Loading deliveries...</span>
          </div>
        ) : upcomingDeliveries.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeliveries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {enquiry.customerName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDeliveryStatusColor(enquiry.deliveryDetails?.status || '')}`}>
                        {formatStatus(enquiry.deliveryDetails?.status || 'Pending')}
                      </span>

                    </div>

                    <div className="flex items-center space-x-4 mt-1">
                      {enquiry.deliveryDetails?.scheduledTime && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDeliveryDate(enquiry.deliveryDetails.scheduledTime)}
                        </div>
                      )}

                      {enquiry.deliveryDetails?.deliveryMethod && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {enquiry.deliveryDetails.deliveryMethod === 'home-delivery' ? 'Home' : 'Pickup'}
                        </div>
                      )}

                      {enquiry.deliveryDetails?.assignedTo && (
                        <div className="text-xs text-gray-500">
                          Assigned: {enquiry.deliveryDetails.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      #{enquiry.id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Truck className="h-12 w-12 text-blue-300 mb-3" />
            <p className="text-sm text-blue-600 font-medium">No upcoming deliveries</p>
            <p className="text-xs text-blue-500 mt-1">All deliveries are completed or not yet scheduled</p>
          </div>
        )}

        {deliveryError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unable to load delivery data: {deliveryError}
            </p>
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {dynamicStats.map((stat) => (
          <Card
            key={stat.name}
            className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer group"
            onClick={() => onNavigate(stat.redirectTo)}
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

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.status === "new" ? "bg-primary" :
                  activity.status === "completed" ? "bg-success" :
                    activity.status === "warning" ? "bg-warning" :
                      "bg-muted-foreground"
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground break-words">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate("crm", "add-enquiry")}
              className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 group-hover:scale-105 transition-transform" />
              <div className="text-xs sm:text-sm font-medium text-foreground">Add Enquiry</div>
              <div className="text-xs text-muted-foreground">Create new lead</div>
            </button>
            <button
              onClick={() => onNavigate("pickup", "schedule-pickup")}
              className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 group-hover:scale-105 transition-transform" />
              <div className="text-xs sm:text-sm font-medium text-foreground">Schedule Pickup</div>
              <div className="text-xs text-muted-foreground">Book collection</div>
            </button>
            <button
              onClick={() => onNavigate("inventory", "add-inventory")}
              className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
            >
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 group-hover:scale-105 transition-transform" />
              <div className="text-xs sm:text-sm font-medium text-foreground">Add Inventory</div>
              <div className="text-xs text-muted-foreground">Update stock</div>
            </button>
            <button
              onClick={() => onNavigate("expenses", "add-expense")}
              className="p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-all group"
            >
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2 group-hover:scale-105 transition-transform" />
              <div className="text-xs sm:text-sm font-medium text-foreground">Add Expense</div>
              <div className="text-xs text-muted-foreground">Record cost</div>
            </button>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Card className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Low Stock Alerts
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {lowStockAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center space-x-3">
                    <Package className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">{alert.item}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">
                    {alert.stock} left
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}