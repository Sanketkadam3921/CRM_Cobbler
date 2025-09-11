// import { useState, useEffect } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   MapPin,
//   Clock,
//   User,
//   Package,
//   Truck,
//   Home,
//   Search,
//   Camera,
//   Upload,
//   Send,
//   CheckCircle,
//   PenTool,
// } from "lucide-react";
// import { Enquiry, DeliveryStatus, DeliveryMethod } from "@/types";
// import { enquiriesStorage, workflowHelpers, imageUploadHelper } from "@/utils/localStorage";

// export function DeliveryModule() {
//   const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [deliveryNotes, setDeliveryNotes] = useState("");
//   const [customerSignature, setCustomerSignature] = useState<string | null>(null);
//   const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod>("customer-pickup");
//   const [scheduledDateTime, setScheduledDateTime] = useState("");

//   // Load enquiries that are in delivery stage
//   useEffect(() => {
//     const loadDeliveryEnquiries = () => {
//       const deliveryEnquiries = workflowHelpers.getDeliveryEnquiries();
//       setEnquiries(deliveryEnquiries);
//     };
    
//     loadDeliveryEnquiries();
    
//     // Refresh data every 2 seconds to catch updates from other modules
//     const interval = setInterval(loadDeliveryEnquiries, 2000);
    
//     return () => clearInterval(interval);
//   }, []);

//   const readyForDelivery = enquiries.filter(
//     (e) => e.deliveryDetails?.status === "ready"
//   ).length;
//   const scheduledDeliveries = enquiries.filter(
//     (e) => e.deliveryDetails?.status === "scheduled"
//   ).length;
//   const outForDelivery = enquiries.filter(
//     (e) => e.deliveryDetails?.status === "out-for-delivery"
//   ).length;
//   const deliveredToday = enquiries.filter(
//     (e) => e.deliveryDetails?.status === "delivered"
//   ).length;

//   const filteredEnquiries = enquiries.filter(
//     (enquiry) =>
//       enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const getStatusColor = (status: DeliveryStatus) => {
//     switch (status) {
//       case "ready":
//         return "bg-blue-500 text-white";
//       case "scheduled":
//         return "bg-yellow-500 text-white";
//       case "out-for-delivery":
//         return "bg-purple-500 text-white";
//       case "delivered":
//         return "bg-green-500 text-white";
//       default:
//         return "bg-gray-500 text-white";
//     }
//   };

//   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       try {
//         const thumbnailData = await imageUploadHelper.handleImageUpload(file);
//         setSelectedImage(thumbnailData);
//       } catch (error) {
//         console.error('Failed to process image:', error);
//         alert('Failed to process image. Please try again.');
//       }
//     }
//   };

//   const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       try {
//         const thumbnailData = await imageUploadHelper.handleImageUpload(file);
//         setCustomerSignature(thumbnailData);
//       } catch (error) {
//         console.error('Failed to process signature:', error);
//         alert('Failed to process signature. Please try again.');
//       }
//     }
//   };

//   const scheduleDelivery = (enquiryId: number, method: DeliveryMethod, scheduledTime: string) => {
//     const updatedEnquiries = enquiries.map((enquiry) =>
//       enquiry.id === enquiryId
//         ? {
//             ...enquiry,
//             deliveryDetails: {
//               ...enquiry.deliveryDetails!,
//               status: "scheduled" as DeliveryStatus,
//               deliveryMethod: method,
//               scheduledTime,
//             },
//           }
//         : enquiry
//     );
    
//     setEnquiries(updatedEnquiries);
//     // Update in localStorage
//     const allEnquiries = enquiriesStorage.getAll();
//     const updatedAllEnquiries = allEnquiries.map((enquiry) => {
//       const updated = updatedEnquiries.find((u) => u.id === enquiry.id);
//       return updated || enquiry;
//     });
//     enquiriesStorage.save(updatedAllEnquiries);

//     // Reset form
//     setSelectedDeliveryMethod("customer-pickup");
//     setScheduledDateTime("");

//     // Send WhatsApp notification
//     const enquiry = enquiries.find((e) => e.id === enquiryId);
//     if (enquiry) {
//       alert(
//         `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} delivery has been scheduled for ${scheduledTime}."`
//       );
//     }
//   };

//   const markOutForDelivery = (enquiryId: number, assignedTo: string) => {
//     const updatedEnquiries = enquiries.map((enquiry) =>
//       enquiry.id === enquiryId
//         ? {
//             ...enquiry,
//             deliveryDetails: {
//               ...enquiry.deliveryDetails!,
//               status: "out-for-delivery" as DeliveryStatus,
//               assignedTo,
//             },
//           }
//         : enquiry
//     );
    
//     setEnquiries(updatedEnquiries);
//     // Update in localStorage
//     const allEnquiries = enquiriesStorage.getAll();
//     const updatedAllEnquiries = allEnquiries.map((enquiry) => {
//       const updated = updatedEnquiries.find((u) => u.id === enquiry.id);
//       return updated || enquiry;
//     });
//     enquiriesStorage.save(updatedAllEnquiries);

//     // Send WhatsApp notification
//     const enquiry = enquiries.find((e) => e.id === enquiryId);
//     if (enquiry) {
//       alert(
//         `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} is out for delivery. Expected delivery: ${enquiry.deliveryDetails?.scheduledTime}"`
//       );
//     }
//   };

//   const markDelivered = (enquiryId: number) => {
//     const currentTime = new Date().toISOString();
    
//     // Update in localStorage first
//     const allEnquiries = enquiriesStorage.getAll();
//     const updatedAllEnquiries = allEnquiries.map((enquiry) =>
//       enquiry.id === enquiryId
//         ? {
//             ...enquiry,
//             currentStage: "completed" as const,
//             deliveryDetails: {
//               ...enquiry.deliveryDetails!,
//               status: "delivered" as DeliveryStatus,
//               photos: {
//                 ...enquiry.deliveryDetails!.photos,
//                 afterPhoto: selectedImage || undefined,
//               },
//               customerSignature,
//               deliveryNotes,
//               deliveredAt: currentTime,
//             },
//           }
//         : enquiry
//     );
    
//     enquiriesStorage.save(updatedAllEnquiries);
    
