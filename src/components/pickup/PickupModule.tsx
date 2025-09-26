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
  X,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Enquiry, PickupStatus, ServiceType } from "@/types";
import { imageUploadHelper } from "@/utils/localStorage";
import { usePickupEnquiries, usePickupStats } from "@/services/pickupApiService";
import { useToast } from "@/hooks/use-toast";
import { stringUtils } from "@/utils";

export function PickupModule() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [receivedNotes, setReceivedNotes] = useState("");
  const [multiPhotos, setMultiPhotos] = useState<Record<string, string[]>>({});
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});

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

  const handleItemPhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    product: string,
    itemIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const key = `${product}-${itemIndex}`;

      // Check if already at limit
      const existing = multiPhotos[key] || [];
      if (existing.length >= 4) {
        toast({
          title: "Photo Limit Reached",
          description: "Maximum 4 photos allowed per item",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Set uploading state
      setUploadingPhotos(prev => ({ ...prev, [key]: true }));

      try {
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);

        setMultiPhotos(prev => {
          const updated = [...existing, thumbnailData].slice(0, 4);
          return { ...prev, [key]: updated };
        });

        // Auto-select this product key if none selected
        if (!selectedProductKey) {
          setSelectedProductKey(key);
        }

        toast({
          title: "Photo Uploaded",
          description: `Photo ${existing.length + 1}/4 uploaded for ${product} #${itemIndex}`,
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 2000,
        });
      } catch (error) {
        console.error('Failed to process image:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setUploadingPhotos(prev => ({ ...prev, [key]: false }));
      }
    }

    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const removePhoto = (productKey: string, photoIndex: number) => {
    setMultiPhotos(prev => {
      const existing = prev[productKey] || [];
      const updated = existing.filter((_, idx) => idx !== photoIndex);

      if (updated.length === 0) {
        const { [productKey]: removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [productKey]: updated };
    });

    toast({
      title: "Photo Removed",
      description: "Photo has been removed successfully",
      className: "bg-blue-50 border-blue-200 text-blue-800",
      duration: 2000,
    });
  };

  const getProductPhotosCount = (product: string, quantity: number) => {
    let totalPhotos = 0;
    for (let i = 1; i <= quantity; i++) {
      const key = `${product}-${i}`;
      totalPhotos += (multiPhotos[key] || []).length;
    }
    return totalPhotos;
  };

  const resetDialog = () => {
    setSelectedImage(null);
    setReceivedNotes("");
    setMultiPhotos({});
    setSelectedProductKey(null);
    setUploadingPhotos({});
    setOpenDialogId(null);
  };

  const handleItemReceived = async (enquiryId: number) => {
    try {
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      const estimatedCost = enquiry?.quotedAmount || 0;

      const products = enquiry?.products && enquiry.products.length > 0
        ? enquiry.products
        : [{ product: enquiry?.product || '', quantity: enquiry?.quantity || 1 } as any];

      const itemsPayload: Array<{ product: string; itemIndex: number; photos: string[]; notes?: string }> = [];

      products.forEach(p => {
        for (let i = 1; i <= (p.quantity || 1); i++) {
          const key = `${p.product}-${i}`;
          const photos = multiPhotos[key] || [];
          itemsPayload.push({
            product: p.product,
            itemIndex: i,
            photos,
            notes: receivedNotes
          });
        }
      });

      const hasAnyPhotos = itemsPayload.some(it => (it.photos?.length || 0) > 0);

      if (!hasAnyPhotos) {
        toast({
          title: "Photos Required",
          description: "Please upload at least one photo for any product item.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      await markReceivedMulti(
        enquiryId,
        itemsPayload,
        receivedNotes,
        estimatedCost
      );

      resetDialog();

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
            placeholder="Search pickups by customer name, address, or product..."
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Loading pickup enquiries</p>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          </div>
        ) : enquiriesError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-2">Error loading pickup enquiries</p>
              <p className="text-sm text-gray-500">{enquiriesError}</p>
            </div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">No pickup enquiries found</p>
              <p className="text-sm text-gray-500">
                {searchTerm ? "Try adjusting your search terms" : "Check if enquiries are in pickup stage"}
              </p>
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
                  {enquiry.products && enquiry.products.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 font-medium">Products:</span>
                      <div className="flex flex-wrap gap-2">
                        {enquiry.products.map((product, index) => (
                          <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
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
                    <Dialog
                      open={openDialogId === enquiry.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          resetDialog();
                        }
                      }}
                    >
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
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <span>Item Received - Move to Service</span>
                          </DialogTitle>
                          <p className="text-sm text-muted-foreground">
                            Upload photos for each item and add any relevant notes before moving to service workflow.
                          </p>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Product Selection and Photo Upload */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium">Per-Item Photos (up to 4 per item)</Label>
                            </div>

                            {/* Products List */}
                            {(enquiry.products && enquiry.products.length > 0 ? enquiry.products : [{ product: enquiry.product, quantity: enquiry.quantity } as any]).map((p, pIdx) => (
                              <div key={`product-${pIdx}`} className="border rounded-lg p-4 bg-gray-50/50">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-foreground">{p.product}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {p.quantity || 1} item{(p.quantity || 1) > 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {getProductPhotosCount(p.product, p.quantity || 1)} photos uploaded
                                  </div>
                                </div>

                                {/* Item Selector */}
                                <div className="flex items-center gap-3 mb-3">
                                  <Label className="text-xs text-muted-foreground min-w-fit">
                                    Select Item:
                                  </Label>
                                  <Select
                                    value={selectedProductKey && selectedProductKey.startsWith(p.product) ? selectedProductKey : ""}
                                    onValueChange={(v) => setSelectedProductKey(v)}
                                  >
                                    <SelectTrigger className="h-9 flex-1">
                                      <SelectValue placeholder={`Choose ${p.product} item to upload photos`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: p.quantity || 1 }).map((_, idx) => {
                                        const key = `${p.product}-${idx + 1}`;
                                        const photoCount = (multiPhotos[key] || []).length;
                                        return (
                                          <SelectItem key={key} value={key} className="flex items-center justify-between">
                                            <span>{p.product} — {idx + 1}</span>
                                            {photoCount > 0 && (
                                              <Badge variant="secondary" className="ml-2 text-xs">
                                                {photoCount}/4 photos
                                              </Badge>
                                            )}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Photo Upload Grid - Show for selected item */}
                                {selectedProductKey && selectedProductKey.startsWith(p.product) && (
                                  <div className="space-y-3 bg-white rounded-md p-3 border">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm font-medium text-foreground">
                                        Upload photos for {selectedProductKey.split('-')[0]} — Item {selectedProductKey.split('-')[1]}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {(multiPhotos[selectedProductKey] || []).length}/4 photos
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                      {Array.from({ length: 4 }).map((__, slotIndex) => {
                                        const photos = multiPhotos[selectedProductKey] || [];
                                        const hasPhotoInSlot = slotIndex < photos.length;
                                        const itemIndex = parseInt(selectedProductKey.split('-')[1]);
                                        const inputId = `item-photo-${enquiry.id}-${p.product}-${itemIndex}-${slotIndex}`;
                                        const isUploading = uploadingPhotos[selectedProductKey];

                                        if (hasPhotoInSlot) {
                                          return (
                                            <div key={`photo-${slotIndex}`} className="relative group">
                                              <img
                                                src={photos[slotIndex]}
                                                alt={`Item ${itemIndex} photo ${slotIndex + 1}`}
                                                className="h-20 w-full object-cover rounded-md border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                                              />
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removePhoto(selectedProductKey, slotIndex)}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                                {slotIndex + 1}
                                              </div>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div key={`upload-${slotIndex}`} className="relative">
                                              <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleItemPhotoUpload(e, p.product, itemIndex)}
                                                className="hidden"
                                                id={inputId}
                                                disabled={isUploading}
                                              />
                                              <Label
                                                htmlFor={inputId}
                                                className={`cursor-pointer flex flex-col items-center justify-center space-y-1 border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 rounded-md h-20 w-full transition-all ${isUploading ? 'pointer-events-none opacity-50' : ''
                                                  }`}
                                              >
                                                {isUploading ? (
                                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                ) : (
                                                  <Camera className="h-4 w-4 text-gray-500" />
                                                )}
                                                <span className="text-xs text-gray-600 font-medium">
                                                  {isUploading ? 'Uploading...' : 'Add Photo'}
                                                </span>
                                              </Label>
                                            </div>
                                          );
                                        }
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Notes Section */}
                          <div className="space-y-3">
                            <Label htmlFor="notes" className="text-sm font-medium">
                              Additional Notes / Remarks (Optional)
                            </Label>
                            <Textarea
                              id="notes"
                              placeholder="Add any notes about the received items, their condition, or other relevant details..."
                              value={receivedNotes}
                              onChange={(e) => setReceivedNotes(e.target.value)}
                              rows={3}
                              className="resize-none"
                            />
                          </div>

                          {/* Submit Button */}
                          {/* Submit Button */}
                          <div className="pt-2 border-t">
                            <Button
                              onClick={() => handleItemReceived(enquiry.id)}
                              className="w-full bg-green-600 hover:bg-green-700 h-11"
                              disabled={
                                // Disabled if any product item has 0 photos
                                (enquiry.products || [{ product: enquiry.product, quantity: enquiry.quantity }]).some(
                                  (p) =>
                                    !Array.from({ length: p.quantity || 1 }).every(
                                      (_, idx) => (multiPhotos[`${p.product}-${idx + 1}`]?.length || 0) > 0
                                    )
                                )
                              }
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Move to Service
                            </Button>

                            {/* Validation Message */}
                            {(enquiry.products || [{ product: enquiry.product, quantity: enquiry.quantity }]).some(
                              (p) =>
                                !Array.from({ length: p.quantity || 1 }).every(
                                  (_, idx) => (multiPhotos[`${p.product}-${idx + 1}`]?.length || 0) > 0
                                )
                            ) && (
                                <div className="flex items-center justify-center mt-3 text-amber-600 bg-amber-50 rounded-md p-2">
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  <p className="text-xs font-medium">
                                    Please upload at least one photo for each product item to continue
                                  </p>
                                </div>
                              )}
                          </div>

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