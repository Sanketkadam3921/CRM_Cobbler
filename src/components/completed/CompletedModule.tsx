import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Archive,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  User,
  Phone,
} from "lucide-react";
// REASON: Replaced localStorage imports with backend API service
// import { Enquiry } from "@/types";
// import { enquiriesStorage, workflowHelpers } from "@/utils/localStorage";
import { useCompletedEnquiries, useCompletedStats, CompletedEnquiry } from "@/services/completedApiService";

export function CompletedModule() {
  // REASON: Replaced localStorage state management with backend API hooks
  // const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // REASON: Replaced localStorage data fetching with backend API hooks
  // Load completed enquiries from backend API with polling
  const {
    enquiries,
    loading: enquiriesLoading,
    error: enquiriesError,
    lastUpdate
  } = useCompletedEnquiries(200000); // Poll every 2 seconds

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useCompletedStats(500000); // Poll every 5 seconds

  // REASON: Removed localStorage useEffect - now handled by API hooks
  // useEffect(() => {
  //   const loadCompletedEnquiries = () => {
  //     const completedEnquiries = workflowHelpers.getCompletedEnquiries();
  //     setEnquiries(completedEnquiries);
  //   };
  //   
  //   loadCompletedEnquiries();
  //   
  //   // Refresh data every 2 seconds to catch newly completed items
  //   const interval = setInterval(loadCompletedEnquiries, 200000);
  //   
  //   return () => clearInterval(interval);
  // }, []);

  // REASON: Replaced localStorage calculations with backend API stats
  // const totalCompleted = enquiries.length;
  // const completedThisWeek = enquiries.filter((e) => {
  //   const completedDate = new Date(e.deliveryDetails?.deliveredAt || '');
  //   const weekAgo = new Date();
  //   weekAgo.setDate(weekAgo.getDate() - 7);
  //   return completedDate >= weekAgo;
  // }).length;
  // const totalRevenue = enquiries.reduce((sum, e) => sum + (e.finalAmount || 0), 0);
  // const avgCompletionTime = enquiries.length > 0 ? 
  //   Math.round(enquiries.reduce((sum, e) => {
  //     const startDate = new Date(e.date);
  //     const endDate = new Date(e.deliveryDetails?.deliveredAt || '');
  //     return sum + (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  //   }, 0) / enquiries.length) : 0;

  // Use backend API stats instead of client-side calculations
  const totalCompleted = stats.totalCompleted;
  const completedThisWeek = stats.completedThisWeek;
  const totalRevenue = stats.totalRevenue;
  const avgCompletionTime = stats.avgCompletionTime;

  // REASON: Updated filter to use backend API data structure
  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Completed Orders
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View all completed and delivered orders
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {/* REASON: Added loading state for stats */}
                {statsLoading ? '...' : totalCompleted}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Completed
              </div>
            </div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 text-success flex items-center justify-center">
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? '...' : completedThisWeek}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                This Week
              </div>
            </div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex items-center justify-center">
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? '...' : `${totalRevenue.toLocaleString()}`}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Revenue
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* REASON: Added error handling for API failures */}
      {(enquiriesError || statsError) && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800 text-sm">
            <strong>Error loading data:</strong> {enquiriesError || statsError}
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search completed orders"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            style={{
              '--placeholder-animation': 'scroll-left 15s linear infinite',
            } as React.CSSProperties}
          />
        </div>
      </Card>

      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @media (max-width: 640px) {
          input::placeholder {
            animation: var(--placeholder-animation);
            white-space: nowrap;
            overflow: hidden;
            display: inline-block;
            width: 200%;
          }
        }
        
        @media (min-width: 641px) {
          input::placeholder {
            animation: none;
          }
        }
      `}</style>

      {/* Completed Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Completed Orders
        </h2>

        {/* REASON: Added loading state for enquiries */}
        {enquiriesLoading && (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">Loading completed orders...</div>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {!enquiriesLoading && filteredEnquiries.map((enquiry) => (
            <Card
              key={enquiry.id}
              className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg">
                    {enquiry.customerName}
                  </h3>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">
                      {enquiry.phone.startsWith("+91")
                        ? enquiry.phone
                        : `+91 ${enquiry.phone}`}
                    </span>
                  </div>
                </div>
                <Badge className="w-fit inline-block bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium">
                  Completed
                </Badge>


              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="ml-1">{enquiry.address || 'No address provided'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    Quantity: {enquiry.quantity}
                  </div>
                  <span className="text-gray-500 text-sm">{enquiry.product}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">
                    Final Amount: ₹
                    {(Number(enquiry.subtotalAmount || 0) + Number(enquiry.gstAmount || 0))
                      .toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>


                <div className="flex items-center space-x-2">
                  <span className="text-sm text-foreground">
                    <span className="font-bold">Ordered:</span> {formatDate(enquiry.date)}
                  </span>
                </div>

                {enquiry.deliveredAt && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-foreground">
                      <span className="font-bold">Delivered:</span> {formatDateTime(enquiry.deliveredAt)}
                    </span>
                  </div>
                )}


                {enquiry.deliveryMethod && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-foreground">
                      Delivery: {enquiry.deliveryMethod === 'customer-pickup' ? 'Customer Pickup' : 'Home Delivery'}
                    </span>
                  </div>
                )}

                {enquiry.deliveryNotes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Notes:</h4>
                    <div className="bg-muted/50 p-2 rounded">
                      <p className="text-sm text-foreground">{enquiry.deliveryNotes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* <div className="flex justify-end mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div> */}
            </Card>
          ))}
        </div>

        {/* REASON: Updated empty state to only show when not loading */}
        {!enquiriesLoading && filteredEnquiries.length === 0 && (
          <Card className="p-8 text-center">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Completed Orders
            </h3>
            <p className="text-muted-foreground">
              Completed orders will appear here once items are delivered.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}