//     // Refresh delivery enquiries (the item will disappear since it's now in completed stage)
//     const updatedDeliveryEnquiries = workflowHelpers.getDeliveryEnquiries();
//     setEnquiries(updatedDeliveryEnquiries);

//     // Reset form
//     setSelectedImage(null);
//     setCustomerSignature(null);
//     setDeliveryNotes("");

//     // Send completion WhatsApp - use the updated enquiry data
//     const updatedEnquiry = updatedAllEnquiries.find((e) => e.id === enquiryId);
//     if (updatedEnquiry) {
//       alert(
//         `WhatsApp sent to ${updatedEnquiry.customerName}!\n"Your ${updatedEnquiry.product} has been delivered successfully. Thank you for choosing our service!"`
//       );
//     }
    
//     console.log(`Item ${enquiryId} successfully moved to completed stage`);
//   };

//   return (
//     <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
//             Delivery Management
//           </h1>
//           <p className="text-sm sm:text-base text-muted-foreground">
//             Manage completed service deliveries and customer pickups
//           </p>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//         <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-lg sm:text-2xl font-bold text-foreground">
//                 {readyForDelivery}
//               </div>
//               <div className="text-xs sm:text-sm text-muted-foreground">
//                 Ready for Delivery
//               </div>
//             </div>
//             <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
//           </div>
//         </Card>
//         <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-lg sm:text-2xl font-bold text-foreground">
//                 {scheduledDeliveries}
//               </div>
//               <div className="text-xs sm:text-sm text-muted-foreground">
//                 Scheduled
//               </div>
//             </div>
//             <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
//           </div>
//         </Card>
//         <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-lg sm:text-2xl font-bold text-foreground">
//                 {outForDelivery}
//               </div>
//               <div className="text-xs sm:text-sm text-muted-foreground">
//                 Out for Delivery
//               </div>
//             </div>
//             <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
//           </div>
//         </Card>
//         <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="text-lg sm:text-2xl font-bold text-foreground">
//                 {deliveredToday}
//               </div>
//               <div className="text-xs sm:text-sm text-muted-foreground">
//                 Delivered Today
//               </div>
//             </div>
//             <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
//           </div>
//         </Card>
//       </div>

//       {/* Search */}
//       <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//           <Input
//             placeholder="Search deliveries by customer, address, product..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </Card>

//       {/* Delivery Items */}
//       <div className="space-y-4">
//         <h2 className="text-xl sm:text-2xl font-bold text-foreground">
//           Delivery Queue
//         </h2>
//         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
//           {filteredEnquiries.map((enquiry) => (
//             <Card
//               key={enquiry.id}
//               className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300"
//             >
//               <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
//                 <div className="flex-1 min-w-0">
//                   <h3 className="font-semibold text-foreground text-base sm:text-lg">
//                     {enquiry.customerName}
//                   </h3>
//                   <p className="text-sm text-muted-foreground">
//                     {enquiry.phone}
//                   </p>
//                 </div>
//                 <Badge
//                   className={`${getStatusColor(
//                     enquiry.deliveryDetails?.status || "ready"
//                   )} text-xs self-start`}
//                 >
//                   {enquiry.deliveryDetails?.status || "ready"}
//                 </Badge>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-start space-x-2">
//                   <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
//                   <span className="text-sm text-foreground break-words">
//                     {enquiry.address}
//                   </span>
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
//                   <span className="text-sm text-foreground">
//                     {enquiry.product} ({enquiry.quantity} items)
//                   </span>
//                 </div>

//                 {enquiry.deliveryDetails?.scheduledTime && (
//                   <div className="flex items-center space-x-2">
//                     <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
//                     <span className="text-sm text-foreground">
//                       Scheduled: {enquiry.deliveryDetails.scheduledTime}
//                     </span>
//                   </div>
//                 )}

//                 {enquiry.deliveryDetails?.assignedTo && (
//                   <div className="flex items-center space-x-2">
//                     <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
//                     <span className="text-sm text-foreground">
//                       Assigned: {enquiry.deliveryDetails.assignedTo}
//                     </span>
//                   </div>
//                 )}

//                 <div className="flex items-center space-x-2">
//                   <span className="text-sm font-semibold text-foreground">
//                     Amount: ₹{enquiry.finalAmount || enquiry.quotedAmount || 0}
//                   </span>
//                 </div>

//                 {/* DEBUG: Show what we have
//                 <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
//                   <div>DEBUG INFO:</div>
//                   <div>Service afterPhoto: {enquiry.serviceDetails?.overallPhotos?.afterPhoto ? 'EXISTS' : 'MISSING'}</div>
//                   <div>Delivery beforePhoto: {enquiry.deliveryDetails?.photos?.beforePhoto ? 'EXISTS' : 'MISSING'}</div>
//                   <div>Current Stage: {enquiry.currentStage}</div>
//                 </div> */}

//                 {/* Show service final photo as before photo */}
//                 {enquiry.deliveryDetails?.photos?.beforePhoto && (
//                   <div className="mt-3">
//                     <div className="text-xs text-muted-foreground mb-1">Service Completed Photo:</div>
//                     <img
//                       src={enquiry.deliveryDetails.photos.beforePhoto}
//                       alt="Service completed"
//                       className="w-full h-24 object-cover rounded-md border"
//                     />
//                   </div>
//                 )}

