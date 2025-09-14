import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Calculator,
  FileText,
  Search,
  Send,
  Download,
  DollarSign,
  Percent,
  Receipt,
  ArrowRight,
  Plus,
  Minus,
  Phone,
  IndianRupee,
  ReceiptIndianRupee
} from "lucide-react";
import { Enquiry, BillingDetails, BillingItem, BillingEnquiry, BillingCreateRequest } from "@/types";
// COMMENTED OUT: localStorage imports - replaced with API service
// import { enquiriesStorage, workflowHelpers, businessInfoStorage } from "@/utils/localStorage";
import { businessInfoStorage } from "@/utils/localStorage"; // Keep businessInfoStorage as requested
import { useBillingEnquiries, useBillingStats, billingApiService } from "@/services/billingApiService";
import { InvoiceDisplay } from "./InvoiceDisplay";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from "react"; // Added missing import for React
import { PendingPickupsTable } from "../pickup/PendingPickupsTable";

// Helper function to safely format currency values
const safeToFixed = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0.00';
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  return numValue.toFixed(decimals);
};

export function BillingModule() {
  console.log('🚀 BillingModule rendering');

  // COMMENTED OUT: localStorage state management - replaced with API hooks
  // const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // ADDED: API hooks with 2-second polling for real-time updates (same as service module)
  const { enquiries, loading: enquiriesLoading, error: enquiriesError, refetch, createBilling, moveToDelivery } = useBillingEnquiries(200000);
  const { stats, loading: statsLoading, error: statsError } = useBillingStats();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<BillingEnquiry | null>(null);
  const [showBillingDialog, setShowBillingDialog] = useState<number | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);

  // Billing form state
  const [billingForm, setBillingForm] = useState<Partial<BillingDetails>>({
    finalAmount: 0,
    gstIncluded: true,
    gstRate: 18,
    subtotal: 0,
    totalAmount: 0,
    items: [],
    notes: ""
  });

  // Raw input values (for display)
  const [rawInputValues, setRawInputValues] = useState<{
    [key: string]: string;
  }>({});

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Unified validation and form update system
  const validateAndUpdateField = (
    fieldType: 'price' | 'gstRate' | 'discount',
    value: string,
    index?: number
  ) => {
    let error = "";
    let numValue = 0;
    let fieldKey = "";

    // Determine validation function and field key
    if (fieldType === 'price') {
      fieldKey = `item-${index}-originalAmount`;
      if (value.trim() === '') {
        numValue = 0;
      } else {
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 0) {
          error = "Price must be greater than or equal to ₹0.00";
        } else {
          numValue = parsed;
        }
      }
    } else if (fieldType === 'gstRate') {
      fieldKey = `item-${index}-gstRate`;
      if (value.trim() === '') {
        numValue = 0;
      } else {
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
          error = "GST rate must be between 0% and 100%";
        } else {
          numValue = parsed;
        }
      }
    } else if (fieldType === 'discount') {
      fieldKey = `item-${index}-discountValue`;
      if (value.trim() === '') {
        numValue = 0;
      } else {
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
          error = "Discount must be between 0% and 100%";
        } else {
          numValue = parsed;
        }
      }
    }

    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [fieldKey]: error
    }));

    // Update form state only if valid
    if (!error && index !== undefined) {
      const fieldName = fieldType === 'price' ? 'originalAmount' :
        fieldType === 'gstRate' ? 'gstRate' : 'discountValue';
      updateServiceItem(index, fieldName as keyof BillingItem, numValue);
    }

    return { isValid: !error, numValue, error };
  };

  // Legacy validation functions for backward compatibility (removed - using unified validation directly)

  // COMMENTED OUT: localStorage data loading - replaced with API hooks
  // useEffect(() => {
  //   const loadBillingEnquiries = () => {
  //     console.log('📂 Loading billing enquiries...');
  //     const billingEnquiries = workflowHelpers.getBillingEnquiries();
  //     console.log('📂 Found billing enquiries:', billingEnquiries);
  //     setEnquiries(billingEnquiries);
  //   };
  //   
  //   loadBillingEnquiries();
  //   
  //   // Refresh data every 2 seconds to catch updates from other modules
  //   const interval = setInterval(loadBillingEnquiries, 2000);
  //   
  //   return () => clearInterval(interval);
  // }, []);

  // ADDED: API hooks handle data loading and stats automatically
  // No need for manual useEffect or stats calculation

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('🎯 Filtered enquiries for rendering:', filteredEnquiries);
  console.log('🎯 showInvoiceDialog state:', showInvoiceDialog);
  console.log('🎯 selectedEnquiry state:', selectedEnquiry);

  // Check if a specific row has any validation errors
  const hasRowValidationErrors = (index: number): boolean => {
    const priceError = validationErrors[`item-${index}-originalAmount`];
    const gstError = validationErrors[`item-${index}-gstRate`];
    const discountError = validationErrors[`item-${index}-discountValue`];

    return !!(priceError || gstError || discountError);
  };

  // Check if all form data is valid before calculating
  const isFormDataValid = (): boolean => {
    // Check if there are any validation errors
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== "");
    if (hasValidationErrors) {
      console.log('🧮 Skipping calculation - validation errors present:', validationErrors);
      return false;
    }

    // Check if all required fields have valid numeric values
    const hasValidItems = billingForm.items?.every(item => {
      const hasValidPrice = typeof item.originalAmount === 'number' && item.originalAmount >= 0;
      const hasValidGst = typeof item.gstRate === 'number' && item.gstRate >= 0 && item.gstRate <= 100;
      return hasValidPrice && hasValidGst;
    });

    if (!hasValidItems) {
      console.log('🧮 Skipping calculation - invalid item data');
      return false;
    }

    return true;
  };

  // Calculate billing amounts
  const calculateBilling = () => {
    console.log('🧮 Starting billing calculation');
    console.log('🧮 Current billing form:', billingForm);

    const { items, gstIncluded } = billingForm;

    if (!items || items.length === 0) {
      console.log('🧮 No items to calculate');
      return;
    }

    // Only calculate if all data is valid
    if (!isFormDataValid()) {
      console.log('🧮 Skipping calculation - form data is invalid');
      return;
    }

    // Calculate individual service amounts
    const updatedItems = items.map(item => {
      console.log('🧮 Calculating for service:', item.serviceType);
      console.log('🧮 GST included:', gstIncluded);

      let serviceFinalAmount = item.originalAmount;
      let serviceDiscountAmount = 0;
      let serviceGstAmount = 0;

      // Step 1: Calculate service-level discount (on base amount)
      if (item.discountValue && item.discountValue > 0) {
        serviceDiscountAmount = (item.originalAmount * item.discountValue) / 100;
        serviceDiscountAmount = Math.min(serviceDiscountAmount, item.originalAmount);
        serviceFinalAmount = item.originalAmount - serviceDiscountAmount;
        console.log('🧮 After discount:', serviceFinalAmount);
      }

      // Step 2: Calculate service-level GST (on discounted amount)
      if (gstIncluded && item.gstRate && item.gstRate > 0) {
        serviceGstAmount = (serviceFinalAmount * item.gstRate) / 100;
        console.log('🧮 GST amount:', serviceGstAmount);
      }

      const updatedItem = {
        ...item,
        discountAmount: Math.round(serviceDiscountAmount * 100) / 100,
        finalAmount: Math.round(serviceFinalAmount * 100) / 100,
        gstAmount: Math.round(serviceGstAmount * 100) / 100
      };

      console.log('🧮 Service calculation result:', updatedItem);
      console.log('🧮 Formula: Base(₹{item.originalAmount}) × (1-{item.discountValue}%) × (1+{item.gstRate}%) = ₹{serviceFinalAmount + serviceGstAmount}');

      return updatedItem;
    });

    // Calculate totals
    const totalOriginalAmount = updatedItems.reduce((sum, item) => sum + item.originalAmount, 0);
    const totalServiceDiscounts = updatedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalServiceGst = updatedItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.finalAmount, 0);

    console.log('🧮 Totals:');
    console.log('🧮 Total original amount:', totalOriginalAmount);
    console.log('🧮 Total service discounts:', totalServiceDiscounts);
    console.log('🧮 Total service GST:', totalServiceGst);
    console.log('🧮 Subtotal:', subtotal);

    // Calculate final total (subtotal + total service GST)
    const totalAmount = subtotal + totalServiceGst;

    console.log('🧮 Final calculation results:');
    console.log('🧮 Total amount:', totalAmount);
    console.log('🧮 Final formula: Subtotal(₹{subtotal}) + Total GST(₹{totalServiceGst}) = ₹{totalAmount}');

    setBillingForm(prev => ({
      ...prev,
      items: updatedItems,
      finalAmount: Math.round(totalOriginalAmount * 100) / 100,
      gstAmount: Math.round(totalServiceGst * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    }));
  };

  // Recalculate when form values change
  useEffect(() => {
    console.log('🔄 useEffect triggered - recalculating billing');
    calculateBilling();
  }, [
    billingForm.items,
    billingForm.gstIncluded
  ]);

  // Update billing form
  const updateBillingForm = (field: keyof BillingDetails, value: any, isRawInput: boolean = false) => {
    if (isRawInput) {
      // Store raw input value for display
      setRawInputValues(prev => ({
        ...prev,
        [field]: value
      }));
      return;
    }

    setBillingForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Overall discount validation removed - only item-level discounts now
  };

  // Update individual service item
  const updateServiceItem = (index: number, field: keyof BillingItem, value: any, isRawInput: boolean = false) => {
    console.log('🔧 Updating service item:', index, field, value, 'isRawInput:', isRawInput);

    if (isRawInput) {
      // Store raw input value for display
      const fieldKey = `item-${index}-${field}`;
      setRawInputValues(prev => ({
        ...prev,
        [fieldKey]: value
      }));
      return;
    }

    // Update the form with parsed value
    setBillingForm(prev => ({
      ...prev,
      items: prev.items?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));

    // Validate the field using unified validation
    let error = "";
    const fieldKey = `item-${index}-${field}`;

    if (field === 'originalAmount') {
      const result = validateAndUpdateField('price', value.toString(), index);
      error = result.error;
    } else if (field === 'gstRate') {
      const result = validateAndUpdateField('gstRate', value.toString(), index);
      error = result.error;
    } else if (field === 'discountValue') {
      const result = validateAndUpdateField('discount', value.toString(), index);
      error = result.error;
    }

    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [fieldKey]: error
    }));
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  // Save billing details - UPDATED: Now uses API instead of localStorage
  const saveBillingDetails = async (enquiryId: number) => {
    console.log('🔄 Starting save billing details for enquiry:', enquiryId);

    if (!selectedEnquiry) {
      console.log('❌ No selected enquiry');
      alert("Please select an enquiry");
      return;
    }

    // Check for validation errors
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== "");
    if (hasValidationErrors) {
      console.log('❌ Validation errors present:', validationErrors);
      alert("Please fix all validation errors before saving");
      return;
    }

    // Check if all required fields are filled and valid
    const hasRequiredFields = billingForm.items?.every(item => {
      const priceValid = item.originalAmount >= 0; // Price can be 0
      const gstValid = item.gstRate >= 0; // GST can be 0
      return priceValid && gstValid;
    });

    // Check for empty required fields in raw input
    const hasEmptyRequiredFields = billingForm.items?.some((item, index) => {
      const priceEmpty = !rawInputValues[`item-${index}-originalAmount`] && !item.originalAmount;
      const gstEmpty = !rawInputValues[`item-${index}-gstRate`] && !item.gstRate;
      return priceEmpty || gstEmpty;
    });

    if (hasEmptyRequiredFields) {
      console.log('❌ Empty required fields detected');
      alert("Please fill in all required fields (Price and GST Rate) for each service");
      return;
    }

    if (!hasRequiredFields) {
      console.log('❌ Invalid required fields');
      alert("Please ensure all fields have valid values before saving");
      return;
    }

    try {
      console.log('🔄 Preparing billing data for API...');
      const businessInfo = businessInfoStorage.get();

      const billingData: BillingCreateRequest = {
        finalAmount: billingForm.finalAmount || 0,
        gstIncluded: billingForm.gstIncluded || true,
        gstRate: billingForm.gstRate || 18,
        gstAmount: billingForm.gstAmount || 0,
        subtotal: billingForm.subtotal || 0,
        totalAmount: billingForm.totalAmount || 0,
        customerName: selectedEnquiry.customerName,
        customerPhone: selectedEnquiry.phone,
        customerAddress: selectedEnquiry.address,
        businessInfo,
        notes: billingForm.notes || "",
        items: billingForm.items || []
      };

      console.log('🔄 Sending billing data to API:', billingData);

      // Use optimistic update from API service
      await createBilling(enquiryId, billingData);

      console.log('✅ Billing details saved successfully via API');

      // Reset form
      setBillingForm({
        finalAmount: 0,
        gstIncluded: true, // Keep default as true
        gstRate: 18,
        subtotal: 0,
        totalAmount: 0,
        items: [],
        notes: ""
      });
      setShowBillingDialog(null);
      setSelectedEnquiry(null);

      alert("Billing details saved successfully!");
    } catch (error) {
      console.error('❌ Failed to save billing details:', error);
      alert("Failed to save billing details. Please try again.");
    }
  };

  // Convert BillingEnquiry to Enquiry for InvoiceDisplay compatibility
  const convertBillingEnquiryToEnquiry = (billingEnquiry: BillingEnquiry): Enquiry => {
    // FIXED: Get business info from localStorage instead of DB
    const businessInfo = businessInfoStorage.get();

    return {
      id: billingEnquiry.id,
      customerName: billingEnquiry.customerName,
      phone: billingEnquiry.phone,
      address: billingEnquiry.address,
      message: '', // Not available in BillingEnquiry
      inquiryType: 'Website' as any, // Default value
      product: billingEnquiry.product as any, // Cast to ProductType
      quantity: billingEnquiry.quantity,
      date: new Date().toISOString().split('T')[0], // Default to today
      status: 'converted' as any, // Default value
      contacted: true, // Default value
      currentStage: billingEnquiry.currentStage as any,
      serviceDetails: billingEnquiry.serviceDetails ? {
        ...billingEnquiry.serviceDetails,
        serviceTypes: billingEnquiry.serviceDetails.serviceTypes?.map(st => ({
          ...st,
          type: st.type as any, // Cast to ServiceType
          status: st.status as any, // Cast to ServiceStatus
          photos: {
            beforePhoto: undefined,
            afterPhoto: undefined
          }
        })),
        overallPhotos: {
          beforePhoto: undefined,
          afterPhoto: undefined,
          beforeNotes: undefined,
          afterNotes: undefined
        },
        // FIXED: Override billingDetails with business info from localStorage
        billingDetails: billingEnquiry.serviceDetails.billingDetails ? {
          ...billingEnquiry.serviceDetails.billingDetails,
          businessInfo: businessInfo
        } : undefined
      } : undefined
    };
  };

  // Generate invoice PDF
  const generateInvoicePDF = async (enquiryId: number) => {
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry?.serviceDetails?.billingDetails) {
      alert("No billing details found. Please create billing first.");
      return;
    }

    try {
      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px'; // Fixed width for PDF
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tempDiv);

      // Render the InvoiceDisplay component to the temporary div
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      root.render(React.createElement(InvoiceDisplay, { enquiry: convertBillingEnquiryToEnquiry(enquiry) }));

      // Wait a bit for the component to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Clean up
      root.unmount();
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // If content is longer than one page, add new pages
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft >= pdfHeight) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save the PDF
      pdf.save(`Invoice-${enquiry.serviceDetails.billingDetails.invoiceNumber}.pdf`);

      alert(`Invoice PDF generated successfully!\nFilename: Invoice-${enquiry.serviceDetails.billingDetails.invoiceNumber}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Send invoice
  const sendInvoice = (enquiryId: number) => {
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry?.serviceDetails?.billingDetails) {
      alert("No billing details found. Please create billing first.");
      return;
    }

    alert(`Invoice sent to ${enquiry.customerName} via WhatsApp!\nAmount: ₹${enquiry.serviceDetails.billingDetails.totalAmount}`);
  };

  // Move to delivery - UPDATED: Now uses API instead of localStorage
  const handleMoveToDelivery = async (enquiryId: number) => {
    console.log('🔄 Moving enquiry to delivery stage:', enquiryId);

    try {
      // Use optimistic update from API service
      await moveToDelivery(enquiryId);

      console.log('✅ Enquiry moved to delivery stage successfully via API');

      const enquiry = enquiries.find(e => e.id === enquiryId);
      if (enquiry) {
        alert(`Moved ${enquiry.customerName}'s ${enquiry.product} to delivery stage!`);
      }
    } catch (error) {
      console.error('❌ Failed to move enquiry to delivery stage:', error);
      alert("Failed to move to delivery stage. Please try again.");
    }
  };

  // Initialize billing form when enquiry is selected - UPDATED: Now works with BillingEnquiry type
  const initializeBillingForm = (enquiry: BillingEnquiry) => {
    console.log('🔧 Initializing billing form for enquiry:', enquiry);

    // Clear validation errors and raw input values
    setValidationErrors({});
    setRawInputValues({});

    setSelectedEnquiry(enquiry);
    setBillingForm({
      finalAmount: 0, // This will be calculated from individual services
      gstIncluded: true, // Default to true
      gstRate: 18,
      subtotal: 0, // This will be calculated from individual services
      totalAmount: 0, // This will be calculated from individual services
      items: enquiry.serviceDetails?.serviceTypes?.map(service => ({
        serviceType: service.type,
        originalAmount: 0, // Start with 0, user must enter
        discountValue: 0,
        discountAmount: 0,
        finalAmount: 0,
        gstRate: 18, // Individual GST rate per service
        gstAmount: 0, // Individual GST amount per service
        description: service.workNotes
      })) || [],
      notes: ""
    });
    setShowBillingDialog(enquiry.id);
  };

  // View invoice
  const viewInvoice = (enquiryId: number) => {
    console.log('🔍 viewInvoice called with enquiryId:', enquiryId);

    const enquiry = enquiries.find(e => e.id === enquiryId);
    console.log('🔍 Found enquiry:', enquiry);

    if (!enquiry) {
      console.error('❌ No enquiry found with ID:', enquiryId);
      alert("Enquiry not found!");
      return;
    }

    if (!enquiry.serviceDetails?.billingDetails) {
      console.error('❌ No billing details found for enquiry:', enquiryId);
      alert("No billing details found. Please create billing first.");
      return;
    }

    console.log('✅ Setting selectedEnquiry and showInvoiceDialog');
    console.log('✅ Billing details:', enquiry.serviceDetails.billingDetails);

    setSelectedEnquiry(enquiry);
    setShowInvoiceDialog(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Billing & Invoice
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Generate invoices with GST and discounts for completed services
          </p>
        </div>
      </div>

      {/* Stats - UPDATED: Now using API stats instead of localStorage calculations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? '...' : stats.pendingBilling}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Pending Billing
              </div>
            </div>
            <ReceiptIndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? '...' : stats.invoicesGenerated}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Invoices Generated
              </div>
            </div>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                ₹
                {statsLoading
                  ? "..."
                  : Number(stats.totalBilled || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Billed
              </div>
            </div>

            <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? '...' : stats.invoicesSent}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Invoices Sent
              </div>
            </div>
            <Send className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search billing items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Billing Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Billing Queue
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
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">
                      {enquiry.phone.startsWith('+91') ? enquiry.phone : `+91 ${enquiry.phone}`}
                    </span>
                  </div>

                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${enquiry.serviceDetails?.billingDetails ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'} text-xs px-2 py-1 rounded-full font-medium`}>
                    {enquiry.serviceDetails?.billingDetails ? 'Billed' : 'Pending Billing'}
                  </Badge>
                  {enquiry.serviceDetails?.billingDetails?.invoiceNumber && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                      {enquiry.serviceDetails.billingDetails.invoiceNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    Quantity: {enquiry.quantity}
                  </div>
                  <span className="text-gray-500 text-sm">{enquiry.product}</span>
                </div>


                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">
                    Estimated: ₹{safeToFixed(enquiry.serviceDetails?.estimatedCost)}
                  </span>
                </div>
                {enquiry.serviceDetails?.billingDetails && (
                  <div className="space-y-2 p-3 bg-green-50 rounded border border-green-200">
                    <h4 className="text-sm font-medium text-green-800">Billing Details:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-green-600">Subtotal:</span> ₹
                        {Number(safeToFixed(enquiry.serviceDetails.billingDetails.subtotal)).toLocaleString("en-IN")}
                      </div>
                      <div>
                        <span className="text-green-600">GST:</span> ₹
                        {Number(safeToFixed(enquiry.serviceDetails.billingDetails.gstAmount)).toLocaleString("en-IN")}
                      </div>
                      <div>
                        <span className="text-green-600">Discount:</span> ₹
                        {Number(
                          safeToFixed(
                            enquiry.serviceDetails.billingDetails.items?.reduce(
                              (sum, item) => sum + (parseFloat(item.discountAmount) || 0),
                              0
                            )
                          )
                        ).toLocaleString("en-IN")}
                      </div>
                      <div>
                        <span className="text-green-600 font-semibold">Total:</span> ₹
                        {Number(safeToFixed(enquiry.serviceDetails.billingDetails.totalAmount)).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                )}


                {/* Service Types Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Services Completed:</h4>
                  {enquiry.serviceDetails?.serviceTypes && enquiry.serviceDetails.serviceTypes.length > 0 ? (
                    <div className="space-y-1">
                      {enquiry.serviceDetails.serviceTypes.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                          <span className="text-foreground">{service.type}</span>
                          <Badge className="bg-green-500 text-white text-xs">
                            Done
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No services found
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {!enquiry.serviceDetails?.billingDetails ? (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    onClick={() => initializeBillingForm(enquiry)}
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Create Billing
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm"
                      onClick={() => {
                        console.log('🔘 View Invoice button clicked for enquiry ID:', enquiry.id);
                        console.log('🔘 Enquiry details:', enquiry);
                        viewInvoice(enquiry.id);
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Invoice
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm"
                      onClick={() => generateInvoicePDF(enquiry.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs sm:text-sm"
                      onClick={() => sendInvoice(enquiry.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send Invoice
                    </Button>
                  </>
                )}

                {enquiry.serviceDetails?.billingDetails && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                    onClick={() => handleMoveToDelivery(enquiry.id)}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Move to Delivery
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ADDED: Loading and error states for API integration */}
        {enquiriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading billing enquiries</p>
            </div>
          </div>
        ) : enquiriesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading billing enquiries</p>
              <p className="text-sm text-gray-500">{enquiriesError}</p>
            </div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <Card className="p-8 text-center">
            <ReceiptIndianRupee className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Billing Items
            </h3>
            <p className="text-muted-foreground">
              Billing items will appear here once services are completed.
            </p>
          </Card>
        ) : null}
      </div>

      {/* Billing Dialog */}
      {showBillingDialog && selectedEnquiry && (
        <Dialog open={showBillingDialog === selectedEnquiry.id} onOpenChange={() => setShowBillingDialog(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Billing - {selectedEnquiry.customerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* GST Included Checkbox - At the top */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
                <Checkbox
                  id="gstIncluded"
                  checked={billingForm.gstIncluded}
                  onCheckedChange={(checked) => {
                    console.log('🔧 GST checkbox changed:', checked);
                    updateBillingForm('gstIncluded', checked);
                  }}
                />
                <Label htmlFor="gstIncluded" className="cursor-pointer font-medium">
                  Include GST in total
                </Label>
                <Badge variant={billingForm.gstIncluded ? "default" : "secondary"} className="ml-2">
                  {billingForm.gstIncluded ? "GST Included" : "GST Excluded"}
                </Badge>
              </div>

              {/* Individual Services Pricing */}
              <div>
                <h4 className="text-lg font-medium text-foreground mb-4">Service Pricing</h4>
                <div className="space-y-4">
                  {billingForm.items?.map((item, index) => (
                    <Card key={`${item.serviceType}-${index}`} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Service Type */}
                        <div>
                          <Label className="text-sm font-medium">Service</Label>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.serviceType}
                          </div>
                        </div>

                        {/* Original Amount */}
                        <div>
                          <Label htmlFor={`originalAmount-${index}`}>Price (₹) *</Label>
                          <Input
                            id={`originalAmount-${index}`}
                            type="text"
                            value={rawInputValues[`item-${index}-originalAmount`] !== undefined ? rawInputValues[`item-${index}-originalAmount`] : (item.originalAmount || '')}
                            onChange={(e) => updateServiceItem(index, 'originalAmount', e.target.value, true)}
                            onBlur={(e) => validateAndUpdateField('price', e.target.value, index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' || e.key === 'Enter') {
                                validateAndUpdateField('price', e.currentTarget.value, index);
                              }
                            }}
                            placeholder="0"
                            required
                          />
                          {validationErrors[`item-${index}-originalAmount`] && (
                            <p className="text-xs text-red-500 mt-1">{validationErrors[`item-${index}-originalAmount`]}</p>
                          )}
                        </div>

                        {/* Individual GST Rate */}
                        <div>
                          <Label htmlFor={`gstRate-${index}`}>GST Rate (%) *</Label>
                          <Input
                            id={`gstRate-${index}`}
                            type="text"
                            value={rawInputValues[`item-${index}-gstRate`] !== undefined ? rawInputValues[`item-${index}-gstRate`] : (item.gstRate || '')}
                            onChange={(e) => updateServiceItem(index, 'gstRate', e.target.value, true)}
                            onBlur={(e) => validateAndUpdateField('gstRate', e.target.value, index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' || e.key === 'Enter') {
                                validateAndUpdateField('gstRate', e.currentTarget.value, index);
                              }
                            }}
                            placeholder="18"
                            required
                          />
                          {validationErrors[`item-${index}-gstRate`] && (
                            <p className="text-xs text-red-500 mt-1">{validationErrors[`item-${index}-gstRate`]}</p>
                          )}
                        </div>

                        {/* Service Discount Percentage */}
                        <div>
                          <Label htmlFor={`discountValue-${index}`}>Discount (%)</Label>
                          <Input
                            id={`discountValue-${index}`}
                            type="text"
                            value={rawInputValues[`item-${index}-discountValue`] !== undefined ? rawInputValues[`item-${index}-discountValue`] : (item.discountValue || '')}
                            onChange={(e) => updateServiceItem(index, 'discountValue', e.target.value, true)}
                            onBlur={(e) => validateAndUpdateField('discount', e.target.value, index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' || e.key === 'Enter') {
                                validateAndUpdateField('discount', e.currentTarget.value, index);
                              }
                            }}
                            placeholder="0"
                          />
                          {validationErrors[`item-${index}-discountValue`] && (
                            <p className="text-xs text-red-500 mt-1">{validationErrors[`item-${index}-discountValue`]}</p>
                          )}
                        </div>

                        {/* Service Total */}
                        <div>
                          <Label className="text-sm font-medium">Total (₹)</Label>
                          <div className="text-lg font-bold mt-1">
                            {hasRowValidationErrors(index) ? (
                              <span className="text-red-500">---</span>
                            ) : (
                              <span className="text-blue-600">
                                ₹{safeToFixed((item.finalAmount || 0) + (item.gstAmount || 0))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Service Description */}
                      {/* <div className="mt-3">
                        <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={item.description || ''}
                          onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                          placeholder="Add service description..."
                          rows={2}
                        />
                      </div> */}
                    </Card>
                  ))}
                </div>
              </div>



              {/* Calculation Summary */}
              <Card className="p-4 bg-muted/50">
                <h4 className="text-sm font-medium text-foreground mb-3">Overall Calculation Summary</h4>
                {Object.values(validationErrors).some(error => error !== "") ? (
                  <div className="text-center py-4">
                    <div className="text-red-500 font-medium mb-2">⚠️ Validation Errors Present</div>
                    <div className="text-sm text-muted-foreground">Please fix all validation errors to see totals</div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Original Amount:</span>
                      <span>₹{safeToFixed(billingForm.finalAmount)}</span>
                    </div>
                    {/* Service-level discounts */}
                    {billingForm.items && billingForm.items.some(item => (item.discountAmount || 0) > 0) && (
                      <div className="flex justify-between text-orange-600">
                        <span>Service Discounts:</span>
                        <span>-₹{safeToFixed(billingForm.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>₹{safeToFixed(billingForm.subtotal)}</span>
                    </div>
                    {billingForm.gstIncluded && (billingForm.gstAmount || 0) > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Total GST:</span>
                        <span>+₹{safeToFixed(billingForm.gstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₹{safeToFixed(billingForm.totalAmount)}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes for the invoice"
                  value={billingForm.notes || ''}
                  onChange={(e) => updateBillingForm('notes', e.target.value)}
                  onBlur={(e) => updateBillingForm('notes', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => saveBillingDetails(selectedEnquiry.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !billingForm.items?.every(item => item.originalAmount >= 0 && item.gstRate >= 0) ||
                    Object.values(validationErrors).some(error => error !== "")
                  }
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Save Billing Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBillingDialog(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Preview Dialog */}
      {showInvoiceDialog && selectedEnquiry && selectedEnquiry.serviceDetails?.billingDetails && (
        <Dialog open={showInvoiceDialog} onOpenChange={() => setShowInvoiceDialog(false)}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview - {selectedEnquiry.customerName}</DialogTitle>
            </DialogHeader>
            <InvoiceDisplay enquiry={convertBillingEnquiryToEnquiry(selectedEnquiry)} />
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={() => generateInvoicePDF(selectedEnquiry.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => sendInvoice(selectedEnquiry.id)}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}