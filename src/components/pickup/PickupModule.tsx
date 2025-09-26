import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  User,
  Package,
  Shield,
  Plus,
  Search,
  Camera,
  Upload,
  Send,
  CheckCircle,
  Loader2,
  Phone,
} from "lucide-react";
import { Enquiry, PickupStatus, ServiceType } from "@/types";
import { imageUploadHelper } from "@/utils/localStorage";
import { usePickupEnquiries, usePickupStats } from "@/services/pickupApiService";
import { useToast } from "@/hooks/use-toast";
import { stringUtils } from "@/utils";

export function PickupModule() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // legacy single photo
  const [receivedNotes, setReceivedNotes] = useState("");
  // New UI state for multi-photo capture per product item
  const [multiPhotos, setMultiPhotos] = useState<Record<string, string[]>>({}); // key: `${product}-${index}` -> string[] of photos
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  // Dialog state management - added from teammate's version
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  // Use pickup API hooks with 2-second polling
  const {
    enquiries,
    loading: enquiriesLoading,
    error: enquiriesError,
    assignPickup,
    markCollected,
    markReceived,
    markReceivedMulti
  } = usePickupEnquiries(200000);

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = usePickupStats();

  // Use stats from API instead of calculating locally
  const calculatedStats = stats || {
    scheduledPickups: 0,
    assignedPickups: 0,
    collectedPickups: 0,
    receivedPickups: 0
  };

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-500 text-white";
      case "assigned":
        return "bg-blue-500 text-white";
      case "collected":
        return "bg-purple-500 text-white";
      case "received":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleAssignPickup = async (enquiryId: number, assignedTo: string) => {
    try {
      await assignPickup(enquiryId, assignedTo);
      toast({
        title: "Pickup Assigned!",
        description: `Pickup has been assigned to ${assignedTo}`,
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign pickup",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleMarkCollected = async (enquiryId: number) => {
    if (!selectedImage) {
      toast({
        title: "Photo Required",
        description: "Please upload a collection proof photo",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      await markCollected(enquiryId, selectedImage);

      // Reset form
      setSelectedImage(null);

      toast({
        title: "Pickup Collected!",
        description: "Pickup has been marked as collected successfully",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 3000,
      });

      // Send WhatsApp notification (simulated)
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp message sent to ${enquiry.customerName}: "Your ${enquiry.product} has been successfully collected."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark pickup as collected",
        variant: "destructive",
        duration: 3000,
      });
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
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // New: handle per product-item photo uploads (up to 4)
  const handleItemPhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    product: string,
    itemIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        const key = `${product}-${itemIndex}`;
        setMultiPhotos(prev => {
          const existing = prev[key] || [];
          // limit to 4 photos
          const updated = [...existing, thumbnailData].slice(0, 4);
          return { ...prev, [key]: updated };
        });
        setSelectedProductKey(prev => prev || key);
      } catch (error) {
        console.error('Failed to process image:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  const handleItemReceived = async (enquiryId: number) => {
    try {
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      const estimatedCost = enquiry?.quotedAmount || 0;

      // Build multi-photo payload: for each product and quantity, expect up to 4 photos per item
      const itemsPayload: Array<{ product: string; itemIndex: number; photos: string[]; notes?: string }> = [];
      const products = enquiry?.products && enquiry.products.length > 0
        ? enquiry.products
        : [{ product: enquiry?.product || '', quantity: enquiry?.quantity || 1 } as any];

      products.forEach(p => {
        for (let i = 1; i <= (p.quantity || 1); i++) {
          const key = `${p.product}-${i}`;
          const photos = multiPhotos[key] || [];
          itemsPayload.push({ product: p.product, itemIndex: i, photos, notes: receivedNotes });
        }
      });

      const hasAnyPhotos = itemsPayload.some(it => (it.photos?.length || 0) > 0);

      if (!hasAnyPhotos) {
        toast({
          title: "Photos Required",
          description: "Please upload up to 4 photos for each product item.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Use the optimistic update function from the hook
      await markReceivedMulti(
        enquiryId,
        itemsPayload,
        receivedNotes,
        estimatedCost
      );

      setSelectedImage(null);
      setReceivedNotes("");
      setMultiPhotos({});
      setSelectedProductKey(null);
      setOpenDialogId(null); // Close the dialog - added from teammate's version

      toast({
        title: "Items Received!",
        description: "All items have been received and moved to service workflow. Check the Service module to continue.",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 5000,
      });

      if (enquiry) {
        toast({
          title: "WhatsApp Notification",
          description: `WhatsApp message sent to ${enquiry.customerName}: "We have received your items and moved them to service."`,
          className: "bg-blue-50 border-blue-200 text-blue-800",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark items as received",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const sendInvoice = (enquiry: Enquiry) => {
    // Here you would typically send invoice via WhatsApp/Email
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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Pickup Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage pickup schedules and collections from CRM enquiries
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : calculatedStats.scheduledPickups}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Scheduled Pickups
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : calculatedStats.assignedPickups}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Assigned Pickups
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
            placeholder="Search pickups"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Pickup Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Pickup Queue
        </h2>

        {enquiriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading pickup enquiries</span>
          </div>
        ) : enquiriesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading pickup enquiries</p>
              <p className="text-sm text-gray-500">{enquiriesError}</p>
            </div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No pickup enquiries found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or check if enquiries are in pickup stage</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {filteredEnquiries.map((enquiry) => (
              <Card
                key={enquiry.id}
                className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 relative"
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
                  <Badge
                    className={`${getStatusColor(
                      enquiry.pickupDetails?.status || "scheduled"
                    )} text-xs absolute top-3 right-3`}
                  >
                    {stringUtils.capitalizeWords(enquiry.pickupDetails?.status || "scheduled")}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* Display multiple products if available, otherwise fallback to single product */}
                  {enquiry.products && enquiry.products.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 font-medium">Products:</span>
                      <div className="flex flex-wrap gap-2">
                        {enquiry.products.map((product, index) => (
                          <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            <Package className="h-3 w-3" />
                            <span>{product.product}</span>
                            <span>({product.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Quantity: {enquiry.quantity}
                      </div>
                      <span className="text-gray-500 text-sm">{enquiry.product}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground break-words">
                      {enquiry.address}
                    </span>
                  </div>

                  {enquiry.pickupDetails?.scheduledTime && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground">
                        Scheduled: {enquiry.pickupDetails.scheduledTime}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">
                      Amount: ₹{enquiry.quotedAmount || 0}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {(!enquiry.pickupDetails || enquiry.pickupDetails?.status === "scheduled") && (
                    <Button
                      size="sm"
                      className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm"
                      onClick={() => handleAssignPickup(enquiry.id, "Staff Member")}
                    >
                      <User className="h-3 w-3 mr-1" />
                      Assign Pickup
                    </Button>
                  )}

                  {enquiry.pickupDetails?.status === "assigned" && (
                    <Dialog open={openDialogId === enquiry.id} onOpenChange={(open) => {
                      if (!open) {
                        setOpenDialogId(null);
                        // Reset form state when dialog closes - added from teammate's version
                        setSelectedImage(null);
                        setReceivedNotes("");
                        setMultiPhotos({});
                        setSelectedProductKey(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                          onClick={() => setOpenDialogId(enquiry.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Item Received
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Item Received - Move to Service</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-4">
                            <Label>Per-Item Photos (up to 4 per item)</Label>

                            {/* Multiple products support; fallback to single product/quantity */}
                            {(enquiry.products && enquiry.products.length > 0 ? enquiry.products : [{ product: enquiry.product, quantity: enquiry.quantity } as any]).map((p, pIdx) => (
                              <div key={`product-${pIdx}`} className="space-y-3 border rounded-md p-3">
                                <div className="text-sm font-medium text-foreground">{p.product} × {p.quantity || 1}</div>

                                {/* Item selector for this product - improved from teammate's version */}
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Select Item to Upload Photos</Label>
                                  <Select
                                    value={selectedProductKey && selectedProductKey.startsWith(p.product) ? selectedProductKey : undefined}
                                    onValueChange={(v) => setSelectedProductKey(v)}
                                  >
                                    <SelectTrigger className="h-8 w-48">
                                      <SelectValue placeholder="Choose item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: p.quantity || 1 }).map((_, idx) => {
                                        const key = `${p.product}-${idx + 1}`;
                                        return (
                                          <SelectItem key={key} value={key}>{p.product} — #{idx + 1}</SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Photo upload section - only show for selected item - improved from teammate's version */}
                                {selectedProductKey && selectedProductKey.startsWith(p.product) && (
                                  <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground">
                                      Upload photos for {selectedProductKey.split('-')[0]} — #{selectedProductKey.split('-')[1]}
                                    </div>
                                    {(() => {
                                      const itemIndex = parseInt(selectedProductKey.split('-')[1]);
                                      const key = selectedProductKey;
                                      const photos = multiPhotos[key] || [];
                                      const remaining = Math.max(0, 4 - photos.length);

                                      return (
                                        <div className="grid grid-cols-4 gap-2">
                                          {photos.map((ph, i) => (
                                            <img
                                              key={`ph-${i}`}
                                              src={ph}
                                              alt={`Item ${itemIndex} photo ${i + 1}`}
                                              className="h-16 w-full object-cover rounded border bg-gray-50"
                                            />
                                          ))}
                                          {Array.from({ length: remaining }).map((__, addIdx) => {
                                            const inputId = `item-photo-${enquiry.id}-${p.product}-${itemIndex}-${addIdx}`;
                                            return (
                                              <div key={`add-${addIdx}`} className="flex items-center justify-center">
                                                <Input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleItemPhotoUpload(e, p.product, itemIndex)}
                                                  className="hidden"
                                                  id={inputId}
                                                />
                                                <Label
                                                  htmlFor={inputId}
                                                  className="cursor-pointer flex items-center justify-center space-x-1 border border-dashed border-input bg-background px-2 py-1 text-xs ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md w-full h-16"
                                                >
                                                  <Camera className="h-3 w-3" />
                                                  <span>Add</span>
                                                </Label>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Remarks (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add any notes about the received item"
                              value={receivedNotes}
                              onChange={(e) => setReceivedNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <Button
                            onClick={() => handleItemReceived(enquiry.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={Object.values(multiPhotos).every(arr => (arr?.length || 0) === 0)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Item Received - Send to Service
                          </Button>
                          {Object.values(multiPhotos).every(arr => (arr?.length || 0) === 0) && (
                            <p className="text-xs text-muted-foreground text-center">
                              Please upload up to 4 photos for each product item
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
        )}
      </div>
    </div>
  );
}