//                 {/* Fallback: Show service photo directly if delivery photo missing */}
//                 {!enquiry.deliveryDetails?.photos?.beforePhoto && enquiry.serviceDetails?.overallPhotos?.afterPhoto && (
//                   <div className="mt-3">
//                     <div className="text-xs text-muted-foreground mb-1">Service Final Photo (Direct):</div>
//                     <img
//                       src={enquiry.serviceDetails.overallPhotos.afterPhoto}
//                       alt="Service completed"
//                       className="w-full h-24 object-cover rounded-md border"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
//                 {enquiry.deliveryDetails?.status === "ready" && (
//                   <Dialog>
//                     <DialogTrigger asChild>
//                       <Button
//                         size="sm"
//                         className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm"
//                       >
//                         <Clock className="h-3 w-3 mr-1" />
//                         Schedule Delivery
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="sm:max-w-md">
//                       <DialogHeader>
//                         <DialogTitle>Schedule Delivery</DialogTitle>
//                       </DialogHeader>
//                       <div className="space-y-4">
//                         <div className="space-y-2">
//                           <Label>Delivery Method</Label>
//                           <Select onValueChange={(value) => setSelectedDeliveryMethod(value as DeliveryMethod)}>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select delivery method" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="customer-pickup">Customer Pickup</SelectItem>
//                               <SelectItem value="home-delivery">Home Delivery</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div className="space-y-2">
//                           <Label>Scheduled Time</Label>
//                           <Input 
//                             type="datetime-local" 
//                             value={scheduledDateTime}
//                             onChange={(e) => setScheduledDateTime(e.target.value)}
//                             min={new Date().toISOString().slice(0, 16)}   // 👈 restrict past dates
//                           />
//                         </div>
//                         <Button
//                           onClick={() => {
//                             if (scheduledDateTime) {
//                               scheduleDelivery(enquiry.id, selectedDeliveryMethod, scheduledDateTime);
//                             } else {
//                               alert("Please select a scheduled time");
//                             }
//                           }}
//                           className="w-full bg-gradient-primary hover:opacity-90"
//                           disabled={!scheduledDateTime}
//                         >
//                           Schedule Delivery
//                         </Button>
//                         {!scheduledDateTime && (
//                           <p className="text-xs text-muted-foreground text-center">
//                             Please select a scheduled time
//                           </p>
//                         )}
//                       </div>
//                     </DialogContent>
//                   </Dialog>
//                 )}

//                 {enquiry.deliveryDetails?.status === "scheduled" && (
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="text-xs sm:text-sm"
//                     onClick={() => markOutForDelivery(enquiry.id, "Delivery Person")}
//                   >
//                     <Truck className="h-3 w-3 mr-1" />
//                     Mark Out for Delivery
//                   </Button>
//                 )}

//                 {enquiry.deliveryDetails?.status === "out-for-delivery" && (
//                   <Dialog>
//                     <DialogTrigger asChild>
//                       <Button
//                         size="sm"
//                         className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
//                       >
//                         <CheckCircle className="h-3 w-3 mr-1" />
//                         Mark Delivered
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="sm:max-w-md">
//                       <DialogHeader>
//                         <DialogTitle>Confirm Delivery</DialogTitle>
//                       </DialogHeader>
//                       <div className="space-y-4">
//                         <div className="space-y-2">
//                           <Label>Delivery Proof Photo</Label>
//                           <div className="flex flex-col sm:flex-row gap-2">
//                             <Input
//                               type="file"
//                               accept="image/*"
//                               onChange={handleImageUpload}
//                               className="hidden"
//                               id={`delivery-photo-${enquiry.id}`}
//                             />
//                             <Label
//                               htmlFor={`delivery-photo-${enquiry.id}`}
//                               className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
//                             >
//                               <Camera className="h-4 w-4" />
//                               <span>Take Photo</span>
//                             </Label>
//                           </div>
//                           {selectedImage && (
//                             <div className="mt-2">
//                               <img
//                                 src={selectedImage}
//                                 alt="Delivery proof"
//                                 className="w-full h-32 object-cover rounded-md border"
//                               />
//                             </div>
//                           )}
//                         </div>

//                         <div className="space-y-2">
//                           <Label>Customer Signature</Label>
//                           <Input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleSignatureUpload}
//                             className="hidden"
//                             id={`signature-${enquiry.id}`}
//                           />
//                           <Label
//                             htmlFor={`signature-${enquiry.id}`}
//                             className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md"
//                           >
//                             <PenTool className="h-4 w-4" />
//                             <span>Upload Signature</span>
//                           </Label>
//                           {customerSignature && (
//                             <div className="mt-2">
//                               <img
//                                 src={customerSignature}
//                                 alt="Customer signature"
//                                 className="w-full h-20 object-contain rounded-md border"
//                               />
//                             </div>
//                           )}
//                         </div>

//                         <div className="space-y-2">
//                           <Label htmlFor="delivery-notes">
//                             Delivery Notes (Optional)
//                           </Label>
//                           <Textarea
//                             id="delivery-notes"
//                             placeholder="Any notes about the delivery..."
//                             value={deliveryNotes}
//                             onChange={(e) => setDeliveryNotes(e.target.value)}
//                             rows={3}
//                           />
//                         </div>

//                         <Button
//                           onClick={() => markDelivered(enquiry.id)}
//                           className="w-full bg-green-600 hover:bg-green-700"
//                           disabled={!selectedImage}
//                         >
//                           <CheckCircle className="h-4 w-4 mr-2" />
//                           Confirm Delivery
//                         </Button>
//                         {!selectedImage && (
//                           <p className="text-xs text-muted-foreground text-center">
//                             Please upload a delivery proof photo to continue
//                           </p>
//                         )}
//                       </div>
//                     </DialogContent>
//                   </Dialog>
//                 )}
//               </div>
//             </Card>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
// import React, { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import { Textarea } from '@/components/ui/textarea';
// import { Clock, Package, Truck, CheckCircle, Camera, Search, Phone, Navigation } from 'lucide-react';
// import { toast } from 'sonner';

// // REMOVED: localStorage-based imports - replacing with backend API integration
// // import { enquiriesStorage } from '@/utils/enquiriesStorage';
// // import { workflowHelpers } from '@/utils/workflowHelpers';

// // ADDED: Backend API integration hooks and services - replaces localStorage usage
// import { useDeliveryEnquiries, useDeliveryStats } from '@/services/deliveryApiService';
// import { DeliveryEnquiry, DeliveryMethod } from '@/types';

// // Component for capturing delivery proof photo
// const DeliveryPhotoCapture: React.FC<{
//   onPhotoCapture: (photoData: string) => void;
//   label: string;
//   required?: boolean;
// }> = ({ onPhotoCapture, label, required = false }) => {
//   const [photoData, setPhotoData] = useState<string>('');

//   // Log photo capture actions
//   const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
//     console.log('📸 DELIVERY UI: Photo capture initiated for:', label);
    
