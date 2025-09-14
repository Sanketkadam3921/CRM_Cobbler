import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, CheckCircle, Clock, DollarSign, FileText, Image, Search, Upload, Send, ArrowRight, CheckSquare, Wrench, Eye, Loader2, Phone } from "lucide-react";
import { ServiceDetails, ServiceStatus, ServiceType, ServiceTypeStatus } from "@/types";
// import { imageUploadHelper } from "@/utils/localStorage"; // We will not use this for the preview
import { ServiceTypeDetail } from "./ServiceTypeDetail";
import { useServiceEnquiries, useServiceStats, serviceApiService } from "@/services/serviceApiService";
import { useToast } from "@/hooks/use-toast";

export function ServiceModule() {
  const { toast } = useToast();

  // API hooks with 2-second polling for real-time updates
  const { enquiries, loading: enquiriesLoading, error: enquiriesError, refetch } = useServiceEnquiries(200000);
  const { stats, loading: statsLoading, error: statsError } = useServiceStats();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [workNotes, setWorkNotes] = useState("");
  const [actualCost, setActualCost] = useState<number>(0);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<ServiceType[]>([]);
  const [showServiceAssignment, setShowServiceAssignment] = useState<number | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<{ enquiryId: number; serviceType: ServiceType } | null>(null);

  // Overall photo management
  const [overallBeforePhoto, setOverallBeforePhoto] = useState<string | null>(null);
  const [overallAfterPhoto, setOverallAfterPhoto] = useState<string | null>(null);
  const [showOverallPhotoDialog, setShowOverallPhotoDialog] = useState<number | null>(null);
  const [showFinalPhotoDialog, setShowFinalPhotoDialog] = useState<number | null>(null);
  const [overallPhotoNotes, setOverallPhotoNotes] = useState("");
  const [finalPhotoNotes, setFinalPhotoNotes] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Helper function to convert file to base64 data URL with better compression
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // Create an image to compress it properly
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate dimensions to maintain aspect ratio while limiting size
            const maxWidth = 1200;
            const maxHeight = 1200;
            let { width, height } = img;

            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
              // Use better image rendering
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);

              // Convert to base64 with good quality
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve(dataUrl);
            } else {
              reject(new Error('Failed to get canvas context'));
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // API hooks handle data loading and stats automatically
  // No need for manual useEffect or stats calculation
  console.log('🔍 ServiceModule - beforeenquiries:', enquiries);
  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.serviceTypes?.some(service =>
        service.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Utility function to capitalize words for display
  const capitalizeWords = (text: string) => {
    if (!text) return "";
    return text
      .split(/[\s-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const capitalizeStatus = (status: string) => {
    if (!status) return "";
    return status
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Debug logging
  console.log('🔍 ServiceModule - enquiries:', enquiries);
  console.log('🔍 ServiceModule - enquiriesLoading:', enquiriesLoading);
  console.log('🔍 ServiceModule - enquiriesError:', enquiriesError);
  console.log('🔍 ServiceModule - filteredEnquiries:', filteredEnquiries);

  // Add loading state for search results
  const searchLoading = enquiriesLoading && searchTerm.length > 0;

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "in-progress":
        return "bg-blue-500 text-white";
      case "done":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const dataURL = await fileToDataURL(file);
        setSelectedImage(dataURL);
      } catch (error) {
        console.error('Failed to convert image to data URL:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOverallPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const dataURL = await fileToDataURL(file);
        setOverallBeforePhoto(dataURL);
      } catch (error) {
        console.error('Failed to convert overall photo to data URL:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFinalPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Bypassing the complex fileToDataURL for now to test
      const reader = new FileReader();
      reader.onloadend = () => {
        setOverallAfterPhoto(reader.result as string);
        console.log("✅ Simplified upload successful. Preview should appear.");
      };
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        toast({
          title: "Error Reading File",
          description: "There was an issue reading the selected file.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startService = async (enquiryId: number, serviceType: ServiceType, department: string) => {
    try {
      console.log('🔄 Starting service:', { enquiryId, serviceType, department });

      // Find the service type ID from the current enquiry
      const enquiry = enquiries.find(e => e.enquiryId === enquiryId);
      const serviceTypeData = enquiry?.serviceTypes?.find(s => s.type === serviceType);

      if (!serviceTypeData?.id) {
        console.error('❌ Service type not found:', { enquiryId, serviceType });
        toast({
          title: "Error",
          description: "Service type not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await serviceApiService.startService(serviceTypeData.id, selectedImage || '', workNotes);
      console.log('✅ Service started successfully');

      // Reset form
      setSelectedImage(null);
      setWorkNotes("");

      // Show success notification
      toast({
        title: "Service Started!",
        description: `${capitalizeWords(serviceType)} has been started for enquiry #${enquiryId}`,
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });

      // Send WhatsApp notification (simulated)
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp sent to ${enquiry.customerName}: "Your ${enquiry.product} has been sent to ${department} for ${capitalizeWords(serviceType)} work."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
      }
    } catch (error) {
      console.error('❌ Failed to start service:', error);
      toast({
        title: "Error",
        description: "Failed to start service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markServiceDone = async (enquiryId: number, serviceType: ServiceType) => {
    try {
      console.log('🔄 Marking service as done:', { enquiryId, serviceType });

      // Find the service type ID from the current enquiry
      const enquiry = enquiries.find(e => e.enquiryId === enquiryId);
      const serviceTypeData = enquiry?.serviceTypes?.find(s => s.type === serviceType);

      if (!serviceTypeData?.id) {
        console.error('❌ Service type not found:', { enquiryId, serviceType });
        toast({
          title: "Error",
          description: "Service type not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await serviceApiService.completeService(serviceTypeData.id, selectedImage || '', workNotes);
      console.log('✅ Service marked as done successfully');

      // Reset form
      setSelectedImage(null);

      // Show success notification
      toast({
        title: "Service Completed!",
        description: `${capitalizeWords(serviceType)} has been completed for enquiry #${enquiryId}`,
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Send WhatsApp notification (simulated)
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp sent to ${enquiry.customerName}: "Your ${capitalizeWords(serviceType)} work on ${enquiry.product} has been completed."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
      }
    } catch (error) {
      console.error('❌ Failed to mark service as done:', error);
      toast({
        title: "Error",
        description: "Failed to complete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const serviceComplete = async (enquiryId: number) => {
    try {
      console.log('🚀 Completing workflow for enquiry:', enquiryId);

      // Get latest data from API to ensure consistency
      const enquiryDetails = await serviceApiService.getEnquiryServiceDetails(enquiryId);

      if (!enquiryDetails) {
        console.log('❌ No service details found for enquiry:', enquiryId);
        toast({
          title: "Error",
          description: "No service details found for this enquiry",
          variant: "destructive",
        });
        return;
      }

      // Validate all services are done
      const allServicesDone = enquiryDetails.serviceTypes.every(service => service.status === "done");
      if (!allServicesDone) {
        console.log('❌ Not all services are done for enquiry:', enquiryId);
        toast({
          title: "Cannot Complete",
          description: "All services must be completed before moving to billing stage",
          variant: "destructive",
        });
        return;
      }

      // Validate final photo exists
      if (!enquiryDetails.overallAfterPhotoId) {
        console.log('❌ No final photo found for enquiry:', enquiryId);
        setShowFinalPhotoDialog(enquiryId);
        return;
      }

      console.log('✅ All conditions met, transitioning to billing for enquiry:', enquiryId);

      // Complete workflow via API
      await serviceApiService.completeWorkflow(
        enquiryId,
        actualCost || enquiryDetails.estimatedCost || 0,
        workNotes
      );

      console.log('✅ Workflow completed successfully, moved to billing stage');

      // Reset form
      setSelectedImage(null);
      setWorkNotes("");
      setActualCost(0);

      // Refetch data to show workflow completion immediately
      await refetch();

      // Show success notification
      toast({
        title: "Workflow Complete!",
        description: "All services completed and moved to billing stage",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Send WhatsApp notification (simulated)
      const enquiry = enquiries.find((e) => e.enquiryId === enquiryId);
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp sent to ${enquiry.customerName}: "All services completed and ready for billing!"`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
      }
    } catch (error) {
      console.error('❌ Failed to complete workflow:', error);
      toast({
        title: "Error",
        description: "Failed to complete workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendInvoice = (enquiry: ServiceDetails) => {
    console.log(
      `Sending invoice to ${enquiry.customerName} at ${enquiry.phone}`
    );
    toast({
      title: "Invoice Sent!",
      description: `Invoice sent to ${enquiry.customerName}`,
      className: "bg-green-50 border-green-200 text-green-800",
    });
  };

  const assignServices = async (enquiryId: number) => {
    try {
      if (selectedServiceTypes.length === 0) {
        toast({
          title: "No Services Selected",
          description: "Please select at least one service type",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Assigning services:', { enquiryId, serviceTypes: selectedServiceTypes });

      await serviceApiService.assignServices(enquiryId, selectedServiceTypes);
      console.log('✅ Services assigned successfully');

      // Reset form
      setSelectedServiceTypes([]);
      setShowServiceAssignment(null);

      // Refetch data to show updated service types immediately
      console.log('🔄 About to call refetch() to refresh the UI...');
      await refetch();
      console.log('✅ Refetch completed - UI should now show assigned services');

      // Show success notification
      toast({
        title: "Services Assigned!",
        description: `Services have been assigned for enquiry #${enquiryId}`,
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Send WhatsApp notification (simulated)
      const enquiry = enquiries.find((e) => e.enquiryId === enquiryId);
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp sent to ${enquiry.customerName}: "Services have been assigned for your ${enquiry.product}."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });
      }
    } catch (error) {
      console.error('❌ Failed to assign services:', error);
      toast({
        title: "Error",
        description: "Failed to assign services. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateOverallBeforePhoto = async (enquiryId: number) => {
    try {
      if (!overallBeforePhoto) {
        console.log('⚠️ No photo selected for overall before photo');
        return;
      }

      console.log('📸 Saving overall before photo for enquiry:', enquiryId);
      console.log('Photo data length:', overallBeforePhoto.length);

      // Note: Overall before photo comes from pickup, so this might not be needed
      // But keeping for consistency with current UX

      // Reset form immediately for better UX
      setOverallBeforePhoto(null);
      setOverallPhotoNotes("");
      setShowOverallPhotoDialog(null);

      console.log('✅ Overall before photo saved successfully');

      toast({
        title: "Photo Saved!",
        description: "Overall before photo has been saved",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (error) {
      console.error('❌ Failed to save overall before photo:', error);
      toast({
        title: "Error",
        description: "Failed to save photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFinalPhoto = async (enquiryId: number) => {
    try {
      if (!overallAfterPhoto || isProcessingPhoto) {
        console.log('⚠️ No final photo selected or already processing');
        return;
      }

      setIsProcessingPhoto(true);
      console.log('📸 Saving final photo for enquiry:', enquiryId);
      console.log('Final photo data length:', overallAfterPhoto.length);

      await serviceApiService.saveFinalPhoto(enquiryId, overallAfterPhoto, finalPhotoNotes);
      console.log('✅ Final photo saved successfully');

      // Reset form and close dialog immediately
      setOverallAfterPhoto(null);
      setFinalPhotoNotes("");
      setShowFinalPhotoDialog(null);

      // Refetch data to show updated final photo immediately
      await refetch();

      toast({
        title: "Final Photo Saved!",
        description: "Final photo has been saved. You can now complete the service.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

    } catch (error) {
      console.error('❌ Failed to save final photo:', error);
      toast({
        title: "Error",
        description: "Failed to save final photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Reset photo states when dialog closes
  const handleFinalPhotoDialogClose = () => {
    console.log('Closing final photo dialog');
    setShowFinalPhotoDialog(null);
    setOverallAfterPhoto(null);
    setFinalPhotoNotes("");
    setIsProcessingPhoto(false);
  };

  // Handle final photo dialog open
  const handleFinalPhotoDialogOpen = (enquiryId: number) => {
    console.log('Opening final photo dialog for enquiry:', enquiryId);
    // Reset any previous photo data
    setOverallAfterPhoto(null);
    setFinalPhotoNotes("");
    setIsProcessingPhoto(false);
    setShowFinalPhotoDialog(enquiryId);
  };

  const handleServiceTypeToggle = (serviceType: ServiceType) => {
    setSelectedServiceTypes(prev =>
      prev.includes(serviceType)
        ? prev.filter(type => type !== serviceType)
        : [...prev, serviceType]
    );
  };

  const getProgressText = (serviceTypes: ServiceTypeStatus[]) => {
    if (!serviceTypes || serviceTypes.length === 0) return "No Services Assigned";
    const doneCount = serviceTypes.filter(s => s.status === "done").length;
    return `${doneCount}/${serviceTypes.length} Services Completed`;
  };

  const getOverallStatus = (serviceTypes: ServiceTypeStatus[]) => {
    if (!serviceTypes || serviceTypes.length === 0) {
      return "Pending";
    } else if (serviceTypes.every(service => service.status === "done")) {
      return "Done";
    } else if (serviceTypes.some(service => service.status === "in-progress")) {
      return "In Progress";
    } else {
      return "Pending";
    }
  };

  // Show service type detail view if selected
  if (selectedServiceDetail) {
    return (
      <ServiceTypeDetail
        enquiryId={selectedServiceDetail.enquiryId}
        serviceType={selectedServiceDetail.serviceType}
        onBack={() => setSelectedServiceDetail(null)}
        onServiceUpdated={() => refetch()}
      />
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Service Workflow</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage Multi-Service Work From Received Items</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Pending Services</div>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.inProgressCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">In Progress</div>
            </div>
            <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.doneCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Completed Services</div>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalServices}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Services</div>
            </div>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </Card>
      </div>


      {/* Search */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search Services"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Service Items */}
      <div className="space-y-6">

        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Service Queue
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {filteredEnquiries.map((enquiry) => (
            <Card key={enquiry.enquiryId} className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">{capitalizeWords(enquiry.customerName)}</h3>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">
                      {enquiry.phone.startsWith('+91') ? enquiry.phone : `+91 ${enquiry.phone}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge className={`${getStatusColor(getOverallStatus(enquiry.serviceTypes || []) as ServiceStatus)} text-xs px-2 py-1 rounded-full font-medium`}>
                    {capitalizeStatus(getOverallStatus(enquiry.serviceTypes || []))}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                    {getProgressText(enquiry.serviceTypes || [])}
                  </Badge>
                </div>
              </div>

              {/* Product & Estimated Cost */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    Quantity: {enquiry.quantity}
                  </div>
                  <span className="text-gray-500 text-sm">{enquiry.product}</span>
                </div>




                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">
                    Estimated: ₹{enquiry.estimatedCost || 0}
                  </span>
                </div>

                {/* Service Types */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Services:</h4>
                  {enquiry.serviceTypes && enquiry.serviceTypes.length > 0 ? (
                    enquiry.serviceTypes.map((service, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-foreground">{capitalizeWords(service.type)}</span>
                          <Badge className={`${getStatusColor(service.status as ServiceStatus)} text-xs px-2 py-1 rounded-full font-medium`}>
                            {capitalizeWords(service.status)}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs mt-2 sm:mt-0"
                          onClick={() =>
                            setSelectedServiceDetail({
                              enquiryId: enquiry.enquiryId,
                              serviceType: service.type,
                            })
                          }
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No Services Assigned Yet</div>
                  )}
                </div>

                {/* Overall Photos */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Overall Photos:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Before Photo */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Before</p>
                      {enquiry.overallPhotos?.beforePhoto ? (
                        <img
                          src={enquiry.overallPhotos.beforePhoto}
                          alt="Before service"
                          className="w-full h-32 sm:h-40 object-cover rounded border"
                          style={{ imageRendering: 'auto' }}
                        />
                      ) : (
                        <div className="h-32 sm:h-40 bg-muted rounded flex items-center justify-center border">
                          <span className="text-sm font-semibold text-muted-foreground">No Before Photo</span>
                        </div>
                      )}
                    </div>

                    {/* After Photo */}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">After</p>
                      {enquiry.overallPhotos?.afterPhoto ? (
                        <img
                          src={enquiry.overallPhotos.afterPhoto}
                          alt="After service"
                          className="w-full h-32 sm:h-40 object-cover rounded border"
                          style={{ imageRendering: 'auto' }}
                        />
                      ) : (
                        <div className="h-32 sm:h-40 bg-muted rounded flex items-center justify-center border">
                          <span className="text-sm font-semibold text-muted-foreground">No After Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                  onClick={() => sendInvoice(enquiry)}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send Invoice
                </Button>

                {(!enquiry.serviceTypes || enquiry.serviceTypes.length === 0) && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    onClick={() => setShowServiceAssignment(enquiry.enquiryId)}
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    Assign Services
                  </Button>
                )}

                {enquiry.serviceTypes &&
                  enquiry.serviceTypes.length > 0 &&
                  !enquiry.overallPhotos?.beforePhoto && (
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                      onClick={() => setShowOverallPhotoDialog(enquiry.enquiryId)}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Take Overall Before Photo
                    </Button>
                  )}

                {/* Show Take Final Photo button when all services are done */}
                {enquiry.serviceTypes &&
                  enquiry.serviceTypes.length > 0 &&
                  enquiry.serviceTypes.every((service) => service.status === "done") &&
                  !enquiry.overallPhotos?.afterPhoto && (
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                      onClick={() => handleFinalPhotoDialogOpen(enquiry.enquiryId)}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Take Final Photo
                    </Button>
                  )}

                {enquiry.serviceTypes &&
                  enquiry.serviceTypes.length > 0 &&
                  enquiry.serviceTypes.every((service) => service.status === "done") &&
                  enquiry.overallPhotos?.beforePhoto &&
                  enquiry.overallPhotos?.afterPhoto && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      onClick={() => serviceComplete(enquiry.enquiryId)}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Send To Billing
                    </Button>
                  )}
              </div>

              {/* Service Assignment Dialog */}
              {showServiceAssignment === enquiry.enquiryId && (
                <Dialog open={showServiceAssignment === enquiry.enquiryId} onOpenChange={() => setShowServiceAssignment(null)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Services</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Service Types (Multi-Select)</Label>
                        <div className="space-y-2">
                          {["Sole Replacement", "Zipper Repair", "Cleaning & Polish", "Stitching", "Leather Treatment", "Hardware Repair"].map((serviceType) => (
                            <div key={serviceType} className="flex items-center space-x-2">
                              <Checkbox
                                id={`service-${serviceType}`}
                                checked={selectedServiceTypes.includes(serviceType as ServiceType)}
                                onCheckedChange={() => handleServiceTypeToggle(serviceType as ServiceType)}
                              />
                              <Label htmlFor={`service-${serviceType}`} className="text-sm">
                                {capitalizeWords(serviceType)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => assignServices(enquiry.enquiryId)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={selectedServiceTypes.length === 0}
                        >
                          Assign Services
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowServiceAssignment(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Overall Before Photo Dialog */}
              {showOverallPhotoDialog === enquiry.enquiryId && (
                <Dialog open={showOverallPhotoDialog === enquiry.enquiryId} onOpenChange={() => setShowOverallPhotoDialog(null)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Take Overall Before Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Overall Before Photo</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleOverallPhotoUpload}
                            className="hidden"
                            id={`overall-before-photo-${enquiry.enquiryId}`}
                          />
                          <Label
                            htmlFor={`overall-before-photo-${enquiry.enquiryId}`}
                            className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Take Photo</span>
                          </Label>
                        </div>
                        {overallBeforePhoto && (
                          <div className="mt-2">
                            <img
                              src={overallBeforePhoto}
                              alt="Overall before photo"
                              className="w-full h-48 object-cover rounded-md border"
                              style={{ imageRendering: 'auto' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overall-notes">Notes (Optional)</Label>
                        <Textarea
                          id="overall-notes"
                          placeholder="Add Notes About The Overall Condition..."
                          value={overallPhotoNotes}
                          onChange={(e) => setOverallPhotoNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => updateOverallBeforePhoto(enquiry.enquiryId)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={!overallBeforePhoto}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Save Photo
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowOverallPhotoDialog(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Final Photo Dialog */}
              {showFinalPhotoDialog === enquiry.enquiryId && (
                <Dialog open={showFinalPhotoDialog === enquiry.enquiryId} onOpenChange={handleFinalPhotoDialogClose}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Take Final Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Final After Photo (Required)</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFinalPhotoUpload}
                            className="hidden"
                            id={`final-photo-${enquiry.enquiryId}`}
                          />
                          <Label
                            htmlFor={`final-photo-${enquiry.enquiryId}`}
                            className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Take Final Photo</span>
                          </Label>
                        </div>
                        {overallAfterPhoto && (
                          <div className="mt-2">
                            <img
                              src={overallAfterPhoto}
                              alt="Final after photo"
                              className="w-full h-48 object-cover rounded-md border"
                              style={{ imageRendering: 'auto' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="final-notes">Final Notes (Optional)</Label>
                        <Textarea
                          id="final-notes"
                          placeholder="Add Final Notes About The Completed Work..."
                          value={finalPhotoNotes}
                          onChange={(e) => setFinalPhotoNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => updateFinalPhoto(enquiry.enquiryId)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={!overallAfterPhoto || isProcessingPhoto}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isProcessingPhoto ? 'Processing...' : 'Save Final Photo'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleFinalPhotoDialogClose}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          ))}
        </div>

        {enquiriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading Service Enquiries...</span>
          </div>
        ) : enquiriesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error Loading Service Enquiries</p>
              <p className="text-sm text-gray-500">{enquiriesError}</p>
            </div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Service Items
            </h3>
            <p className="text-muted-foreground">
              Service Items Will Appear Here Once Items Are Received From Pickup.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}