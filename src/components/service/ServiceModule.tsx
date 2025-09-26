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
import { Camera, CheckCircle, Clock, DollarSign, FileText, Image, Search, Upload, Send, ArrowRight, CheckSquare, Wrench, Eye, Loader2, Phone, Plus, Settings } from "lucide-react";
import { ServiceDetails, ServiceStatus, ServiceType, ServiceTypeStatus } from "@/types";
import { imageUploadHelper } from "@/utils/localStorage";
import { ServiceTypeDetail } from "./ServiceTypeDetail";
import { useServiceEnquiries, useServiceStats, serviceApiService } from "@/services/serviceApiService";
import { useToast } from "@/hooks/use-toast";

export function ServiceModule() {
  const { toast } = useToast();

  // API hooks with 2-second polling for real-time updates
  const { enquiries, loading: enquiriesLoading, error: enquiriesError, refetch } = useServiceEnquiries(5000);
  const { stats, loading: statsLoading, error: statsError } = useServiceStats();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [workNotes, setWorkNotes] = useState("");
  const [actualCost, setActualCost] = useState<number>(0);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<ServiceType[]>([]);
  const [showServiceAssignment, setShowServiceAssignment] = useState<{ enquiryId: number; itemKey: string } | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<{ enquiryId: number; serviceType: ServiceType } | null>(null);
  // Per-enquiry selected item key: `${product}-${index}`
  const [selectedItemByEnquiry, setSelectedItemByEnquiry] = useState<Record<number, string | null>>({});

  // Overall photo management
  const [overallAfterPhoto, setOverallAfterPhoto] = useState<string | null>(null);
  const [showFinalPhotoDialog, setShowFinalPhotoDialog] = useState<number | null>(null);
  const [finalPhotoNotes, setFinalPhotoNotes] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  console.log('🔍 ServiceModule - beforeenquiries:', enquiries);
  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.serviceTypes?.some(service =>
        service.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Debug logging
  console.log('🔍 ServiceModule - enquiries:', enquiries);
  console.log('🔍 ServiceModule - enquiriesLoading:', enquiriesLoading);
  console.log('🔍 ServiceModule - enquiriesError:', enquiriesError);
  console.log('🔍 ServiceModule - filteredEnquiries:', filteredEnquiries);

  // Add loading state for search results
  const searchLoading = enquiriesLoading && searchTerm.length > 0;

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

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
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setSelectedImage(thumbnailData);
      } catch (error) {
        console.error('Failed to process image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  const handleFinalPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setOverallAfterPhoto(thumbnailData);
      } catch (error) {
        console.error('Failed to process image:', error);
        alert('Failed to process image. Please try again.');
      }
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
          duration: 3000,
        });
        return;
      }

      await serviceApiService.startService(enquiryId, serviceTypeData.id, selectedImage || '', workNotes);
      console.log('✅ Service started successfully');

      // Reset form
      setSelectedImage(null);
      setWorkNotes("");

      // Show success notification
      toast({
        title: "Service Started!",
        description: `${serviceType} has been started for enquiry #${enquiryId}`,
        className: "bg-blue-50 border-blue-200 text-blue-800",
        duration: 3000,
      });

      // Send WhatsApp notification (simulated)
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp message sent to ${enquiry.customerName}: "Your ${enquiry.product} has been sent to ${department} for ${serviceType} work."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Failed to start service:', error);
      toast({
        title: "Error",
        description: "Failed to start service. Please try again.",
        variant: "destructive",
        duration: 3000,
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
          duration: 3000,
        });
        return;
      }

      await serviceApiService.completeService(enquiryId, serviceTypeData.id, selectedImage || '', workNotes);
      console.log('✅ Service marked as done successfully');

      // Reset form
      setSelectedImage(null);

      // Show success notification
      toast({
        title: "Service Completed!",
        description: `${serviceType} has been completed for enquiry #${enquiryId}`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 3000,
      });

      // Send WhatsApp notification (simulated)
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp message sent to ${enquiry.customerName}: "Your ${serviceType} work on ${enquiry.product} has been completed."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Failed to mark service as done:', error);
      toast({
        title: "Error",
        description: "Failed to complete service. Please try again.",
        variant: "destructive",
        duration: 3000,
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
          duration: 3000,
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
          duration: 3000,
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
        duration: 3000,
      });

      // Send WhatsApp notification (simulated)
      const enquiry = enquiries.find((e) => e.enquiryId === enquiryId);
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp message sent to ${enquiry.customerName}: "All services completed and ready for billing!"`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Failed to complete workflow:', error);
      toast({
        title: "Error",
        description: "Failed to complete workflow. Please try again.",
        variant: "destructive",
        duration: 3000,
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
      duration: 3000,
    });
  };

  const assignServices = async (enquiryId: number, itemKey: string) => {
    try {
      // Get existing services for this item
      const enquiry = enquiries.find(e => e.enquiryId === enquiryId);
      const existingServices = getServicesForItem(enquiry!, itemKey).map(s => s.type);

      // Filter out services that are already assigned
      const newServicesToAssign = selectedServiceTypes.filter(
        serviceType => !existingServices.includes(serviceType)
      );

      if (newServicesToAssign.length === 0) {
        toast({
          title: "No New Services",
          description: "All selected services are already assigned to this item",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Parse product and itemIndex from itemKey
      const [product, itemIndexStr] = itemKey.split('-');
      const itemIndex = parseInt(itemIndexStr, 10);

      console.log('🔄 Assigning new services to specific item:', {
        enquiryId,
        newServicesToAssign,
        existingServices,
        product,
        itemIndex
      });

      await serviceApiService.assignServices(enquiryId, newServicesToAssign, { product, itemIndex });
      console.log('✅ New services assigned successfully to item');

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
        description: `${newServicesToAssign.length} new service${newServicesToAssign.length > 1 ? 's' : ''} assigned to ${product} #${itemIndex + 1}`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 3000,
      });

      // Send WhatsApp notification (simulated)
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp message sent to ${enquiry.customerName}: "New services have been assigned for your ${product} item #${itemIndex + 1}."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Failed to assign services:', error);
      toast({
        title: "Error",
        description: "Failed to assign services. Please try again.",
        variant: "destructive",
        duration: 3000,
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
        duration: 3000,
      });

    } catch (error) {
      console.error('❌ Failed to save final photo:', error);
      toast({
        title: "Error",
        description: "Failed to save final photo. Please try again.",
        variant: "destructive",
        duration: 3000,
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
    if (!serviceTypes || serviceTypes.length === 0) {
      return "No services assigned";
    }
    const doneCount = serviceTypes.filter(service => service.status === "done").length;
    const totalCount = serviceTypes.length;
    return `${doneCount}/${totalCount} services completed`;
  };

  const getOverallStatus = (serviceTypes: ServiceTypeStatus[]) => {
    if (!serviceTypes || serviceTypes.length === 0) {
      return "Unassigned";
    } else if (serviceTypes.every(service => service.status === "done")) {
      return "All Done";
    } else if (serviceTypes.some(service => service.status === "in-progress")) {
      return "In Progress";
    } else {
      return "Pending";
    }
  };

  // Helper function to get services for a specific item
  const getServicesForItem = (enquiry: ServiceDetails, itemKey: string) => {
    if (!enquiry.serviceTypes) return [];
    return enquiry.serviceTypes.filter(service =>
      `${(service as any).product}-${(service as any).itemIndex}` === itemKey
    );
  };

  // Helper function to check if an item has any services assigned
  const hasServicesAssigned = (enquiry: ServiceDetails, itemKey: string) => {
    return getServicesForItem(enquiry, itemKey).length > 0;
  };

  // Helper function to get available services for an item (not already assigned)
  const getAvailableServicesForItem = (enquiry: ServiceDetails, itemKey: string): ServiceType[] => {
    const allServices: ServiceType[] = ["Repairing", "Cleaning", "Dyeing"];
    const existingServices = getServicesForItem(enquiry, itemKey).map(s => s.type);
    return allServices.filter(service => !existingServices.includes(service));
  };

  // Show service type detail view if selected
  if (selectedServiceDetail) {
    return (
      <ServiceTypeDetail
        enquiryId={selectedServiceDetail.enquiryId}
        serviceType={selectedServiceDetail.serviceType}
        productItemKey={(window as any).__serviceDetailItemKey as string | undefined}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Service Workflow
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage multi-service work from received items
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Pending Services
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.doneCount}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Completed Services
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalServices}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Services
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Service Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Service Queue
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {filteredEnquiries.map((enquiry) => {
            const items = enquiry.itemPhotos || [];
            const selectedItem = selectedItemByEnquiry[enquiry.enquiryId] || (items[0] ? `${items[0].product}-${items[0].itemIndex}` : null);
            const servicesForSelectedItem = selectedItem ? getServicesForItem(enquiry, selectedItem) : [];

            return (
              <Card
                key={enquiry.enquiryId}
                className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 relative"
              >
                {/* Badge group - always top-right */}
                <div className="absolute top-3 right-3 flex flex-col sm:flex-col items-end gap-2">
                  <Badge
                    className={`${getStatusColor(
                      getOverallStatus(enquiry.serviceTypes || []) as ServiceStatus
                    )} text-xs px-2 py-1 rounded-full font-medium`}
                  >
                    {getOverallStatus(enquiry.serviceTypes || [])}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                    {getProgressText(enquiry.serviceTypes || [])}
                  </Badge>
                </div>

                {/* Header (customer info) */}
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-start justify-between mb-4 pr-28">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg">
                      {enquiry.customerName}
                    </h3>
                    <div className="flex items-center space-x-1 text-gray-600 mt-1">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        {enquiry.phone.startsWith("+91")
                          ? enquiry.phone
                          : `+91 ${enquiry.phone}`}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="space-y-3">
                  {/* Product info */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {enquiry.products && enquiry.products.length > 0 ? (
                        enquiry.products.map((product, index) => (
                          <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            <span>{product.product}</span>
                            <span>({product.quantity})</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          <span>{enquiry.product}</span>
                          <span>({enquiry.quantity})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">
                      Estimated: ₹{enquiry.estimatedCost || 0}
                    </span>
                  </div>
                  {/* Item dropdown at top-right to scope the entire card */}
                  {items.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-foreground">Select Item</Label>
                      <Select
                        value={selectedItem || undefined}
                        onValueChange={(v) => setSelectedItemByEnquiry(prev => ({ ...prev, [enquiry.enquiryId]: v }))}
                      >
                        <SelectTrigger className="h-8 w-56">
                          <SelectValue placeholder="Choose item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((it) => {
                            const key = `${it.product}-${it.itemIndex}`;
                            const itemServices = getServicesForItem(enquiry, key);
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{it.product} — {it.itemIndex}</span>
                                  {itemServices.length > 0 && (
                                    <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                      {itemServices.length} service{itemServices.length > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Services for Selected Item */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Services for Selected Item:</h4>
                      {selectedItem && !hasServicesAssigned(enquiry, selectedItem) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => {
                            setSelectedServiceTypes([]);
                            setShowServiceAssignment({ enquiryId: enquiry.enquiryId, itemKey: selectedItem });
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Assign Services
                        </Button>
                      )}
                    </div>
                    {servicesForSelectedItem.length > 0 ? (
                      <div className="space-y-2">
                        {servicesForSelectedItem.map((service, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-muted/50 rounded space-y-2 sm:space-y-0"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-foreground">{service.type}</span>
                              <Badge
                                className={`${getStatusColor(service.status)} text-xs`}
                              >
                                {capitalizeFirst(service.status)}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs w-full sm:w-auto"
                              onClick={() => {
                                // Pass selected item to detail via global state + key param in route-less usage
                                (window as any).__serviceDetailItemKey = selectedItem;
                                setSelectedServiceDetail({
                                  enquiryId: enquiry.enquiryId,
                                  serviceType: service.type,
                                });
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : selectedItem ? (
                      <div className="text-sm text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
                        No services assigned to this item yet. Click "Assign Services" to add services.
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Select an item to view its services
                      </div>
                    )}

                    {/* Add Services Button for existing items with services */}
                    {selectedItem && hasServicesAssigned(enquiry, selectedItem) && (
                      <div>
                        {getAvailableServicesForItem(enquiry, selectedItem).length > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-medium mt-2"
                            onClick={() => {
                              // Reset selected services when opening dialog for adding more
                              setSelectedServiceTypes([]);
                              setShowServiceAssignment({ enquiryId: enquiry.enquiryId, itemKey: selectedItem });
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1 text-blue-600" />
                            Add More Services ({getAvailableServicesForItem(enquiry, selectedItem).length} available)
                          </Button>
                        ) : (
                          <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded border border-green-200 mt-2">
                            All 3 services have been assigned to this item.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* All Items Summary */}
                  {items.length > 1 && (
                    <div className="space-y-2 mt-4 pt-3 border-t border-muted">
                      <h4 className="text-sm font-medium text-foreground">All Items Summary:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((item) => {
                          const itemKey = `${item.product}-${item.itemIndex}`;
                          const itemServices = getServicesForItem(enquiry, itemKey);
                          return (
                            <div key={itemKey} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                              <span className="font-medium">
                                {item.product} - {item.itemIndex}
                              </span>
                              <Badge
                                className={`text-xs ${itemServices.length > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'}`}
                              >
                                {itemServices.length} service{itemServices.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Overall Photos (use selected item) */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Overall Photos:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Before Photo */}
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">
                          Before
                        </p>
                        {(() => {
                          const beforeSrc: string | undefined = (() => {
                            if (enquiry.overallPhotos?.beforePhoto) return enquiry.overallPhotos.beforePhoto;
                            if (!items || items.length === 0) return undefined;
                            const item = selectedItem ? items.find(it => `${it.product}-${it.itemIndex}` === selectedItem) : items[0];
                            if (!item) return undefined;
                            const legacy = Array.isArray((item as any).photos) ? (item as any).photos as string[] : undefined;
                            const grouped = !legacy ? ((item as any).photos || {}) as { before?: string[] } : undefined;
                            return legacy ? legacy[0] : (grouped?.before || [])[0];
                          })();
                          return beforeSrc ? (
                            <img
                              src={beforeSrc}
                              alt="Before service"
                              className="h-20 w-full object-contain rounded border bg-gray-50"
                            />
                          ) : (
                            <div className="h-20 bg-muted rounded flex items-center justify-center border">
                              <span className="text-xs text-muted-foreground text-center px-1">
                                No before photo
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      {/* After Photo */}
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">
                          After
                        </p>
                        {enquiry.overallPhotos?.afterPhoto ? (
                          <img
                            src={enquiry.overallPhotos.afterPhoto}
                            alt="After service"
                            className="h-20 w-full object-contain rounded border bg-gray-50"
                          />
                        ) : (
                          <div className="h-20 bg-muted rounded flex items-center justify-center border">
                            <span className="text-xs text-muted-foreground text-center px-1">
                              No after photo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons - mobile optimized */}
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {enquiry.serviceTypes && enquiry.serviceTypes.length > 0 &&
                    enquiry.serviceTypes.every(service => service.status === "done") &&
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

                  {enquiry.serviceTypes && enquiry.serviceTypes.length > 0 &&
                    enquiry.serviceTypes.every(service => service.status === "done") &&
                    enquiry.overallPhotos?.afterPhoto && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        onClick={() => serviceComplete(enquiry.enquiryId)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Send to Billing
                      </Button>
                    )}
                </div>

                {/* Service Assignment Dialog */}
                {showServiceAssignment && showServiceAssignment.enquiryId === enquiry.enquiryId && (
                  <Dialog
                    open={showServiceAssignment.enquiryId === enquiry.enquiryId}
                    onOpenChange={() => {
                      setShowServiceAssignment(null);
                      setSelectedServiceTypes([]);
                    }}
                  >
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Assign Services to Item
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {(() => {
                          const [product, itemIndexStr] = showServiceAssignment.itemKey.split('-');
                          const itemIndex = parseInt(itemIndexStr, 10);
                          const existingServices = getServicesForItem(enquiry, showServiceAssignment.itemKey).map(s => s.type);
                          const availableServices = getAvailableServicesForItem(enquiry, showServiceAssignment.itemKey);
                          const isAddingMore = existingServices.length > 0;

                          return (
                            <div className="space-y-4">
                              {/* Item Info */}
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <div className="text-sm font-medium text-blue-900 flex items-center gap-2">
                                  {isAddingMore ? 'Adding services to:' : 'Assigning services to:'} <strong>{product}</strong>
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                    {itemIndex + 1}
                                  </span>
                                </div>
                                {isAddingMore && (
                                  <div className="text-xs text-blue-700 mt-1">
                                    Current services: {existingServices.join(', ')} ({existingServices.length}/3)
                                  </div>
                                )}
                                {availableServices.length === 0 && (
                                  <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded mt-2">
                                    All services (3/3) have been assigned to this item.
                                  </div>
                                )}
                              </div>

                              {availableServices.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Select Service Types</Label>
                                  <div className="text-xs text-gray-600 mb-2">
                                    Available services ({availableServices.length} remaining):
                                  </div>
                                  <div className="space-y-2 pt-2">
                                    {["Repairing", "Cleaning", "Dyeing"].map((serviceType) => {
                                      const isAlreadyAssigned = existingServices.includes(serviceType as ServiceType);
                                      const isAvailable = availableServices.includes(serviceType as ServiceType);

                                      return (
                                        <div key={serviceType} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`service-${enquiry.enquiryId}-${serviceType}`}
                                            checked={isAlreadyAssigned || selectedServiceTypes.includes(serviceType as ServiceType)}
                                            disabled={isAlreadyAssigned || !isAvailable}
                                            onCheckedChange={() => {
                                              if (isAvailable) {
                                                handleServiceTypeToggle(serviceType as ServiceType);
                                              }
                                            }}
                                          />
                                          <Label
                                            htmlFor={`service-${enquiry.enquiryId}-${serviceType}`}
                                            className={`text-sm ${isAlreadyAssigned
                                              ? 'text-muted-foreground cursor-not-allowed'
                                              : isAvailable
                                                ? 'cursor-pointer'
                                                : 'text-muted-foreground cursor-not-allowed'
                                              }`}
                                          >
                                            {serviceType}
                                            {isAlreadyAssigned && (
                                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">
                                                Already Assigned
                                              </span>
                                            )}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="flex space-x-2">
                                {availableServices.length > 0 ? (
                                  <Button
                                    onClick={() => assignServices(enquiry.enquiryId, showServiceAssignment.itemKey)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    disabled={selectedServiceTypes.length === 0}
                                  >
                                    {isAddingMore ? 'Add Selected Services' : 'Assign Selected Services'}
                                  </Button>
                                ) : (
                                  <div className="flex-1 text-center text-sm text-muted-foreground py-2">
                                    No more services can be added to this item.
                                  </div>
                                )}
                                <Button
                                  onClick={() => {
                                    setShowServiceAssignment(null);
                                    setSelectedServiceTypes([]);
                                  }}
                                  className="w-24 h-10 bg-red-500 text-white hover:bg-red-600 hover:text-white font-medium"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
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
                        <div className="space-y-2">
                          <Label htmlFor="final-notes">Final Notes (Optional)</Label>
                          <Textarea
                            id="final-notes"
                            placeholder="Add final notes about the completed work"
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
                            {isProcessingPhoto ? 'Processing' : 'Save Final Photo'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleFinalPhotoDialogClose}
                            className="w-24 h-10 bg-red-500 text-white hover:bg-red-600 hover:text-white font-medium"

                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </Card>
            );
          })}
        </div>

        {enquiriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading service enquiries...</span>
          </div>
        ) : enquiriesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading service enquiries</p>
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
              Service items will appear here once items are received from pickup.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}