//     const file = event.target.files?.[0];
//     if (file) {
//       console.log('📸 DELIVERY UI: Photo file selected:', { 
//         name: file.name, 
//         size: file.size, 
//         type: file.type 
//       });
      
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const result = e.target?.result as string;
//         console.log('📸 DELIVERY UI: Photo converted to base64 successfully for:', label);
//         setPhotoData(result);
//         onPhotoCapture(result);
//       };
//       reader.onerror = (error) => {
//         console.error('❌ DELIVERY UI: Failed to convert photo to base64:', error);
//         toast.error('Failed to process photo. Please try again.');
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <Label htmlFor={`photo-${label}`}>
//         {label} {required && <span className="text-red-500">*</span>}
//       </Label>
//       <div className="flex items-center space-x-2">
//         <Input
//           id={`photo-${label}`}
//           type="file"
//           accept="image/*"
//           onChange={handlePhotoCapture}
//           className="flex-1"
//         />
//         <Camera className="h-4 w-4 text-gray-500" />
//       </div>
//       {photoData && (
//         <div className="mt-2">
//           <img 
//             src={photoData} 
//             alt={label} 
//             className="w-20 h-20 object-cover rounded-lg border"
//           />
//           <p className="text-sm text-green-600 mt-1">Photo captured ✓</p>
//         </div>
//       )}
//     </div>
//   );
// };

// // Main delivery module component
// export const DeliveryModule: React.FC = () => {
//   // REMOVED: Manual state management and localStorage usage
//   // const [deliveryEnquiries, setDeliveryEnquiries] = useState<DeliveryEnquiry[]>([]);
//   // const [stats, setStats] = useState({...});
//   // const [loading, setLoading] = useState(true);
  
//   // ADDED: Backend API hooks - replaces manual state management and localStorage
//   const { 
//     enquiries: deliveryEnquiries, 
//     loading, 
//     error, 
//     scheduleDelivery, 
//     markOutForDelivery, 
//     completeDelivery 
//   } = useDeliveryEnquiries(200000); // Poll every 2 seconds
  
//   const { stats } = useDeliveryStats(500000); // Poll stats every 5 seconds

//   // UI state management (unchanged)
//   const [searchTerm, setSearchTerm] = useState('');
//   const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
//   const [selectedEnquiry, setSelectedEnquiry] = useState<DeliveryEnquiry | null>(null);
//   const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('customer-pickup');
//   const [scheduledTime, setScheduledTime] = useState('');
//   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
//   const [deliveryProofPhoto, setDeliveryProofPhoto] = useState('');
//   const [customerSignature, setCustomerSignature] = useState('');
//   const [deliveryNotes, setDeliveryNotes] = useState('');

//   // REMOVED: Manual polling with setInterval - replaced by useDeliveryEnquiries hook
//   // useEffect(() => {
//   //   const loadData = () => { ... localStorage operations ... };
//   //   loadData();
//   //   const interval = setInterval(loadData, 2000);
//   //   return () => clearInterval(interval);
//   // }, []);

//   // Log component mount and state changes
//   React.useEffect(() => {
//     console.log('🚀 DELIVERY MODULE: Component mounted');
//     console.log('📊 DELIVERY MODULE: Initial delivery enquiries count:', deliveryEnquiries.length);
//     console.log('📈 DELIVERY MODULE: Initial stats:', stats);
//   }, []);

//   React.useEffect(() => {
//     console.log('🔄 DELIVERY MODULE: Delivery enquiries updated, count:', deliveryEnquiries.length);
//   }, [deliveryEnquiries]);

//   React.useEffect(() => {
//     console.log('📊 DELIVERY MODULE: Stats updated:', stats);
//   }, [stats]);

//   // Filter enquiries based on search term
//   const filteredEnquiries = deliveryEnquiries.filter(enquiry =>
//     enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     enquiry.phone.includes(searchTerm) ||
//     enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Handle schedule delivery dialog
//   const handleScheduleDelivery = (enquiry: DeliveryEnquiry) => {
//     console.log('🔄 DELIVERY UI: User clicked Schedule Delivery for enquiry:', enquiry.id);
//     setSelectedEnquiry(enquiry);
//     setDeliveryMethod('customer-pickup'); // Default value
//     setScheduledTime('');
//     setScheduleDialogOpen(true);
//     console.log('✅ DELIVERY UI: Schedule delivery dialog opened');
//   };

//   // Handle delivery method change
//   const handleDeliveryMethodChange = (method: DeliveryMethod) => {
//     console.log('🔄 DELIVERY UI: User changed delivery method to:', method);
//     setDeliveryMethod(method);
//   };

//   // Handle scheduled time change
//   const handleScheduledTimeChange = (time: string) => {
//     console.log('🔄 DELIVERY UI: User set scheduled time to:', time);
//     setScheduledTime(time);
//   };

