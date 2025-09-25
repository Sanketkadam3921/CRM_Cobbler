import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, ArrowLeft, CheckCircle } from "lucide-react";
import { ServiceDetails, ServiceType } from "@/types";
import { imageUploadHelper } from "@/utils/localStorage";
import { serviceApiService } from "@/services/serviceApiService";

interface ServiceTypeDetailProps {
  enquiryId: number;
  serviceType: ServiceType;
  // Target specific product item (optional)
  productItemKey?: string; // format: `${product}-${itemIndex}`
  onBack: () => void;
  onServiceUpdated?: () => void;
}

export function ServiceTypeDetail({ enquiryId, serviceType, productItemKey, onBack, onServiceUpdated }: ServiceTypeDetailProps) {
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate states for preview and modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    const loadServiceDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await serviceApiService.getEnquiryServiceDetails(enquiryId);
        setServiceDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    loadServiceDetails();
  }, [enquiryId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setPreviewImage(thumbnailData);
      } catch (error) {
        console.error('Failed to process image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  const startService = async () => {
    if (!serviceDetails || !previewImage) return;

    try {
      // Find the service type ID
      // If productItemKey provided, match service by product/itemIndex
      const serviceTypeData = serviceDetails.serviceTypes?.find(s => {
        if (s.type !== serviceType) return false;
        if (!productItemKey) return true;
        const [p, idxStr] = productItemKey.split('-');
        const idx = parseInt(idxStr, 10);
        return (s as any).product === p && (s as any).itemIndex === idx;
      });
      if (!serviceTypeData?.id) {
        alert('Service type not found');
        return;
      }

      // Call API to start service
      await serviceApiService.startService(enquiryId, serviceTypeData.id, previewImage, notes);
      console.log('✅ Service started successfully');

      // Reset form - clear both preview and notes
      setPreviewImage(null);
      setNotes("");

      // Reset file input
      const fileInput = document.getElementById('before-photo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh data to show updated status
      const updatedDetails = await serviceApiService.getEnquiryServiceDetails(enquiryId);
      setServiceDetails(updatedDetails);

      // Notify parent component to refresh the main service list
      if (onServiceUpdated) {
        onServiceUpdated();
      }
    } catch (error) {
      console.error('Failed to start service:', error);
      alert('Failed to start service. Please try again.');
    }
  };

  const completeService = async () => {
    if (!serviceDetails || !previewImage) return;

    try {
      // Find the service type ID
      const serviceTypeData = serviceDetails.serviceTypes?.find(s => {
        if (s.type !== serviceType) return false;
        if (!productItemKey) return true;
        const [p, idxStr] = productItemKey.split('-');
        const idx = parseInt(idxStr, 10);
        return (s as any).product === p && (s as any).itemIndex === idx;
      });
      if (!serviceTypeData?.id) {
        alert('Service type not found');
        return;
      }

      // Call API to complete service
      await serviceApiService.completeService(enquiryId, serviceTypeData.id, previewImage, notes);
      console.log('✅ Service completed successfully');

      // Reset form - clear both preview and notes
      setPreviewImage(null);
      setNotes("");

      // Reset file input
      const fileInput = document.getElementById('after-photo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh data to show updated status
      const updatedDetails = await serviceApiService.getEnquiryServiceDetails(enquiryId);
      setServiceDetails(updatedDetails);

      // Notify parent component to refresh the main service list
      if (onServiceUpdated) {
        onServiceUpdated();
      }
    } catch (error) {
      console.error('Failed to complete service:', error);
      alert('Failed to complete service. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Service Queue
          </Button>
        </div>
      </div>
    );
  }

  if (!serviceDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Service details not found</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Service Queue
          </Button>
        </div>
      </div>
    );
  }

  // Find the specific service type (match product/item if provided)
  const serviceTypeData = serviceDetails.serviceTypes?.find(s => {
    if (s.type !== serviceType) return false;
    if (!productItemKey) return true;
    const [p, idxStr] = productItemKey.split('-');
    const idx = parseInt(idxStr, 10);
    return (s as any).product === p && (s as any).itemIndex === idx;
  });

  return (
    <div className="space-y-4 animate-fade-in p-2 sm:p-0">
      {/* Header - Mobile Optimized */}
      <div className="relative flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
          <Button variant="outline" size="sm" onClick={onBack} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              {serviceType}
            </h1>
            <p className="text-sm text-muted-foreground">
              {serviceDetails.customerName} - {serviceDetails.product}
            </p>
          </div>
        </div>

        {/* Top-right badge */}
        {serviceTypeData && (
          <Badge
            className={`${getStatusColor(
              serviceTypeData.status
            )} text-sm px-3 py-1 w-fit absolute top-0 right-0 sm:static`}
          >
            {capitalizeFirst(serviceTypeData.status)}
          </Badge>
        )}
      </div>


      {/* Compact Info - Mobile Optimized */}
      <Card className="p-4 bg-gradient-card border-0 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div className="space-y-1">
            <p><span className="font-medium">Status:</span> {capitalizeFirst(serviceTypeData?.status || 'pending')}</p>
            <p><span className="font-medium">Amount:</span> ₹{serviceDetails.quotedAmount || 0}</p>
          </div>
          <div className="space-y-1">
            {serviceTypeData?.startedAt && (
              <p><span className="font-medium">Started:</span> {new Date(serviceTypeData.startedAt).toLocaleDateString()}</p>
            )}
            {serviceTypeData?.completedAt && (
              <p><span className="font-medium">Completed:</span> {new Date(serviceTypeData.completedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Photos Section - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Before Photos (thumbnails) */}
        <Card className="p-4 bg-gradient-card border-0 shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-2">Before Photos</h3>
          {(() => {
            const items = (serviceDetails as any).itemPhotos as Array<any> | undefined;
            let beforeList: string[] = [];
            if (items && items.length > 0) {
              const sel = productItemKey
                ? items.find(it => `${it.product}-${it.itemIndex}` === productItemKey)
                : items[0];
              if (sel) {
                const legacy = Array.isArray((sel as any).photos) ? (sel as any).photos as string[] : undefined;
                const grouped = !legacy ? ((sel as any).photos || {}) as { before?: string[] } : undefined;
                beforeList = legacy || grouped?.before || [];
              }
            }
            return beforeList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {beforeList.map((src, idx) => (
                  <img
                    key={`bf-${idx}`}
                    src={src}
                    alt={`Before ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-md border bg-black cursor-pointer"
                    loading="lazy"
                    onClick={() => setModalImage(src)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No before photos</div>
            );
          })()}
        </Card>

        {/* After Photo (upload and preview) */}
        <Card className="p-4 bg-gradient-card border-0 shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-2">After Photo</h3>
          {(serviceTypeData as any)?.photos?.after?.[0] ? (
            <div className="space-y-2">
              <img
                src={(serviceTypeData as any).photos.after[0]}
                alt="After service"
                className="w-full h-48 sm:h-64 object-contain rounded-md border bg-black cursor-pointer"
                loading="lazy"
                onClick={() => setModalImage((serviceTypeData as any).photos.after[0])}
              />
            </div>
          ) : (
            <>
              <label
                htmlFor="after-photo"
                className="flex flex-col items-center justify-center text-center py-8 sm:py-6 text-muted-foreground border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/30 transition"
              >
                <Camera className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">Click to upload after photo</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="after-photo"
                />
              </label>
              {previewImage && (
                <div className="mt-2 flex items-center justify-center bg-gray-100 border rounded-md overflow-hidden">
                  <img
                    src={previewImage}
                    alt="After photo preview"
                    className="max-h-48 sm:max-h-64 w-auto object-contain rounded-md"
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Action Section - Mobile Optimized */}
      <Card className="p-4 bg-gradient-card border-0 shadow-soft">
        <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>

        {(serviceTypeData?.status === "pending" || serviceTypeData?.status === "in-progress") && (
          <div className="space-y-4">
            <div className="space-y-2">
              {previewImage && (
                <div className="mt-2 flex items-center justify-center bg-gray-100 border rounded-md overflow-hidden">
                  <img
                    src={previewImage}
                    alt="After photo preview"
                    className="max-h-48 sm:max-h-64 w-auto object-contain rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Work Notes (Optional)</Label>
              <Textarea
                placeholder="Add work notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <Button
              onClick={async () => {
                await completeService(); // your existing API call
                if (onBack) onBack();    // ✅ navigate back after completion
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-sm"
              disabled={!previewImage}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete Service
            </Button>
          </div>
        )}

        {serviceTypeData?.status === "done" && (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-semibold text-foreground mb-1">Service Completed!</p>
            <p className="text-xs text-muted-foreground">
              This service has been completed successfully.
            </p>
          </div>
        )}
      </Card>


      {/* Photo Viewer Modal - Mobile Optimized */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <img
              src={modalImage}
              alt="Full view"
              className="w-full max-h-[90vh] object-contain rounded-lg shadow-lg cursor-zoom-in"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-md hover:bg-black text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
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
}