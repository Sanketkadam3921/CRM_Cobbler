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
  ReceiptIndianRupee,
  Loader2,
  Eye
} from "lucide-react";
import { Enquiry, BillingDetails, BillingItem, BillingEnquiry, BillingCreateRequest } from "@/types";
import { businessInfoStorage } from "@/utils/localStorage";
import { useBillingEnquiries, useBillingStats, billingApiService } from "@/services/billingApiService";
import { SettingsApiService } from "@/services/settingsApiService";
import { InvoiceDisplay } from "./InvoiceDisplay";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from "react";
import { toast, useToast } from "@/hooks/use-toast";

// Helper function to safely format currency values
const safeToFixed = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0.00';
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  return numValue.toFixed(decimals);
};

export function BillingModule() {
  console.log('🚀 BillingModule rendering');
  const { toast } = useToast();

  // API hooks with polling for real-time updates
  const { enquiries, loading: enquiriesLoading, error: enquiriesError, refetch, createBilling, moveToDelivery } = useBillingEnquiries(200000);
  const { stats, loading: statsLoading, error: statsError } = useBillingStats();

  // Business info state
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [businessInfoLoading, setBusinessInfoLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<BillingEnquiry | null>(null);
  const [showBillingDialog, setShowBillingDialog] = useState<number | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState<boolean>(false);

  // Track selected item per enquiry for viewing specific services
  const [selectedItemByEnquiry, setSelectedItemByEnquiry] = useState<Record<string, string | null>>({});

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

  // Load business info from API
  const loadBusinessInfo = async () => {
    try {
      setBusinessInfoLoading(true);
      console.log('[BillingModule] Loading business info from API...');

      const businessData = await SettingsApiService.getBusinessInfo();
      if (businessData) {
        setBusinessInfo(businessData);
        businessInfoStorage.save(businessData);
        console.log('[BillingModule] Business info loaded successfully:', businessData.businessName);
      } else {
        const fallbackData = businessInfoStorage.get();
        setBusinessInfo(fallbackData);
        console.log('[BillingModule] Using fallback business info from localStorage');
      }
    } catch (error) {
      console.error('[BillingModule] Failed to load business info from API:', error);
      const fallbackData = businessInfoStorage.get();
      setBusinessInfo(fallbackData);
      console.log('[BillingModule] Using fallback business info from localStorage due to error');
    } finally {
      setBusinessInfoLoading(false);
    }
  };

  // Load business info on component mount
  useEffect(() => {
    loadBusinessInfo();
  }, []);

  // Refresh business info when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[BillingModule] Component became visible, refreshing business info...');
        loadBusinessInfo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFocus = () => {
      console.log('[BillingModule] Window gained focus, refreshing business info...');
      loadBusinessInfo();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Helper functions for item-level service management (updated to match ServiceModule)
  const getServicesForItem = (enquiry: BillingEnquiry, itemKey: string) => {
    if (!enquiry.serviceDetails?.serviceTypes) return [];

    console.log('🔍 getServicesForItem called with itemKey:', itemKey);

    return enquiry.serviceDetails.serviceTypes.filter(service => {
      // Check if service has product and itemIndex properties
      const serviceProduct = service.product;
      const serviceItemIndex = service.itemIndex;

      console.log('🔍 Checking service:', {
        type: service.type,
        product: serviceProduct,
        itemIndex: serviceItemIndex,
        itemKey: itemKey
      });

      if (serviceProduct && serviceItemIndex) {
        const serviceKey = `${serviceProduct}-${serviceItemIndex}`;
        console.log('🔍 Service has explicit product/item, comparing:', serviceKey, '===', itemKey);
        return serviceKey === itemKey;
      }

      console.log('🔍 Service does not match itemKey');
      return false;
    });
  };

  const getAllItemsFromEnquiry = (enquiry: BillingEnquiry) => {
    console.log('🔍 getAllItemsFromEnquiry called for enquiry:', enquiry.id);
    console.log('🔍 Service types:', enquiry.serviceDetails?.serviceTypes);

    // Use itemPhotos from serviceDetails (same as ServiceModule)
    const itemPhotos = (enquiry.serviceDetails as any)?.itemPhotos || [];

    if (itemPhotos.length > 0) {
      console.log('🔍 Using itemPhotos:', itemPhotos);
      return itemPhotos;
    }

    // Fallback: create items from service types that have product/item info
    const itemsFromServices = new Map();

    if (enquiry.serviceDetails?.serviceTypes) {
      enquiry.serviceDetails.serviceTypes.forEach(service => {
        const product = service.product;
        const itemIndex = service.itemIndex;

        console.log('🔍 Processing service:', {
          type: service.type,
          product: product,
          itemIndex: itemIndex,
          hasProduct: !!product,
          hasItemIndex: !!itemIndex
        });

        if (product && itemIndex) {
          const key = `${product}-${itemIndex}`;
          if (!itemsFromServices.has(key)) {
            itemsFromServices.set(key, {
              product,
              itemIndex,
              photos: { before: [], after: [], received: [], other: [] } // Default empty photos structure
            });
            console.log('🔍 Added item to map:', key);
          }
        } else {
          console.log('🔍 Service missing product or itemIndex, skipping');
        }
      });
    }

    console.log('🔍 Items from services map size:', itemsFromServices.size);
    console.log('🔍 Items from services:', Array.from(itemsFromServices.values()));

    // If no items found from services, create default single item
    if (itemsFromServices.size === 0) {
      console.log('🔍 Creating default single item');
      return [{
        product: enquiry.product,
        itemIndex: 1,
        photos: { before: [], after: [], received: [], other: [] }
      }];
    }

    return Array.from(itemsFromServices.values());
  };

  const getItemsWithServices = (enquiry: BillingEnquiry) => {
    const items = getAllItemsFromEnquiry(enquiry);
    return items.map(item => {
      const itemKey = `${item.product}-${item.itemIndex}`;
      const services = getServicesForItem(enquiry, itemKey);
      return {
        ...item,
        itemKey,
        services
      };
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Unified validation and form update system
  const validateAndUpdateField = (
    fieldType: 'price' | 'gstRate' | 'discount',
    value: string,
    index?: number
  ) => {
    let error = "";
    let numValue = 0;
    let fieldKey = "";

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

    setValidationErrors(prev => ({
      ...prev,
      [fieldKey]: error
    }));

    if (!error && index !== undefined) {
      const fieldName = fieldType === 'price' ? 'originalAmount' :
        fieldType === 'gstRate' ? 'gstRate' : 'discountValue';
      updateServiceItem(index, fieldName as keyof BillingItem, numValue);
    }

    return { isValid: !error, numValue, error };
  };

  console.log('🔍 BillingModule - enquiries:', enquiries);
  console.log('🔍 BillingModule - enquiriesLoading:', enquiriesLoading);
  console.log('🔍 BillingModule - enquiriesError:', enquiriesError);

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('🔍 BillingModule - filteredEnquiries:', filteredEnquiries);

  // Check if a specific row has any validation errors
  const hasRowValidationErrors = (index: number): boolean => {
    const priceError = validationErrors[`item-${index}-originalAmount`];
    const gstError = validationErrors[`item-${index}-gstRate`];
    const discountError = validationErrors[`item-${index}-discountValue`];
    return !!(priceError || gstError || discountError);
  };

  // Check if all form data is valid before calculating
  const isFormDataValid = (): boolean => {
    const hasValidationErrors = Object.values(validationErrors).some(error => error !== "");
    if (hasValidationErrors) {
      console.log('🧮 Skipping calculation - validation errors present:', validationErrors);
      return false;
    }

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
    const { items, gstIncluded } = billingForm;

    if (!items || items.length === 0) {
      console.log('🧮 No items to calculate');
      return;
    }

    if (!isFormDataValid()) {
      console.log('🧮 Skipping calculation - form data is invalid');
      return;
    }

    const updatedItems = items.map(item => {
      let serviceFinalAmount = item.originalAmount;
      let serviceDiscountAmount = 0;
      let serviceGstAmount = 0;

      // Calculate service-level discount
      if (item.discountValue && item.discountValue > 0) {
        serviceDiscountAmount = (item.originalAmount * item.discountValue) / 100;
        serviceDiscountAmount = Math.min(serviceDiscountAmount, item.originalAmount);
        serviceFinalAmount = item.originalAmount - serviceDiscountAmount;
      }

      // Calculate service-level GST
      if (gstIncluded && item.gstRate && item.gstRate > 0) {
        serviceGstAmount = (serviceFinalAmount * item.gstRate) / 100;
      }

      return {
        ...item,
        discountAmount: Math.round(serviceDiscountAmount * 100) / 100,
        finalAmount: Math.round(serviceFinalAmount * 100) / 100,
        gstAmount: Math.round(serviceGstAmount * 100) / 100
      };
    });

    // Calculate totals
    const totalOriginalAmount = updatedItems.reduce((sum, item) => sum + item.originalAmount, 0);
    const totalServiceGst = updatedItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.finalAmount, 0);
    const totalAmount = subtotal + totalServiceGst;

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
  };

  // Update individual service item
  const updateServiceItem = (index: number, field: keyof BillingItem, value: any, isRawInput: boolean = false) => {
    console.log('🔧 Updating service item:', index, field, value, 'isRawInput:', isRawInput);

    if (isRawInput) {
      const fieldKey = `item-${index}-${field}`;
      setRawInputValues(prev => ({
        ...prev,
        [fieldKey]: value
      }));
      return;
    }

    setBillingForm(prev => ({
      ...prev,
      items: prev.items?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));

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

    setValidationErrors(prev => ({
      ...prev,
      [fieldKey]: error
    }));
  };

  // Save billing details
  const saveBillingDetails = async (enquiryId: number) => {
    console.log('🔄 Starting save billing details for enquiry:', enquiryId);

    if (!selectedEnquiry) {
      console.log('❌ No selected enquiry');
      toast({
        title: "Please select an enquiry",
        description: "You must select an enquiry before proceeding.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    const hasValidationErrors = Object.values(validationErrors).some(error => error !== "");
    if (hasValidationErrors) {
      console.log('❌ Validation errors present:', validationErrors);
      toast({
        title: "Please fix all validation errors before saving",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    const hasRequiredFields = billingForm.items?.every(item => {
      const priceValid = item.originalAmount >= 0;
      const gstValid = item.gstRate >= 0;
      return priceValid && gstValid;
    });

    const hasEmptyRequiredFields = billingForm.items?.some((item, index) => {
      const priceEmpty = !rawInputValues[`item-${index}-originalAmount`] && !item.originalAmount;
      const gstEmpty = !rawInputValues[`item-${index}-gstRate`] && !item.gstRate;
      return priceEmpty || gstEmpty;
    });

    if (hasEmptyRequiredFields) {
      console.log('❌ Empty required fields detected');
      toast({
        title: "Please fill in all required fields (Price and GST Rate) for each service",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    if (!hasRequiredFields) {
      console.log('❌ Invalid required fields');
      toast({
        title: "Please ensure all fields have valid values before saving",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    try {
      console.log('🔄 Preparing billing data for API...');
      const currentBusinessInfo = businessInfo || businessInfoStorage.get();

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
        businessInfo: currentBusinessInfo,
        notes: billingForm.notes || "",
        items: billingForm.items || []
      };

      console.log('🔄 Sending billing data to API:', billingData);

      await createBilling(enquiryId, billingData);

      console.log('✅ Billing details saved successfully via API');

      // Reset form
      setBillingForm({
        finalAmount: 0,
        gstIncluded: true,
        gstRate: 18,
        subtotal: 0,
        totalAmount: 0,
        items: [],
        notes: ""
      });
      setShowBillingDialog(null);
      setSelectedEnquiry(null);

      toast({
        title: "Billing details saved successfully!",
        description: "You can now proceed to the next step.",
        className: "max-w-md bg-green-50 border-green-200 text-green-800",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Failed to save billing details:', error);
      toast({
        title: "Failed to save billing details. Please try again.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
    }
  };

  // Convert BillingEnquiry to Enquiry for InvoiceDisplay compatibility
  const convertBillingEnquiryToEnquiry = (billingEnquiry: BillingEnquiry): Enquiry => {
    const currentBusinessInfo = businessInfo || businessInfoStorage.get();

    return {
      id: billingEnquiry.id,
      name: billingEnquiry.customerName,
      location: billingEnquiry.address,
      number: billingEnquiry.phone,
      customerName: billingEnquiry.customerName,
      phone: billingEnquiry.phone,
      address: billingEnquiry.address,
      message: '',
      inquiryType: 'Website' as any,
      product: billingEnquiry.product as any,
      quantity: billingEnquiry.quantity,
      products: [], // Empty array for now - could be populated from service details
      date: new Date().toISOString().split('T')[0],
      status: 'converted' as any,
      contacted: true,
      currentStage: billingEnquiry.currentStage as any,
      serviceDetails: billingEnquiry.serviceDetails ? {
        ...billingEnquiry.serviceDetails,
        serviceTypes: billingEnquiry.serviceDetails.serviceTypes?.map(st => ({
          ...st,
          type: st.type as any,
          status: st.status as any,
          product: st.product as any,
          itemIndex: st.itemIndex,
          photos: {
            before: [],
            after: [],
            received: [],
            other: []
          }
        })),
        overallPhotos: {
          beforePhoto: undefined,
          afterPhoto: undefined,
          beforeNotes: undefined,
          afterNotes: undefined
        },
        billingDetails: billingEnquiry.serviceDetails.billingDetails ? {
          ...billingEnquiry.serviceDetails.billingDetails,
          businessInfo: currentBusinessInfo
        } : undefined
      } as any : undefined
    };
  };

  // Generate invoice PDF
  const generateInvoicePDF = async (enquiryId: number) => {
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry?.serviceDetails?.billingDetails) {
      toast({
        title: "No billing details found. Please create billing first.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tempDiv);

      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      root.render(React.createElement(InvoiceDisplay, { enquiry: convertBillingEnquiryToEnquiry(enquiry) }));

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      root.unmount();
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft >= pdfHeight) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Invoice-${enquiry.serviceDetails.billingDetails.invoiceNumber}.pdf`);

      toast({
        title: "Invoice PDF downloaded successfully!",
        description: `Filename: Invoice-${enquiry.serviceDetails.billingDetails.invoiceNumber}.pdf`,
        className: "max-w-md bg-green-50 border-green-200 text-green-800",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error generating PDF. Please try again.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
    }
  };

  // Send invoice
  const sendInvoice = (enquiryId: number) => {
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry?.serviceDetails?.billingDetails) {
      toast({
        title: "No billing details found. Please create billing first.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    toast({
      title: `Invoice sent to ${enquiry.customerName} via WhatsApp!`,
      description: `Amount: ₹${enquiry.serviceDetails.billingDetails.totalAmount}`,
      className: "max-w-md bg-green-50 border-green-200 text-green-800",
      duration: 3000,
    });
  };

  // Move to delivery
  const handleMoveToDelivery = async (enquiryId: number) => {
    console.log('🔄 Moving enquiry to delivery stage:', enquiryId);

    try {
      await moveToDelivery(enquiryId);

      console.log('✅ Enquiry moved to delivery stage successfully via API');

      const enquiry = enquiries.find(e => e.id === enquiryId);
      if (enquiry) {
        toast({
          title: `Moved ${enquiry.customerName}'s ${enquiry.product} to delivery stage!`,
          className: "max-w-md bg-green-50 border-green-200 text-green-800",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Failed to move enquiry to delivery stage:', error);
      toast({
        title: "Failed to move to delivery stage. Please try again.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
    }
  };

  // Initialize billing form when enquiry is selected
  const initializeBillingForm = (enquiry: BillingEnquiry) => {
    console.log('🔧 Initializing billing form for enquiry:', enquiry);
    console.log('🔧 Service types:', enquiry.serviceDetails?.serviceTypes);

    // Clear validation errors and raw input values
    setValidationErrors({});
    setRawInputValues({});

    setSelectedEnquiry(enquiry);

    // Create billing items based on all services with their associated products/items
    const billingItems: BillingItem[] = [];

    if (enquiry.serviceDetails?.serviceTypes) {
      enquiry.serviceDetails.serviceTypes.forEach((service, index) => {
        // Extract product and itemIndex from service (if available)
        const product = service.product || enquiry.product;
        const itemIndex = service.itemIndex || (index + 1);

        console.log('🔧 Processing service:', {
          type: service.type,
          product: product,
          itemIndex: itemIndex,
          workNotes: service.workNotes,
          hasExplicitProduct: !!service.product,
          hasExplicitItemIndex: !!service.itemIndex
        });

        billingItems.push({
          serviceType: service.type,
          originalAmount: 0, // Start with 0, user must enter
          discountValue: 0,
          discountAmount: 0,
          finalAmount: 0,
          gstRate: 18, // Individual GST rate per service
          gstAmount: 0, // Individual GST amount per service
          description: service.workNotes || '',
          // Add product and item context for display
          productName: product,
          itemIndex: itemIndex
        });
      });
    }

    console.log('🔧 Created billing items:', billingItems);

    setBillingForm({
      finalAmount: 0,
      gstIncluded: true,
      gstRate: 18,
      subtotal: 0,
      totalAmount: 0,
      items: billingItems,
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
      toast({
        title: "Enquiry not found!",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
      return;
    }

    if (!enquiry.serviceDetails?.billingDetails) {
      console.error('❌ No billing details found for enquiry:', enquiryId);
      toast({
        title: "No billing details found. Please create billing first.",
        className: "max-w-md bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      });
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingBilling}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Pending Billing
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.invoicesGenerated}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Invoices Generated
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                ₹{statsLoading
                  ? <Loader2 className="h-6 w-6 animate-spin inline" />
                  : Number(stats.totalBilled || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total Billed
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.invoicesSent}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Invoices Sent
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
          {filteredEnquiries.map((enquiry) => {
            console.log('🔍 Rendering enquiry:', enquiry.id, enquiry.customerName);
            console.log('🔍 Enquiry service types:', enquiry.serviceDetails?.serviceTypes);

            const itemsWithServices = getItemsWithServices(enquiry);
            console.log('🔍 Items with services:', itemsWithServices);

            const selectedItem = selectedItemByEnquiry[enquiry.id.toString()] || (itemsWithServices[0]?.itemKey || null);
            const servicesForSelectedItem = selectedItem ? getServicesForItem(enquiry, selectedItem) : [];

            return (
              <Card
                key={enquiry.id}
                className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 relative"
              >
                {/* Badge group - always top-right */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                  <Badge className={`${enquiry.serviceDetails?.billingDetails ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'} text-xs px-2 py-1 rounded-full font-medium`}>
                    {enquiry.serviceDetails?.billingDetails ? 'Billed' : 'Pending Billing'}
                  </Badge>
                  {enquiry.serviceDetails?.billingDetails?.invoiceNumber && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                      {enquiry.serviceDetails.billingDetails.invoiceNumber}
                    </Badge>
                  )}
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

                  {/* Item dropdown to scope the entire card */}

                </div>

                <div className="space-y-3">
                  {/* Product info */}


                  {/* Products display like CRMModule */}
                  {enquiry.products && enquiry.products.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {enquiry.products.map((product, index) => (
                        <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          <span>{product.product}</span>
                          <span>({product.quantity})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">
                      Estimated: ₹{safeToFixed(enquiry.serviceDetails?.estimatedCost)}
                    </span>
                  </div>
                  {itemsWithServices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Select Item</Label>
                      <Select
                        value={selectedItem || undefined}
                        onValueChange={(v) => setSelectedItemByEnquiry(prev => ({ ...prev, [enquiry.id.toString()]: v }))}
                      >
                        <SelectTrigger className="h-8 w-56">
                          <SelectValue placeholder="Choose item" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemsWithServices.map((item) => (
                            <SelectItem key={item.itemKey} value={item.itemKey}>
                              <div className="flex items-center justify-between w-full">
                                <span>{item.product} — {item.itemIndex}</span>
                                {item.services.length > 0 && (
                                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                    {item.services.length} service{item.services.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Current Billing Status */}
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
                                (sum, item) => sum + (Number(item.discountAmount) || 0),
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

                  {/* Services for Selected Item */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">
                        Services for Selected Item:
                      </h4>
                      {selectedItem && (
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const [product, itemIndex] = selectedItem.split('-');
                            return `${product} ${itemIndex}`;
                          })()}
                        </div>
                      )}
                    </div>
                    {servicesForSelectedItem.length > 0 ? (
                      <div className="space-y-2">
                        {servicesForSelectedItem.map((service, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-foreground">{service.type}</span>
                              <Badge className="bg-green-500 text-white text-xs">
                                {capitalizeFirst(service.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedItem ? (
                      <div className="text-sm text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
                        No services found for this item
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Select an item to view its services
                      </div>
                    )}
                  </div>

                  {/* All Items with Services Summary */}
                  {itemsWithServices.length > 1 && (
                    <div className="space-y-2 mt-4 pt-3 border-t border-muted">
                      <h4 className="text-sm font-medium text-foreground">All Items Summary:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {itemsWithServices.map((item) => (
                          <div key={item.itemKey} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.product} {item.itemIndex}</span>
                            </div>
                            <Badge
                              className={`text-xs ${item.services.length > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'}`}
                            >
                              {item.services.length} service{item.services.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Services Overview - Show each service as separate item */}

                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {!enquiry.serviceDetails?.billingDetails ? (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm col-span-full"
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
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        onClick={() => handleMoveToDelivery(enquiry.id)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Move to Delivery
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Loading and error states */}
        {enquiriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
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
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Billing - {selectedEnquiry.customerName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* GST Included Checkbox */}
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
                <h4 className="text-lg font-medium text-foreground mb-4">Service Pricing by Item</h4>
                <div className="space-y-4">
                  {billingForm.items?.map((item, index) => (
                    <Card key={`${item.serviceType}-${index}`} className="p-4 border-l-4 border-l-blue-500">
                      <div className="space-y-4">
                        {/* Service and Product Info Header */}
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-blue-600 text-white">
                              {item.serviceType}
                            </Badge>
                            <div className="flex items-center space-x-2 text-sm text-blue-700">
                              <span className="font-medium">
                                {item.productName} {item.itemIndex}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                              className="text-right"
                            />
                            {validationErrors[`item-${index}-originalAmount`] && (
                              <p className="text-xs text-red-500 mt-1">{validationErrors[`item-${index}-originalAmount`]}</p>
                            )}
                          </div>

                          {/* Individual GST Rate */}
                          <div>
                            <Label htmlFor={`gstRate-${index}`}>GST Rate (%) </Label>
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
                              placeholder="0"
                              className="text-right"
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
                              className="text-right"
                            />
                            {validationErrors[`item-${index}-discountValue`] && (
                              <p className="text-xs text-red-500 mt-1">{validationErrors[`item-${index}-discountValue`]}</p>
                            )}
                          </div>

                          {/* Service Total */}
                          <div>
                            <Label className="text-sm font-medium">Total (₹)</Label>
                            <div className="flex items-center h-10 px-3 bg-green-50 border rounded-md">
                              {hasRowValidationErrors(index) ? (
                                <span className="text-red-500 font-bold">---</span>
                              ) : (
                                <span className="text-green-600 font-bold text-lg">
                                  ₹{safeToFixed((item.finalAmount || 0) + (item.gstAmount || 0))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Service Description */}
                        <div>
                          <Label htmlFor={`description-${index}`}>Service Notes (Optional)</Label>
                          <Textarea
                            id={`description-${index}`}
                            value={item.description || ''}
                            onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                            placeholder="Add service-specific notes"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Calculation Summary */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  Overall Calculation Summary
                </h4>
                {Object.values(validationErrors).some(error => error !== "") ? (
                  <div className="text-center py-4">
                    <div className="text-red-500 font-medium mb-2">⚠️ Validation Errors Present</div>
                    <div className="text-sm text-muted-foreground">Please fix all validation errors to see totals</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Breakdown by service */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {billingForm.items?.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="text-sm font-medium text-blue-600 mb-2">
                            {item.serviceType} - {item.productName} {item.itemIndex}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Base:</span>
                              <span>₹{safeToFixed(item.originalAmount)}</span>
                            </div>
                            {(item.discountAmount || 0) > 0 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Discount:</span>
                                <span>-₹{safeToFixed(item.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>After Discount:</span>
                              <span>₹{safeToFixed(item.finalAmount)}</span>
                            </div>
                            {billingForm.gstIncluded && (item.gstAmount || 0) > 0 && (
                              <div className="flex justify-between text-blue-600">
                                <span>GST ({item.gstRate}%):</span>
                                <span>+₹{safeToFixed(item.gstAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span>Service Total:</span>
                              <span>₹{safeToFixed((item.finalAmount || 0) + (item.gstAmount || 0))}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall totals */}
                    <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Original Amount:</span>
                          <span className="font-medium">₹{safeToFixed(billingForm.finalAmount)}</span>
                        </div>
                        {billingForm.items && billingForm.items.some(item => (item.discountAmount || 0) > 0) && (
                          <div className="flex justify-between text-orange-600">
                            <span>Total Service Discounts:</span>
                            <span className="font-medium">-₹{safeToFixed(billingForm.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-blue-600">
                          <span>Subtotal (After Discounts):</span>
                          <span>₹{safeToFixed(billingForm.subtotal)}</span>
                        </div>
                        {billingForm.gstIncluded && (billingForm.gstAmount || 0) > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span>Total GST:</span>
                            <span className="font-medium">+₹{safeToFixed(billingForm.gstAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-bold border-t-2 border-green-500 pt-2 text-green-600">
                          <span>Final Total:</span>
                          <span>₹{safeToFixed(billingForm.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
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
                  onClick={() => setShowBillingDialog(null)}
                  className="w-24 h-10 bg-red-500 text-white hover:bg-red-600 font-medium"
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