//   // Submit schedule delivery
//   const handleSubmitSchedule = async () => {
//     if (!selectedEnquiry || !scheduledTime) {
//       console.log('❌ DELIVERY UI: Schedule submission failed - missing data:', { 
//         enquiryId: selectedEnquiry?.id, 
//         scheduledTime 
//       });
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     try {
//       console.log('🔄 DELIVERY UI: Submitting schedule delivery for enquiry:', selectedEnquiry.id, {
//         deliveryMethod,
//         scheduledTime
//       });

//       // ADDED: Backend API call - replaces localStorage update
//       await scheduleDelivery(selectedEnquiry.id, deliveryMethod, scheduledTime);

//       console.log('✅ DELIVERY UI: Delivery scheduled successfully');
//       setScheduleDialogOpen(false);
//       setSelectedEnquiry(null);
//       setScheduledTime('');
      
//       // Show WhatsApp notification alert
//       const customerName = selectedEnquiry.customerName;
//       const methodText = deliveryMethod === 'customer-pickup' ? 'customer pickup' : 'home delivery';
//       const timeFormatted = new Date(scheduledTime).toLocaleString();
      
//       console.log('📱 DELIVERY UI: Showing WhatsApp notification for scheduled delivery');
//       toast.success(
//         `Delivery scheduled! WhatsApp notification sent to ${customerName} for ${methodText} at ${timeFormatted}`,
//         { duration: 5000 }
//       );
//     } catch (error) {
//       console.error('❌ DELIVERY UI: Failed to schedule delivery:', error);
//       toast.error('Failed to schedule delivery. Please try again.');
//     }
//   };

//   // Handle mark out for delivery
//   const handleMarkOutForDelivery = async (enquiry: DeliveryEnquiry) => {
//     console.log('🔄 DELIVERY UI: User clicked Mark Out for Delivery for enquiry:', enquiry.id);
    
//     const assignedTo = prompt('Enter delivery person name:');
//     if (!assignedTo) {
//       console.log('❌ DELIVERY UI: Mark out for delivery cancelled - no delivery person assigned');
//       return;
//     }

//     try {
//       console.log('🔄 DELIVERY UI: Marking out for delivery, assigned to:', assignedTo);
      
//       // ADDED: Backend API call - replaces localStorage update
//       await markOutForDelivery(enquiry.id, assignedTo);
      
//       console.log('✅ DELIVERY UI: Marked as out for delivery successfully');
      
//       // Show WhatsApp notification alert
//       console.log('📱 DELIVERY UI: Showing WhatsApp notification for out-for-delivery');
//       toast.success(
//         `Marked as out for delivery! WhatsApp notification sent to ${enquiry.customerName} - assigned to ${assignedTo}`,
//         { duration: 5000 }
//       );
//     } catch (error) {
//       console.error('❌ DELIVERY UI: Failed to mark as out for delivery:', error);
//       toast.error('Failed to mark as out for delivery. Please try again.');
//     }
//   };

//   // Handle mark delivered dialog
//   const handleMarkDelivered = (enquiry: DeliveryEnquiry) => {
//     console.log('🔄 DELIVERY UI: User clicked Mark Delivered for enquiry:', enquiry.id);
//     setSelectedEnquiry(enquiry);
//     setDeliveryProofPhoto('');
//     setCustomerSignature('');
//     setDeliveryNotes('');
//     setConfirmDialogOpen(true);
//     console.log('✅ DELIVERY UI: Confirm delivery dialog opened');
//   };

//   // Submit delivery completion
//   const handleConfirmDelivery = async () => {
//     if (!selectedEnquiry || !deliveryProofPhoto) {
//       console.log('❌ DELIVERY UI: Delivery completion failed - missing required data:', { 
//         enquiryId: selectedEnquiry?.id, 
//         hasProofPhoto: !!deliveryProofPhoto 
//       });
//       toast.error('Please capture delivery proof photo');
//       return;
//     }

//     try {
//       console.log('🔄 DELIVERY UI: Submitting delivery completion for enquiry:', selectedEnquiry.id, {
//         hasProofPhoto: !!deliveryProofPhoto,
//         hasSignature: !!customerSignature,
//         hasNotes: !!deliveryNotes
//       });

//       // ADDED: Backend API call - replaces localStorage update and stage transition
//       await completeDelivery(selectedEnquiry.id, deliveryProofPhoto, customerSignature, deliveryNotes);

//       console.log('✅ DELIVERY UI: Delivery completed successfully');
//       setConfirmDialogOpen(false);
//       setSelectedEnquiry(null);
//       setDeliveryProofPhoto('');
//       setCustomerSignature('');
//       setDeliveryNotes('');
      
//       // Show WhatsApp completion notification
//       console.log('📱 DELIVERY UI: Showing WhatsApp notification for delivery completion');
//       toast.success(
//         `Delivery completed! WhatsApp confirmation sent to ${selectedEnquiry.customerName}`,
//         { duration: 5000 }
//       );
//     } catch (error) {
//       console.error('❌ DELIVERY UI: Failed to complete delivery:', error);
//       toast.error('Failed to complete delivery. Please try again.');
//     }
//   };

//   // Status badge component
//   const getStatusBadge = (status: string) => {
//     const statusConfig = {
//       ready: { label: 'Ready for Delivery', variant: 'default' as const, icon: Package },
//       scheduled: { label: 'Scheduled', variant: 'secondary' as const, icon: Clock },
//       'out-for-delivery': { label: 'Out for Delivery', variant: 'destructive' as const, icon: Truck },
//       delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle }
//     };

//     const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ready;
//     const Icon = config.icon;

//     return (
//       <Badge variant={config.variant} className="flex items-center gap-1">
//         <Icon className="h-3 w-3" />
//         {config.label}
//       </Badge>
//     );
//   };

//   // Show loading state
//   if (loading) {
//     console.log('⏳ DELIVERY UI: Showing loading state');
//     return (
//       <div className="p-6">
//         <div className="flex items-center justify-center h-64">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//             <p className="mt-2 text-gray-600">Loading delivery enquiries...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error) {
//     console.log('❌ DELIVERY UI: Showing error state:', error);
//     return (
//       <div className="p-6">
//         <div className="text-center">
//           <p className="text-red-600">Error: {error}</p>
//           <Button onClick={() => window.location.reload()} className="mt-2">
//             Retry
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   console.log('🎨 DELIVERY UI: Rendering delivery module with', filteredEnquiries.length, 'filtered enquiries');

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header with statistics - UNCHANGED UI but data from backend */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold">Delivery Management</h1>
//       </div>

//       {/* Statistics Cards - UNCHANGED UI but data from backend stats hook */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center">
//               <Package className="h-8 w-8 text-blue-600" />
//               <div className="ml-3">
//                 <p className="text-sm font-medium text-gray-500">Ready for Delivery</p>
//                 <p className="text-2xl font-bold">{stats.readyForDelivery}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center">
//               <Clock className="h-8 w-8 text-orange-600" />
//               <div className="ml-3">
//                 <p className="text-sm font-medium text-gray-500">Scheduled</p>
//                 <p className="text-2xl font-bold">{stats.scheduledDeliveries}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center">
//               <Truck className="h-8 w-8 text-red-600" />
//               <div className="ml-3">
//                 <p className="text-sm font-medium text-gray-500">Out for Delivery</p>
//                 <p className="text-2xl font-bold">{stats.outForDelivery}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center">
//               <CheckCircle className="h-8 w-8 text-green-600" />
//               <div className="ml-3">
//                 <p className="text-sm font-medium text-gray-500">Delivered Today</p>
//                 <p className="text-2xl font-bold">{stats.deliveredToday}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Search and filters - UNCHANGED UI */}
//       <div className="flex items-center space-x-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//           <Input
//             placeholder="Search by customer name, phone, or product..."
//             value={searchTerm}
//             onChange={(e) => {
//               console.log('🔍 DELIVERY UI: User searching for:', e.target.value);
//               setSearchTerm(e.target.value);
//             }}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Delivery enquiries list - UNCHANGED UI structure but data from backend */}
//       <div className="space-y-4">
//         {filteredEnquiries.length === 0 ? (
//           <Card>
//             <CardContent className="pt-6">
//               <div className="text-center py-8">
//                 <Package className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery enquiries</h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   {searchTerm ? 'No enquiries match your search criteria.' : 'No enquiries are currently in delivery stage.'}
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         ) : (
//           filteredEnquiries.map((enquiry) => {
//             console.log('🎨 DELIVERY UI: Rendering enquiry card:', enquiry.id);
//             return (
//               <Card key={enquiry.id} className="hover:shadow-md transition-shadow">
//                 <CardHeader className="pb-3">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-3">
//                       <div>
//                         <CardTitle className="text-lg">{enquiry.customerName}</CardTitle>
//                         <p className="text-sm text-gray-500">ID: {enquiry.id}</p>
//                       </div>
//                     </div>
//                     {getStatusBadge(enquiry.deliveryDetails?.status || 'ready')}
//                   </div>
//                 </CardHeader>
                
//                 <CardContent className="space-y-4">
//                   {/* Customer details */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                     <div className="flex items-center space-x-2">
//                       <Phone className="h-4 w-4 text-gray-400" />
//                       <span>{enquiry.phone}</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Navigation className="h-4 w-4 text-gray-400" />
//                       <span className="truncate">{enquiry.address}</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Package className="h-4 w-4 text-gray-400" />
//                       <span>{enquiry.product} x{enquiry.quantity}</span>
//                     </div>
//                   </div>

//                   <Separator />

//                   {/* Service completed photo and amount */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <Label className="text-sm font-medium">Service Completed Photo</Label>
//                       {enquiry.deliveryDetails?.photos?.beforePhoto || enquiry.serviceDetails?.overallPhotos?.afterPhoto ? (
//                         <img
//                           src={enquiry.deliveryDetails?.photos?.beforePhoto || enquiry.serviceDetails?.overallPhotos?.afterPhoto}
//                           alt="Service completed"
//                           className="mt-2 w-full h-32 object-cover rounded-lg border"
//                         />
//                       ) : (
//                         <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
//                           <p className="text-sm text-gray-500">No photo available</p>
//                         </div>
//                       )}
//                     </div>
                    
//                     <div>
//                       <Label className="text-sm font-medium">Final Amount</Label>
//                       <p className="text-2xl font-bold text-green-600 mt-2">
//                         ₹{enquiry.finalAmount?.toLocaleString() || 0}
//                       </p>
                      
//                       {enquiry.deliveryDetails?.scheduledTime && (
//                         <div className="mt-4">
//                           <Label className="text-sm font-medium">Scheduled Time</Label>
//                           <p className="text-sm text-gray-600">
//                             {new Date(enquiry.deliveryDetails.scheduledTime).toLocaleString()}
//                           </p>
//                         </div>
//                       )}
                      
//                       {enquiry.deliveryDetails?.assignedTo && (
//                         <div className="mt-2">
//                           <Label className="text-sm font-medium">Assigned To</Label>
//                           <p className="text-sm text-gray-600">{enquiry.deliveryDetails.assignedTo}</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <Separator />

//                   {/* Action buttons based on status - UNCHANGED logic but with backend API calls */}
//                   <div className="flex items-center justify-end space-x-2">
//                     {enquiry.deliveryDetails?.status === 'ready' && (
//                       <Button 
//                         onClick={() => {
//                           console.log('🔄 DELIVERY UI: User clicked Schedule Delivery button for enquiry:', enquiry.id);
//                           handleScheduleDelivery(enquiry);
//                         }}
//                         className="flex items-center space-x-2"
//                       >
//                         <Clock className="h-4 w-4" />
//                         <span>Schedule Delivery</span>
//                       </Button>
//                     )}
                    
//                     {enquiry.deliveryDetails?.status === 'scheduled' && (
//                       <Button 
//                         onClick={() => {
//                           console.log('🔄 DELIVERY UI: User clicked Mark Out for Delivery button for enquiry:', enquiry.id);
//                           handleMarkOutForDelivery(enquiry);
//                         }}
//                         variant="outline"
//                         className="flex items-center space-x-2"
//                       >
//                         <Truck className="h-4 w-4" />
//                         <span>Mark Out for Delivery</span>
//                       </Button>
//                     )}
                    
//                     {enquiry.deliveryDetails?.status === 'out-for-delivery' && (
//                       <Button 
//                         onClick={() => {
//                           console.log('🔄 DELIVERY UI: User clicked Mark Delivered button for enquiry:', enquiry.id);
//                           handleMarkDelivered(enquiry);
//                         }}
//                         variant="default"
//                         className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
//                       >
//                         <CheckCircle className="h-4 w-4" />
//                         <span>Mark Delivered</span>
//                       </Button>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })
//         )}
//       </div>

//       {/* Schedule Delivery Dialog - UNCHANGED UI */}
//       <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Schedule Delivery</DialogTitle>
//           </DialogHeader>
          
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="customer">Customer</Label>
//               <Input 
//                 id="customer" 
//                 value={selectedEnquiry?.customerName || ''} 
//                 disabled 
//                 className="bg-gray-50"
//               />
//             </div>
            
//             <div>
//               <Label htmlFor="delivery-method">Delivery Method</Label>
//               <Select 
//                 value={deliveryMethod} 
//                 onValueChange={(value) => handleDeliveryMethodChange(value as DeliveryMethod)}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="customer-pickup">Customer Pickup</SelectItem>
//                   <SelectItem value="home-delivery">Home Delivery</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
            
//             <div>
//               <Label htmlFor="scheduled-time">Scheduled Date & Time</Label>
//               <Input
//                 id="scheduled-time"
//                 type="datetime-local"
//                 value={scheduledTime}
//                 onChange={(e) => handleScheduledTimeChange(e.target.value)}
//                 min={new Date().toISOString().slice(0, 16)}
//               />
//             </div>
//           </div>
          
//           <DialogFooter>
//             <Button 
//               variant="outline" 
//               onClick={() => {
//                 console.log('🔄 DELIVERY UI: User cancelled schedule delivery dialog');
//                 setScheduleDialogOpen(false);
//               }}
//             >
//               Cancel
//             </Button>
//             <Button 
//               onClick={() => {
//                 console.log('🔄 DELIVERY UI: User clicked Schedule Delivery submit button');
//                 handleSubmitSchedule();
//               }}
//               disabled={!scheduledTime}
//             >
//               Schedule Delivery
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Confirm Delivery Dialog - UNCHANGED UI */}
//       <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
//         <DialogContent className="max-w-md">
//           <DialogHeader>
//             <DialogTitle>Confirm Delivery</DialogTitle>
//           </DialogHeader>
          
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="customer-confirm">Customer</Label>
//               <Input 
//                 id="customer-confirm" 
//                 value={selectedEnquiry?.customerName || ''} 
//                 disabled 
//                 className="bg-gray-50"
//               />
//             </div>
            
