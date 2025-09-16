import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Camera,
  Upload,
  Send,
  PenTool,
  MapPin,
  Package,
  Clock,
  User,
  DollarSign,
  Phone,
} from "lucide-react";
import { Enquiry, DeliveryStatus, DeliveryMethod } from "@/types";
import { stringUtils } from "@/utils";

// ADDED: Backend API integration hooks and services - replaces localStorage usage
import {
  useDeliveryEnquiries,
  useDeliveryStats,
} from "@/services/deliveryApiService";
// REMOVED: localStorage-based imports
// import { enquiriesStorage, workflowHelpers, imageUploadHelper } from "@/utils/localStorage";

// ADDED: Image upload helper for backend API
const imageUploadHelper = {
  handleImageUpload: async (file: File): Promise<string> => {
    console.log(
      "📸 DELIVERY UI: Processing image upload for backend API:",
      file.name
    );
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log("📸 DELIVERY UI: Image converted to base64 successfully");
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error("❌ DELIVERY UI: Failed to process image:", error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  },
};

export function DeliveryModule() {
  // ADDED: Backend API hooks - replaces manual state management and localStorage
  const {
    enquiries,
    loading,
    error,
    scheduleDelivery: apiScheduleDelivery,
    markOutForDelivery: apiMarkOutForDelivery,
    completeDelivery: apiCompleteDelivery,
  } = useDeliveryEnquiries(200000); // Poll every 2 seconds

  const { stats } = useDeliveryStats(500000); // Poll stats every 5 seconds

  // Original UI state - UNCHANGED
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    null
  );
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] =
    useState<DeliveryMethod>("customer-pickup");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // REMOVED: Manual polling with setInterval - replaced by useDeliveryEnquiries hook
  // useEffect(() => {
  //   const loadDeliveryEnquiries = () => { ... localStorage operations ... };
  //   loadDeliveryEnquiries();
  //   const interval = setInterval(loadDeliveryEnquiries, 2000);
  //   return () => clearInterval(interval);
  // }, []);

  // ADDED: Logging for backend integration
  useEffect(() => {
    console.log(
      "🚀 DELIVERY MODULE: Component mounted with backend API integration"
    );
    console.log(
      "📊 DELIVERY MODULE: Initial delivery enquiries count:",
      enquiries.length
    );
  }, []);

  useEffect(() => {
    console.log(
      "🔄 DELIVERY MODULE: Enquiries updated from backend, count:",
      enquiries.length
    );
  }, [enquiries]);

  // Original stats calculations using backend data - PRESERVED original logic
  const readyForDelivery =
    stats?.readyForDelivery ??
    enquiries.filter((e) => e.deliveryDetails?.status === "ready").length;
  const scheduledDeliveries =
    stats?.scheduledDeliveries ??
    enquiries.filter((e) => e.deliveryDetails?.status === "scheduled").length;
  const outForDelivery =
    stats?.outForDelivery ??
    enquiries.filter((e) => e.deliveryDetails?.status === "out-for-delivery")
      .length;
  const deliveredToday =
    stats?.deliveredToday ??
    enquiries.filter((e) => e.deliveryDetails?.status === "delivered").length;

  // Original filtering logic - UNCHANGED
  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Original status color function - UNCHANGED
  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case "ready":
        return "bg-blue-500 text-white";
      case "scheduled":
        return "bg-yellow-500 text-white";
      case "out-for-delivery":
        return "bg-purple-500 text-white";
      case "delivered":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Original image upload handler with backend API integration
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log(
          "📸 DELIVERY UI: Image upload initiated for delivery proof"
        );
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setSelectedImage(thumbnailData);
        console.log("✅ DELIVERY UI: Image upload successful");
      } catch (error) {
        console.error("❌ DELIVERY UI: Failed to process image:", error);
        alert("Failed to process image. Please try again.");
      }
    }
  };

  // Original signature upload handler with backend API integration
  const handleSignatureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log("📸 DELIVERY UI: Signature upload initiated");
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        // setCustomerSignature(thumbnailData);
        console.log("✅ DELIVERY UI: Signature upload successful");
      } catch (error) {
        console.error("❌ DELIVERY UI: Failed to process signature:", error);
        alert("Failed to process signature. Please try again.");
      }
    }
  };

  // Modified schedule delivery function with backend API integration
  const scheduleDelivery = async (
    enquiryId: number,
    method: DeliveryMethod,
    scheduledTime: string
  ) => {
    try {
      console.log("🔄 DELIVERY UI: Scheduling delivery via backend API:", {
        enquiryId,
        method,
        scheduledTime,
      });

      // ADDED: Backend API call - replaces localStorage update
      await apiScheduleDelivery(enquiryId, method, scheduledTime);

      // Reset form - UNCHANGED
      setSelectedDeliveryMethod("customer-pickup");
      setScheduledDateTime("");

      // Original WhatsApp notification - UNCHANGED
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        console.log(
          "📱 DELIVERY UI: Showing WhatsApp notification for scheduled delivery"
        );
        alert(
          `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} delivery has been scheduled for ${scheduledTime}."`
        );
      }

      console.log(
        "✅ DELIVERY UI: Delivery scheduled successfully via backend API"
      );
    } catch (error) {
      console.error("❌ DELIVERY UI: Failed to schedule delivery:", error);
      alert("Failed to schedule delivery. Please try again.");
    }
  };

  // Modified mark out for delivery function with backend API integration
  const markOutForDelivery = async (enquiryId: number, assignedTo: string) => {
    try {
      console.log("🔄 DELIVERY UI: Marking out for delivery via backend API:", {
        enquiryId,
        assignedTo,
      });

      // ADDED: Backend API call - replaces localStorage update
      await apiMarkOutForDelivery(enquiryId, assignedTo);

      // Original WhatsApp notification - UNCHANGED
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        console.log(
          "📱 DELIVERY UI: Showing WhatsApp notification for out-for-delivery"
        );
        alert(
          `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} is out for delivery. Expected delivery: ${enquiry.deliveryDetails?.scheduledTime}"`
        );
      }

      console.log(
        "✅ DELIVERY UI: Marked as out for delivery successfully via backend API"
      );
    } catch (error) {
      console.error(
        "❌ DELIVERY UI: Failed to mark as out for delivery:",
        error
      );
      alert("Failed to mark as out for delivery. Please try again.");
    }
  };

  // Modified mark delivered function with backend API integration
  const markDelivered = async (enquiryId: number) => {
    try {
      console.log("🔄 DELIVERY UI: Marking as delivered via backend API:", {
        enquiryId,
        hasImage: !!selectedImage,
        hasSignature: !!customerSignature,
        hasNotes: !!deliveryNotes,
      });

      // ADDED: Backend API call - replaces localStorage update and stage transition
      await apiCompleteDelivery(
        enquiryId,
        selectedImage || "",
        customerSignature || "",
        deliveryNotes
      );

      // Reset form - UNCHANGED
      setSelectedImage(null);
      setCustomerSignature(null);
      setDeliveryNotes("");

      // Original completion WhatsApp notification - UNCHANGED
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        console.log(
          "📱 DELIVERY UI: Showing WhatsApp notification for delivery completion"
        );
        alert(
          `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} has been delivered successfully. Thank you for choosing our service!"`
        );
      }

      console.log(
        "✅ DELIVERY UI: Delivery completed successfully via backend API"
      );
    } catch (error) {
      console.error("❌ DELIVERY UI: Failed to complete delivery:", error);
      alert("Failed to complete delivery. Please try again.");
    }
  };

  // ADDED: Loading state for backend API
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Loading delivery enquiries...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ADDED: Error state for backend API
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading delivery data: {error}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Original JSX return - COMPLETELY UNCHANGED except data source
  return (
    <>
      <style>{`
        @media (min-width: 1280px) {
          .delivery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 640px) {
          .delivery-actions {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
      <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0" style={{
        minHeight: '100vh',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}>
          <div style={{ flex: '1 1 auto', minWidth: '0' }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              lineHeight: '1.2',
              wordBreak: 'break-word'
            }}>
              Delivery Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground" style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              lineHeight: '1.4',
              marginTop: '0.5rem'
            }}>
              Manage completed service deliveries and customer pickups
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'clamp(0.75rem, 2vw, 1rem)',
          width: '100%'
        }}>
          <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 15% 98%) 100%)',
            border: 'none',
            boxShadow: '0 2px 8px hsl(220 25% 15% / 0.08)',
            borderRadius: '0.75rem',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div className="flex items-center justify-between" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: '48px'
            }}>
              <div style={{ flex: '1 1 auto', minWidth: '0' }}>
                <div className="text-lg sm:text-2xl font-bold text-foreground" style={{
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  fontWeight: '700',
                  lineHeight: '1.2'
                }}>
                  {readyForDelivery}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground" style={{
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  lineHeight: '1.3',
                  marginTop: '0.25rem'
                }}>
                  Ready for Delivery
                </div>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex items-center justify-center" style={{
                width: 'clamp(1.5rem, 4vw, 2rem)',
                height: 'clamp(1.5rem, 4vw, 2rem)',
                flexShrink: '0',
                color: '#3b82f6'
              }}>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 15% 98%) 100%)',
            border: 'none',
            boxShadow: '0 2px 8px hsl(220 25% 15% / 0.08)',
            borderRadius: '0.75rem',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div className="flex items-center justify-between" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: '48px'
            }}>
              <div style={{ flex: '1 1 auto', minWidth: '0' }}>
                <div className="text-lg sm:text-2xl font-bold text-foreground" style={{
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  fontWeight: '700',
                  lineHeight: '1.2'
                }}>
                  {scheduledDeliveries}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground" style={{
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  lineHeight: '1.3',
                  marginTop: '0.25rem'
                }}>
                  Scheduled
                </div>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 text-warning flex items-center justify-center" style={{
                width: 'clamp(1.5rem, 4vw, 2rem)',
                height: 'clamp(1.5rem, 4vw, 2rem)',
                flexShrink: '0',
                color: '#f59e0b'
              }}>
                {/* <span className="text-lg font-bold">⏰</span> */}
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 15% 98%) 100%)',
            border: 'none',
            boxShadow: '0 2px 8px hsl(220 25% 15% / 0.08)',
            borderRadius: '0.75rem',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div className="flex items-center justify-between" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: '48px'
            }}>
              <div style={{ flex: '1 1 auto', minWidth: '0' }}>
                <div className="text-lg sm:text-2xl font-bold text-foreground" style={{
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  fontWeight: '700',
                  lineHeight: '1.2'
                }}>
                  {outForDelivery}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground" style={{
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  lineHeight: '1.3',
                  marginTop: '0.25rem'
                }}>
                  Out for Delivery
                </div>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex items-center justify-center" style={{
                width: 'clamp(1.5rem, 4vw, 2rem)',
                height: 'clamp(1.5rem, 4vw, 2rem)',
                flexShrink: '0',
                color: '#8b5cf6'
              }}>
                {/* <span className="text-lg font-bold">🚚</span> */}
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft" style={{
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 15% 98%) 100%)',
            border: 'none',
            boxShadow: '0 2px 8px hsl(220 25% 15% / 0.08)',
            borderRadius: '0.75rem',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div className="flex items-center justify-between" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: '48px'
            }}>
              <div style={{ flex: '1 1 auto', minWidth: '0' }}>
                <div className="text-lg sm:text-2xl font-bold text-foreground" style={{
                  fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                  fontWeight: '700',
                  lineHeight: '1.2'
                }}>
                  {deliveredToday}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground" style={{
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  lineHeight: '1.3',
                  marginTop: '0.25rem'
                }}>
                  Delivered Today
                </div>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 text-success flex items-center justify-center" style={{
                width: 'clamp(1.5rem, 4vw, 2rem)',
                height: 'clamp(1.5rem, 4vw, 2rem)',
                flexShrink: '0',
                color: '#10b981'
              }}>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft" style={{
          padding: 'clamp(0.75rem, 2vw, 1rem)',
          background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 15% 98%) 100%)',
          border: 'none',
          boxShadow: '0 2px 8px hsl(220 25% 15% / 0.08)',
          borderRadius: '0.75rem'
        }}>
          <div className="relative" style={{ position: 'relative', width: '100%' }}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1rem',
              height: '1rem',
              color: 'hsl(220 15% 45%)',
              pointerEvents: 'none',
              zIndex: '1'
            }} />
            <Input
              placeholder="Search Deliveries"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{
                paddingLeft: '2.5rem',
                width: '100%',
                minHeight: '2.5rem',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                border: '1px solid hsl(220 15% 90%)',
                borderRadius: '0.5rem',
                backgroundColor: 'hsl(0 0% 100%)',
                color: 'hsl(220 25% 15%)',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>
        </Card>

        {/* Delivery Items */}
        <div className="space-y-4" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(1rem, 3vw, 1.5rem)'
        }}>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground" style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            fontWeight: '700',
            lineHeight: '1.2',
            color: 'hsl(220 25% 15%)',
            margin: '0'
          }}>
            Delivery Queue
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 delivery-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'clamp(1rem, 3vw, 1.5rem)',
            width: '100%'
          }}>
            {filteredEnquiries.map((enquiry) => (
              <Card
                key={enquiry.id}
                className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300"
                style={{
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  background: 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 15% 98%) 100%)',
                  border: 'none',
                  boxShadow: '0 2px 8px hsl(220 25% 15% / 0.08)',
                  borderRadius: '0.75rem',
                  transition: 'box-shadow 0.3s ease',
                  width: '100%',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  gap: '0.75rem',
                  width: '100%'
                }}>
                  <div className="flex-1 min-w-0" style={{
                    flex: '1 1 auto',
                    minWidth: '0',
                    width: '100%'
                  }}>
                    <h3 className="font-semibold text-foreground text-base sm:text-lg" style={{
                      fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                      fontWeight: '600',
                      lineHeight: '1.3',
                      color: 'hsl(220 25% 15%)',
                      margin: '0 0 0.25rem 0',
                      wordBreak: 'break-word'
                    }}>
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
                  <Badge
                    className={`${getStatusColor(
                      enquiry.deliveryDetails?.status || "ready"
                    )} text-xs self-start`}
                    style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      alignSelf: 'flex-start',
                      flexShrink: '0',
                      minWidth: 'fit-content'
                    }}
                  >
                    {stringUtils.capitalizeWords(enquiry.deliveryDetails?.status || "ready")}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-foreground break-words">{enquiry.address}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      Quantity: {enquiry.quantity}
                    </div>
                    <span className="text-gray-500 text-sm">{enquiry.product}</span>
                  </div>

                  {enquiry.deliveryDetails?.scheduledTime && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-foreground">
                        Scheduled: {new Date(
                          enquiry.deliveryDetails.scheduledTime
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  )}

                  {enquiry.deliveryDetails?.assignedTo && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-foreground">
                        Assigned: {enquiry.deliveryDetails.assignedTo}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">
                      Amount: ₹{enquiry.finalAmount || enquiry.quotedAmount || 0}
                    </span>
                  </div>

                  {/* Show service final photo as before photo */}
                  {enquiry.deliveryDetails?.photos?.beforePhoto && (
                    <div className="mt-3" style={{
                      marginTop: '0.75rem',
                      width: '100%'
                    }}>
                      <div className="text-sm font-semibold text-foreground" style={{
                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                        fontWeight: '600',
                        color: 'hsl(220 25% 15%)',
                        marginBottom: '0.5rem'
                      }}>
                        Service Completed Photo:
                      </div>
                      <img
                        src={enquiry.deliveryDetails.photos.beforePhoto}
                        alt="Service completed"
                        className="w-full max-h-48 object-contain rounded-md border bg-gray-50"
                        loading="eager"
                        decoding="sync"
                        style={{
                          width: '100%',
                          maxHeight: '12rem',
                          objectFit: 'contain',
                          borderRadius: '0.375rem',
                          border: '1px solid hsl(220 15% 90%)',
                          backgroundColor: 'hsl(220 15% 96%)',
                          display: 'block',
                          margin: '0 auto',
                          imageRendering: 'auto',
                          WebkitImageRendering: 'auto',
                          MozImageRendering: 'auto',
                          msImageRendering: 'auto'
                        } as React.CSSProperties}
                      />
                    </div>
                  )}

                  {/* Fallback: Show service photo directly if delivery photo missing */}
                  {!enquiry.deliveryDetails?.photos?.beforePhoto &&
                    enquiry.serviceDetails?.overallPhotos?.afterPhoto && (
                      <div className="mt-3" style={{
                        marginTop: '0.75rem',
                        width: '100%'
                      }}>
                        <div className="text-xs text-muted-foreground mb-1" style={{
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                          color: 'hsl(220 15% 45%)',
                          marginBottom: '0.25rem'
                        }}>
                          Service Final Photo (Direct):
                        </div>
                        <img
                          src={enquiry.serviceDetails.overallPhotos.afterPhoto}
                          alt="Service completed"
                          className="w-full max-h-48 object-contain rounded-md border bg-gray-50"
                          loading="eager"
                          decoding="sync"
                          style={{
                            width: '100%',
                            maxHeight: '12rem',
                            objectFit: 'contain',
                            borderRadius: '0.375rem',
                            border: '1px solid hsl(220 15% 90%)',
                            backgroundColor: 'hsl(220 15% 96%)',
                            display: 'block',
                            margin: '0 auto',
                            imageRendering: 'auto',
                            WebkitImageRendering: 'auto',
                            MozImageRendering: 'auto',
                            msImageRendering: 'auto'
                          } as React.CSSProperties}
                        />
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 delivery-actions" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  width: '100%'
                }}>
                  {enquiry.deliveryDetails?.status === "ready" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm"
                        >
                          <span className="mr-1"></span>
                          Schedule Delivery
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Schedule Delivery</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Delivery Method</Label>
                            <Select
                              onValueChange={(value) =>
                                setSelectedDeliveryMethod(value as DeliveryMethod)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select delivery method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer-pickup">
                                  Customer Pickup
                                </SelectItem>
                                <SelectItem value="home-delivery">
                                  Home Delivery
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Scheduled Time</Label>
                            <Input
                              type="datetime-local"
                              value={scheduledDateTime}
                              onChange={(e) =>
                                setScheduledDateTime(e.target.value)
                              }
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                          <Button
                            onClick={() => {
                              if (scheduledDateTime) {
                                scheduleDelivery(
                                  enquiry.id,
                                  selectedDeliveryMethod,
                                  scheduledDateTime
                                );
                              } else {
                                alert("Please select a scheduled time");
                              }
                            }}
                            className="w-full bg-gradient-primary hover:opacity-90"
                            disabled={!scheduledDateTime}
                          >
                            Schedule Delivery
                          </Button>
                          {!scheduledDateTime && (
                            <p className="text-xs text-muted-foreground text-center">
                              Please select a scheduled time
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {enquiry.deliveryDetails?.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm"
                      onClick={() =>
                        markOutForDelivery(enquiry.id, "Delivery Person")
                      }
                    >
                      {/* <span className="mr-1">🚚</span> */}
                      Mark Out for Delivery
                    </Button>
                  )}

                  {enquiry.deliveryDetails?.status === "out-for-delivery" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        >
                          {/* <span className="mr-1">✓</span> */}
                          Mark Delivered
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Confirm Delivery</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Delivery Proof Photo</Label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id={`delivery-photo-${enquiry.id}`}
                              />
                              <Label
                                htmlFor={`delivery-photo-${enquiry.id}`}
                                className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                              >
                                <Camera className="h-4 w-4" />
                                <span>Take Photo</span>
                              </Label>
                            </div>
                            {selectedImage && (
                              <div className="mt-2">
                                <img
                                  src={selectedImage}
                                  alt="Delivery proof"
                                  className="w-full max-h-48 object-contain rounded-md border bg-gray-50"
                                  loading="eager"
                                  decoding="sync"
                                  style={{
                                    imageRendering: 'crisp-edges',
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden'
                                  } as React.CSSProperties}
                                />
                              </div>
                            )}
                          </div>

                          {/* <div className="space-y-2">
                          <Label>Customer Signature</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            id={`signature-${enquiry.id}`}
                          />
                          <Label
                            htmlFor={`signature-${enquiry.id}`}
                            className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md"
                          >
                            <PenTool className="h-4 w-4" />
                            <span>Upload Signature</span>
                          </Label>
                          {customerSignature && (
                            <div className="mt-2">
                              <img
                                src={customerSignature}
                                alt="Customer signature"
                                className="w-full max-h-32 object-contain rounded-md border bg-gray-50"
                                loading="eager"
                                decoding="sync"
                                style={{ 
                                  imageRendering: 'crisp-edges',
                                  transform: 'translateZ(0)',
                                  backfaceVisibility: 'hidden',
                                  WebkitBackfaceVisibility: 'hidden'
                                } as React.CSSProperties}
                              />
                            </div>
                          )}
                        </div> */}

                          <div className="space-y-2">
                            <Label htmlFor="delivery-notes">
                              Delivery Notes (Optional)
                            </Label>
                            <Textarea
                              id="delivery-notes"
                              placeholder="Any notes about the delivery..."
                              value={deliveryNotes}
                              onChange={(e) => setDeliveryNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <Button
                            onClick={() => markDelivered(enquiry.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={!selectedImage}
                          >
                            <span className="mr-2">✓</span>
                            Confirm Delivery
                          </Button>
                          {!selectedImage && (
                            <p className="text-xs text-muted-foreground text-center">
                              Please upload a delivery proof photo to continue
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
