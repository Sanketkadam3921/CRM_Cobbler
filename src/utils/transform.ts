// // utils/transform.ts
// import { Enquiry } from "@/types";

// export function transformEnquiry(apiData: any): Enquiry {
//   return {
//     id: apiData.id,
//     customerName: apiData.name,
//     phone: apiData.phone,
//     address: apiData.location,
//     message: apiData.message,
//     inquiryType: apiData.inquiry_type,
//     product: apiData.product,
//     quantity: apiData.quantity,
//     date: apiData.date || new Date().toISOString().split("T")[0], // fallback
//     status: apiData.status || "new",
//     contacted: apiData.contacted ?? false,
//     contactedAt: apiData.contactedAt,
//     assignedTo: apiData.assignedTo,
//     notes: apiData.notes,

//     // workflow
//     currentStage: apiData.currentStage || "enquiry",
//     pickupDetails: apiData.pickupDetails,
//     serviceDetails: apiData.serviceDetails,
//     deliveryDetails: apiData.deliveryDetails,

//     // pricing
//     quotedAmount: apiData.quotedAmount,
//     finalAmount: apiData.finalAmount,

//     // Legacy support
//     name: apiData.name,
//     number: apiData.phone,
//     location: apiData.location,
//   };
// }

// export function transformEnquiries(apiDataArray: any[]): Enquiry[] {
//   return apiDataArray.map(transformEnquiry);
// }
// utils/transform.ts
import { Enquiry } from "@/types";

export function transformEnquiry(apiData: any): Enquiry {
  // Handle null or undefined data
  if (!apiData) {
    throw new Error('No data provided to transform');
  }

  // Provide fallback values for required fields
  return {
    id: apiData.id || 0,
    customerName: apiData.name || apiData.customerName || '',
    phone: apiData.phone || apiData.number || '',
    address: apiData.location || apiData.address || '',
    message: apiData.message || '',
    inquiryType: apiData.inquiry_type || apiData.inquiryType || 'WhatsApp',
    product: apiData.product || 'Bag',
    quantity: apiData.quantity || 1,
    date: apiData.date || new Date().toISOString().split("T")[0],
    status: apiData.status || "new",
    contacted: apiData.contacted ?? false,
    contactedAt: apiData.contactedAt || apiData.contacted_at,
    assignedTo: apiData.assignedTo || apiData.assigned_to,
    notes: apiData.notes,

    // workflow
    currentStage: apiData.currentStage || apiData.current_stage || "enquiry",
    pickupDetails: apiData.pickupDetails || apiData.pickup_details,
    serviceDetails: apiData.serviceDetails || apiData.service_details,
    deliveryDetails: apiData.deliveryDetails || apiData.delivery_details,

    // pricing
    quotedAmount: apiData.quotedAmount || apiData.quoted_amount,
    finalAmount: apiData.finalAmount || apiData.final_amount,

    // Legacy support - maintain backward compatibility
    name: apiData.name || apiData.customerName || '',
    number: apiData.phone || apiData.number || '',
    location: apiData.location || apiData.address || '',
  };
}

export function transformEnquiries(apiDataArray: any[]): Enquiry[] {
  if (!Array.isArray(apiDataArray)) {
    console.warn('Expected array but got:', typeof apiDataArray, apiDataArray);
    return [];
  }

  return apiDataArray
    .filter(item => item && typeof item === 'object') // Filter out null/undefined items
    .map(item => {
      try {
        return transformEnquiry(item);
      } catch (error) {
        console.error('Failed to transform enquiry:', item, error);
        return null;
      }
    })
    .filter((item): item is Enquiry => item !== null); // Remove failed transformations
}