//             <DeliveryPhotoCapture
//               onPhotoCapture={(photoData) => {
//                 console.log('📸 DELIVERY UI: Delivery proof photo captured');
//                 setDeliveryProofPhoto(photoData);
//               }}
//               label="Delivery Proof Photo"
//               required
//             />
            
//             <DeliveryPhotoCapture
//               onPhotoCapture={(photoData) => {
//                 console.log('📸 DELIVERY UI: Customer signature captured');
//                 setCustomerSignature(photoData);
//               }}
//               label="Customer Signature"
//             />
            
//             <div>
//               <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
//               <Textarea
//                 id="delivery-notes"
//                 placeholder="Any additional notes about the delivery..."
//                 value={deliveryNotes}
//                 onChange={(e) => {
//                   console.log('🔄 DELIVERY UI: User updated delivery notes');
//                   setDeliveryNotes(e.target.value);
//                 }}
//                 className="mt-1"
//               />
//             </div>
//           </div>
          
//           <DialogFooter>
//             <Button 
//               variant="outline" 
//               onClick={() => {
//                 console.log('🔄 DELIVERY UI: User cancelled confirm delivery dialog');
//                 setConfirmDialogOpen(false);
//               }}
//             >
//               Cancel
//             </Button>
//             <Button 
//               onClick={() => {
//                 console.log('🔄 DELIVERY UI: User clicked Confirm Delivery submit button');
//                 handleConfirmDelivery();
//               }}
//               disabled={!deliveryProofPhoto}
//               className="bg-green-600 hover:bg-green-700"
//             >
//               Confirm Delivery
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };


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
  Truck,
  Home,
  Search,
  Camera,
  Upload,
  Send,
  CheckCircle,
  PenTool,
} from "lucide-react";
import { Enquiry, DeliveryStatus, DeliveryMethod } from "@/types";

// ADDED: Backend API integration hooks and services - replaces localStorage usage
import { useDeliveryEnquiries, useDeliveryStats } from "@/services/deliveryApiService";
// REMOVED: localStorage-based imports
// import { enquiriesStorage, workflowHelpers, imageUploadHelper } from "@/utils/localStorage";

// ADDED: Image upload helper for backend API
const imageUploadHelper = {
  handleImageUpload: async (file: File): Promise<string> => {
    console.log('📸 DELIVERY UI: Processing image upload for backend API:', file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('📸 DELIVERY UI: Image converted to base64 successfully');
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error('❌ DELIVERY UI: Failed to process image:', error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }
};

export function DeliveryModule() {
  // ADDED: Backend API hooks - replaces manual state management and localStorage
  const { 
    enquiries, 
    loading, 
    error, 
    scheduleDelivery: apiScheduleDelivery, 
    markOutForDelivery: apiMarkOutForDelivery, 
    completeDelivery: apiCompleteDelivery 
  } = useDeliveryEnquiries(200000); // Poll every 2 seconds
  
  const { stats } = useDeliveryStats(500000); // Poll stats every 5 seconds

  // Original UI state - UNCHANGED
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod>("customer-pickup");
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
    console.log('🚀 DELIVERY MODULE: Component mounted with backend API integration');
    console.log('📊 DELIVERY MODULE: Initial delivery enquiries count:', enquiries.length);
  }, []);

  useEffect(() => {
    console.log('🔄 DELIVERY MODULE: Enquiries updated from backend, count:', enquiries.length);
  }, [enquiries]);

  // Original stats calculations using backend data - PRESERVED original logic
  const readyForDelivery = stats?.readyForDelivery ?? enquiries.filter(
    (e) => e.deliveryDetails?.status === "ready"
  ).length;
  const scheduledDeliveries = stats?.scheduledDeliveries ?? enquiries.filter(
    (e) => e.deliveryDetails?.status === "scheduled"
  ).length;
  const outForDelivery = stats?.outForDelivery ?? enquiries.filter(
    (e) => e.deliveryDetails?.status === "out-for-delivery"
  ).length;
  const deliveredToday = stats?.deliveredToday ?? enquiries.filter(
    (e) => e.deliveryDetails?.status === "delivered"
  ).length;

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
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log('📸 DELIVERY UI: Image upload initiated for delivery proof');
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setSelectedImage(thumbnailData);
        console.log('✅ DELIVERY UI: Image upload successful');
      } catch (error) {
        console.error('❌ DELIVERY UI: Failed to process image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  // Original signature upload handler with backend API integration
  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log('📸 DELIVERY UI: Signature upload initiated');
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setCustomerSignature(thumbnailData);
        console.log('✅ DELIVERY UI: Signature upload successful');
      } catch (error) {
        console.error('❌ DELIVERY UI: Failed to process signature:', error);
        alert('Failed to process signature. Please try again.');
      }
    }
  };

  // Modified schedule delivery function with backend API integration
  const scheduleDelivery = async (enquiryId: number, method: DeliveryMethod, scheduledTime: string) => {
    try {
      console.log('🔄 DELIVERY UI: Scheduling delivery via backend API:', {
        enquiryId,
        method,
        scheduledTime
      });

      // ADDED: Backend API call - replaces localStorage update
      await apiScheduleDelivery(enquiryId, method, scheduledTime);

      // Reset form - UNCHANGED
      setSelectedDeliveryMethod("customer-pickup");
      setScheduledDateTime("");

      // Original WhatsApp notification - UNCHANGED
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        console.log('📱 DELIVERY UI: Showing WhatsApp notification for scheduled delivery');
        alert(
          `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} delivery has been scheduled for ${scheduledTime}."`
        );
      }

      console.log('✅ DELIVERY UI: Delivery scheduled successfully via backend API');
    } catch (error) {
      console.error('❌ DELIVERY UI: Failed to schedule delivery:', error);
      alert('Failed to schedule delivery. Please try again.');
    }
  };

  // Modified mark out for delivery function with backend API integration
  const markOutForDelivery = async (enquiryId: number, assignedTo: string) => {
    try {
      console.log('🔄 DELIVERY UI: Marking out for delivery via backend API:', {
        enquiryId,
        assignedTo
      });

      // ADDED: Backend API call - replaces localStorage update
      await apiMarkOutForDelivery(enquiryId, assignedTo);

      // Original WhatsApp notification - UNCHANGED
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        console.log('📱 DELIVERY UI: Showing WhatsApp notification for out-for-delivery');
        alert(
          `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} is out for delivery. Expected delivery: ${enquiry.deliveryDetails?.scheduledTime}"`
        );
      }

      console.log('✅ DELIVERY UI: Marked as out for delivery successfully via backend API');
    } catch (error) {
      console.error('❌ DELIVERY UI: Failed to mark as out for delivery:', error);
      alert('Failed to mark as out for delivery. Please try again.');
    }
  };

  // Modified mark delivered function with backend API integration
  const markDelivered = async (enquiryId: number) => {
    try {
      console.log('🔄 DELIVERY UI: Marking as delivered via backend API:', {
        enquiryId,
        hasImage: !!selectedImage,
        hasSignature: !!customerSignature,
        hasNotes: !!deliveryNotes
      });

      // ADDED: Backend API call - replaces localStorage update and stage transition
      await apiCompleteDelivery(enquiryId, selectedImage || '', customerSignature || '', deliveryNotes);

      // Reset form - UNCHANGED
      setSelectedImage(null);
      setCustomerSignature(null);
      setDeliveryNotes("");

      // Original completion WhatsApp notification - UNCHANGED
      const enquiry = enquiries.find((e) => e.id === enquiryId);
      if (enquiry) {
        console.log('📱 DELIVERY UI: Showing WhatsApp notification for delivery completion');
        alert(
          `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} has been delivered successfully. Thank you for choosing our service!"`
        );
      }
      
      console.log('✅ DELIVERY UI: Delivery completed successfully via backend API');
    } catch (error) {
      console.error('❌ DELIVERY UI: Failed to complete delivery:', error);
      alert('Failed to complete delivery. Please try again.');
    }
  };

  // ADDED: Loading state for backend API
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading delivery enquiries...</p>
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
          <p className="text-red-600 mb-4">Error loading delivery data: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Original JSX return - COMPLETELY UNCHANGED except data source
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Delivery Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage completed service deliveries and customer pickups
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {readyForDelivery}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Ready for Delivery
              </div>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {scheduledDeliveries}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Scheduled
              </div>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {outForDelivery}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Out for Delivery
              </div>
            </div>
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {deliveredToday}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Delivered Today
              </div>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search deliveries by customer, address, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Delivery Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Delivery Queue
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {filteredEnquiries.map((enquiry) => (
            <Card
              key={enquiry.id}
              className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg">
                    {enquiry.customerName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {enquiry.phone}
                  </p>
                </div>
                <Badge
                  className={`${getStatusColor(
                    enquiry.deliveryDetails?.status || "ready"
                  )} text-xs self-start`}
                >
                  {enquiry.deliveryDetails?.status || "ready"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground break-words">
                    {enquiry.address}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    {enquiry.product} ({enquiry.quantity} items)
                  </span>
                </div>

                {enquiry.deliveryDetails?.scheduledTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      Scheduled: {enquiry.deliveryDetails.scheduledTime}
                    </span>
                  </div>
                )}

                {enquiry.deliveryDetails?.assignedTo && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Service Completed Photo:</div>
                    <img
                      src={enquiry.deliveryDetails.photos.beforePhoto}
                      alt="Service completed"
                      className="w-full h-24 object-cover rounded-md border"
                    />
                  </div>
                )}

                {/* Fallback: Show service photo directly if delivery photo missing */}
                {!enquiry.deliveryDetails?.photos?.beforePhoto && enquiry.serviceDetails?.overallPhotos?.afterPhoto && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Service Final Photo (Direct):</div>
                    <img
                      src={enquiry.serviceDetails.overallPhotos.afterPhoto}
                      alt="Service completed"
                      className="w-full h-24 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {enquiry.deliveryDetails?.status === "ready" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm"
                      >
                        <Clock className="h-3 w-3 mr-1" />
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
                          <Select onValueChange={(value) => setSelectedDeliveryMethod(value as DeliveryMethod)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer-pickup">Customer Pickup</SelectItem>
                              <SelectItem value="home-delivery">Home Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Scheduled Time</Label>
                          <Input 
                            type="datetime-local" 
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (scheduledDateTime) {
                              scheduleDelivery(enquiry.id, selectedDeliveryMethod, scheduledDateTime);
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
                    onClick={() => markOutForDelivery(enquiry.id, "Delivery Person")}
                  >
                    <Truck className="h-3 w-3 mr-1" />
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
                        <CheckCircle className="h-3 w-3 mr-1" />
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
                                className="w-full h-32 object-cover rounded-md border"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
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
                                className="w-full h-20 object-contain rounded-md border"
                              />
                            </div>
                          )}
                        </div>

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
                          <CheckCircle className="h-4 w-4 mr-2" />
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
  );
}