import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Instagram,
  Facebook,
  MessageCircle,
  Briefcase,
  ShoppingBag,
  Edit,
  Save,
  X,
  Phone,
  PhoneCall,
  CheckCircle,
  ArrowRight,
  Loader2,
  // New product-specific icons
  Wallet,
  AlarmSmoke,
  Sofa,
  Package,
  Footprints,
  Trash2,
  CircleCheck,
  MapPin,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Enquiry } from "@/types";
import { useEnquiriesWithPolling, useCrmStats } from "@/services/enquiryApiService";

// Helper function to get business-appropriate stage display
const getStageDisplay = (stage: string): string => {
  switch (stage) {
    case "enquiry":
      return "New Enquiry";
    case "pickup":
      return "Pickup Stage";
    case "service":
      return "In Service";
    case "delivery":
      return "Ready for Delivery";
    case "completed":
      return "Completed";
    default:
      return stage;
  }
};

const getStatusDisplay = (status: string): string => {
  switch (status) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "converted":
      return "Converted";
    case "closed":
      return "Closed";
    default:
      return status;
  }
};

// Helper function to get stage badge color
const getStageBadgeColor = (stage: string): string => {
  switch (stage) {
    case "enquiry":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "pickup":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "service":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "delivery":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface CRMModuleProps {
  activeAction?: string | null;
}

export function CRMModule({ activeAction }: CRMModuleProps = {}) {
  const { toast } = useToast();

  // Use API hooks with 30-second polling
  const {
    enquiries,
    loading: enquiriesLoading,
    error: enquiriesError,
    addEnquiry,
    updateEnquiry,
    deleteEnquiry
  } = useEnquiriesWithPolling(30000);

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useCrmStats();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Enquiry>>({});

  // Convert dialog state
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertingEnquiry, setConvertingEnquiry] = useState<Enquiry | null>(null);
  const [quotedAmount, setQuotedAmount] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    location: "",
    message: "",
    enquiryType: "",
    product: "",
    quantity: ""
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Use stats from API instead of calculating locally
  const calculatedStats = stats || {
    totalCurrentMonth: 0,
    newThisWeek: 0,
    converted: 0,
    pendingFollowUp: 0
  };

  const formatDateForDisplay = (isoDateString) => {
    // Return early if there's no date to prevent errors
    if (!isoDateString) {
      return "N/A";
    }

    // Handle a date that might already be in dd/mm/yyyy string format
    if (isoDateString.includes('/')) {
      return isoDateString;
    }

    const date = new Date(isoDateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Handle active action from quick actions
  useEffect(() => {
    if (activeAction === "add-enquiry") {
      setShowForm(true);
    }
  }, [activeAction]);

  // Individual field validation functions
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'name':
      case 'customerName':
        if (!value.trim()) {
          return "Customer name is required";
        } else if (value.trim().length < 2) {
          return "Name must be at least 2 characters long";
        }
        break;

      case "number":
      case "phone":
        if (!value.trim()) {
          return "Phone number is required";
        } else {
          // Remove all spaces and invalid characters (only digits and + allowed at start)
          const cleanNumber = value.replace(/[^\d+]/g, "");

          // Regex: either 10 digits OR +91 followed by 10 digits
          const phoneRegex = /^([6-9]\d{9}|\+91[6-9]\d{9})$/;

          if (!phoneRegex.test(cleanNumber)) {
            return "Please enter a valid Indian phone number (10 digits, or +91 followed by 10 digits)";
          }
        }
        break;

      case 'location':
      case 'address':
        // Address is optional, so no validation needed
        break;

      case 'message':
        // Message is optional, so no validation needed
        break;

      case 'enquiryType':
      case 'inquiryType':
        if (!value) {
          return "Please select an enquiry source";
        }
        break;

      case 'product':
        if (!value) {
          return "Please select a product type";
        }
        break;

      case 'quantity': {
        const numValue = parseInt(value);
        if (!value || value.trim() === "") {
          return "Quantity is required";
        } else if (isNaN(numValue)) {
          return "Quantity must be a valid number";
        } else if (numValue < 1) {
          return "Quantity must be at least 1";
        }
        break;
      }
    }
    return "";
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Validate only required fields
    const requiredFields = ['name', 'number', 'enquiryType', 'product', 'quantity'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        errors[field] = error;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: { [key: string]: string } = {};

    // Get current enquiry data
    const currentEnquiry = enquiries.find(e => e.id === editingId);
    if (!currentEnquiry) return false;

    // Validate required fields using editData or fallback to current values
    const fieldsToValidate = [
      { key: 'customerName', formKey: 'name' },
      { key: 'phone', formKey: 'number' },
      { key: 'product', formKey: 'product' },
      { key: 'quantity', formKey: 'quantity' }
    ];

    fieldsToValidate.forEach(({ key, formKey }) => {
      const value = editData[key] !== undefined ? editData[key] : currentEnquiry[key];
      const error = validateField(formKey, String(value || ''));
      if (error) {
        errors[key] = error;
      }
    });

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (): Promise<void> => {
    // Validate only required fields
    if (!validateForm()) {
      const errorCount = Object.keys(formErrors).length;
      const fieldLabels: { [key: string]: string } = {
        name: "Customer Name",
        number: "Phone Number",
        enquiryType: "Enquiry Source",
        product: "Product Type",
        quantity: "Quantity",
      };

      const errorList = Object.keys(formErrors).map(
        (field) => `• ${fieldLabels[field] || field}: ${formErrors[field]}`
      );

      toast({
        title: `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""}`,
        description: (
          <div className="space-y-1">
            {errorList.map((error, index) => (
              <div key={index} className="text-sm">
                {error}
              </div>
            ))}
          </div>
        ),
        className: "max-w-md bg-orange-50 border-orange-200 text-orange-800",
      });

      return;
    }

    try {
      // Send data to backend
      await addEnquiry({
        customerName: formData.name,
        phone: formData.number.replace(/\D/g, ""),
        address: formData.location?.trim() || "N/A",
        message: formData.message?.trim() || "No message",

        inquiryType: formData.enquiryType as "Instagram" | "Facebook" | "WhatsApp",
        product: formData.product as
          | "Bag"
          | "Shoe"
          | "Wallet"
          | "Belt"
          | "All type furniture",
        quantity: parseInt(formData.quantity) || 1,
        date: new Date().toISOString().split("T")[0],
        status: "new",
        contacted: false,
        currentStage: "enquiry",
        // include the redundant fields to satisfy TypeScript
        number: formData.number.replace(/\D/g, ""),
        name: formData.name,
        location: formData.location || "",
      });

      // Reset form
      setFormData({
        name: "",
        number: "",
        location: "",
        message: "",
        enquiryType: "",
        product: "",
        quantity: "1",
      });
      setFormErrors({});
      setShowSuccess(true);

      // Auto close modal
      setTimeout(() => {
        setShowSuccess(false);
        setShowForm(false);
      }, 1000);
    } catch (error) {

    }
  };


  const handleEdit = (enquiry: Enquiry) => {
    setEditingId(enquiry.id);
    setEditData(enquiry);
    setEditErrors({}); // Clear any previous edit errors
  };

  const handleSaveEdit = async (id: number) => {
    // Run validation first
    if (!validateEditForm()) {
      const errorCount = Object.keys(editErrors).length;
      toast({
        title: `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''}`,
        description: "Please correct the validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedEnquiry = await updateEnquiry(id, editData);
      if (updatedEnquiry) {
        setEditingId(null);
        setEditData({});
        setEditErrors({});
        toast({
          title: "Success",
          description: "Enquiry updated successfully",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update enquiry",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setEditErrors({});
  };

  const handleDelete = async (enquiry: Enquiry) => {
    if (window.confirm(`Are you sure you want to delete the enquiry for ${enquiry.customerName}?`)) {
      try {
        await deleteEnquiry(enquiry.id);
        toast({
          title: "Enquiry Deleted",
          description: `${enquiry.customerName}'s enquiry has been deleted successfully.`,
          className: "bg-red-50 border-red-200 text-red-800",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete enquiry",
          variant: "destructive",
        });
      }
    }
  };

  const markAsConverted = (enquiry: Enquiry) => {
    setConvertingEnquiry(enquiry);
    setQuotedAmount(""); // Clear previous quoted amount
    setShowConvertDialog(true);
  };

  const schedulePickup = async (enquiry: Enquiry) => {
    try {
      const updatedEnquiry = await updateEnquiry(enquiry.id, {
        currentStage: "pickup" as const,
        status: "converted" as const,
      });

      if (updatedEnquiry) {
        toast({
          title: "Pickup Scheduled!",
          description: `${enquiry.customerName}'s item moved to pickup!`,
          className: "bg-green-50 border-green-200 text-green-800",
          duration: 1000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule pickup",
        variant: "destructive",
      });
    }
  };

  const getEnquiryIcon = (type: string) => {
    switch (type) {
      case "Instagram": return <Instagram className="h-4 w-4" />;
      case "Facebook": return <Facebook className="h-4 w-4" />;
      case "WhatsApp": return <MessageCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getProductIcon = (product: string) => {
    const iconMap = {
      "Bag": <Briefcase className="h-4 w-4" />,
      "Shoe": <Footprints className="h-4 w-4" />,
      "Wallet": <Wallet className="h-4 w-4" />,
      "Belt": <AlarmSmoke className="h-4 w-4" />,
      "All type furniture": <Sofa className="h-4 w-4" />
    };

    return iconMap[product] || <ShoppingBag className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800 border-blue-200";
      case "contacted": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "converted": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getContactStatus = (enquiry: Enquiry) => {
    if (enquiry.contacted) {
      const formattedDate = new Date(enquiry.contactedAt).toLocaleDateString('en-GB');

      return (
        <div className="flex items-center space-x-1 text-gray-500">
          <CircleCheck className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            Contacted ({formattedDate})
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1 text-gray-400">
          <Phone className="h-4 w-4" />
          <span className="text-sm">Not Contacted</span>
        </div>
      );
    }
  };

  const filteredEnquiries = enquiries
    .filter(enquiry =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by creation date in descending order (newest first)
      // If dates are the same, sort by ID in descending order (higher ID = newer)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getTime() === dateB.getTime()) {
        return b.id - a.id; // Higher ID first if dates are same
      }

      return dateB.getTime() - dateA.getTime(); // Newer date first
    });

  const showReviewSection = formData.product && parseInt(formData.quantity) > 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">CRM Module</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage customer enquiries and leads</p>
        </div>
        <Button onClick={() => {
          setShowForm(!showForm);
          if (!showForm) {
            setFormErrors({});
            setShowSuccess(false);
          }
        }} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-0" />
          Add Enquiry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-white border shadow-sm">
          <div className="text-lg sm:text-2xl font-bold text-gray-900">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : calculatedStats.totalCurrentMonth}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">This Month</div>
        </Card>
        <Card className="p-3 sm:p-4 bg-white border shadow-sm">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : calculatedStats.newThisWeek}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">This Week Pending</div>
        </Card>
        <Card className="p-3 sm:p-4 bg-white border shadow-sm">
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : calculatedStats.converted}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Converted</div>
        </Card>

      </div>

      {/* Add Enquiry Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border shadow-lg">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Add New Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Customer Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    let val = e.target.value;

                    // Allow only alphabets and spaces
                    if (!/^[A-Za-z ]*$/.test(val)) {
                      return; // Block invalid input
                    }

                    // Optional: normalize multiple spaces into one
                    val = val.replace(/\s+/g, " ");

                    setFormData({ ...formData, name: val });

                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: "" });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateField("name", e.target.value.trim());
                    if (error) {
                      setFormErrors({ ...formErrors, name: error });
                    }
                  }}
                  className={`mt-1 ${formErrors.name ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  placeholder="Enter customer name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="number" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => {
                    let val = e.target.value;

                    // Allow only digits, but keep + if it starts with +91
                    if (val.startsWith("+91")) {
                      val = "+91" + val.slice(3).replace(/\D/g, ""); // keep +91, remove non-digits
                      if (val.length > 13) val = val.slice(0, 13); // max +91 + 10 digits
                    } else {
                      val = val.replace(/\D/g, ""); // remove non-digits
                      if (val.length > 10) val = val.slice(0, 10); // max 10 digits
                    }

                    setFormData({ ...formData, number: val });

                    if (formErrors.number) {
                      setFormErrors({ ...formErrors, number: "" });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateField("number", e.target.value);
                    if (error) {
                      setFormErrors({ ...formErrors, number: error });
                    }
                  }}
                  className={`mt-1 ${formErrors.number ? "border-red-500 focus:border-red-500" : ""
                    }`}
                  placeholder="Enter phone number"
                />
                {formErrors.number && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.number}</p>
                )}
              </div>

              <div>
                <Label htmlFor="enquiryType" className="text-sm font-medium text-gray-700">Enquiry Source *</Label>
                <Select
                  value={formData.enquiryType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, enquiryType: value });
                    if (formErrors.enquiryType) {
                      setFormErrors({ ...formErrors, enquiryType: "" });
                    }
                    // Validate on change for select fields
                    const error = validateField('enquiryType', value);
                    if (error) {
                      setFormErrors({ ...formErrors, enquiryType: error });
                    }
                  }}
                >
                  <SelectTrigger className={`mt-1 ${formErrors.enquiryType ? 'border-red-500 focus:border-red-500' : ''}`}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.enquiryType && <p className="text-red-500 text-xs mt-1">{formErrors.enquiryType}</p>}
              </div>
              <div>
                <Label htmlFor="product" className="text-sm font-medium text-gray-700">Product Type *</Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => {
                    setFormData({ ...formData, product: value });
                    if (formErrors.product) {
                      setFormErrors({ ...formErrors, product: "" });
                    }
                    // Validate on change for select fields
                    const error = validateField('product', value);
                    if (error) {
                      setFormErrors({ ...formErrors, product: error });
                    }
                  }}
                >
                  <SelectTrigger className={`mt-1 ${formErrors.product ? 'border-red-500 focus:border-red-500' : ''}`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bag">Bag</SelectItem>
                    <SelectItem value="Shoe">Shoe</SelectItem>
                    <SelectItem value="Wallet">Wallet</SelectItem>
                    <SelectItem value="Belt">Belt</SelectItem>
                    <SelectItem value="All type furniture">All type furniture</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.product && <p className="text-red-500 text-xs mt-1">{formErrors.product}</p>}
              </div>
            </div>

            {/* Product Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Product Quantity *</Label>
                <Input
                  id="quantity"
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, quantity: value });
                    if (formErrors.quantity) {
                      setFormErrors({ ...formErrors, quantity: "" });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateField('quantity', e.target.value);
                    if (error) {
                      setFormErrors({ ...formErrors, quantity: error });
                    }
                  }}
                  placeholder="Enter quantity (e.g., 2)"
                  className={`mt-1 ${formErrors.quantity ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
              </div>
            </div>

            {/* Address Field - Full Width */}
            <div>
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">Address</Label>
              <Textarea
                id="location"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (formErrors.location) {
                    setFormErrors({ ...formErrors, location: "" });
                  }
                }}
                placeholder="Enter complete address (optional)"
                className={`mt-1 min-h-[80px] ${formErrors.location ? 'border-red-500 focus:border-red-500' : ''}`}
                rows={3}
              />
              {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (formErrors.message) {
                    setFormErrors({ ...formErrors, message: "" });
                  }
                }}
                placeholder="Customer's enquiry details (optional)"
                className={`mt-1 min-h-[100px] ${formErrors.message ? 'border-red-500 focus:border-red-500' : ''}`}
                rows={4}
              />
              {formErrors.message && <p className="text-red-500 text-xs mt-1">{formErrors.message}</p>}
            </div>

            {/* Review Section */}
            {showReviewSection && (
              <Card className="p-4 bg-blue-50 border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Review Selection</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">Product:</span>
                    <span className="text-gray-900">{formData.product}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <span className="text-gray-900 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {formData.quantity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getEnquiryIcon(formData.enquiryType)}
                    <span className="font-medium text-gray-700">Source:</span>
                    <span className="text-gray-900">{formData.enquiryType}</span>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                Save Enquiry
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setFormErrors({});
                  setShowSuccess(false);
                }}
                className="w-24 h-10 bg-red-500 text-white hover:bg-red-600 font-medium"
              >
                Cancel
              </Button>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-300 text-green-800 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Enquiry added successfully!</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      <Card className="p-3 sm:p-4 bg-white border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search enquiries"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Enquiries List */}
      <div className="space-y-3 sm:space-y-4">
        {enquiriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading enquiries...</span>
          </div>
        ) : enquiriesError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading enquiries</p>
              <p className="text-sm text-gray-500">{enquiriesError}</p>
            </div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No enquiries found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or add a new enquiry</p>
            </div>
          </div>
        ) : (
          filteredEnquiries.map((enquiry) => (
            <Card
              key={enquiry.id}
              className="p-4 sm:p-6 bg-white border shadow-sm hover:shadow-md transition-all duration-300"
            >
              {editingId === enquiry.id ? (
                // ================= Edit Mode =================
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">Edit Enquiry</h3>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(enquiry.id)}
                        className="w-24 h-10 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCancelEdit}
                        className="w-24 h-10 bg-red-500 text-white hover:bg-red-600 font-medium"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Customer Name *
                      </Label>
                      <Input
                        value={editData.customerName ?? enquiry.customerName}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!/^[A-Za-z ]*$/.test(val)) return; // block invalid input
                          val = val.replace(/\s+/g, " "); // normalize spaces
                          setEditData({ ...editData, customerName: val });
                          if (editErrors.customerName) {
                            setEditErrors({ ...editErrors, customerName: "" });
                          }
                        }}
                        onBlur={(e) => {
                          const error = validateField("customerName", e.target.value.trim());
                          if (error) {
                            setEditErrors({ ...editErrors, customerName: error });
                          }
                        }}
                        className={`mt-1 ${editErrors.customerName
                          ? "border-red-500 focus:border-red-500"
                          : ""
                          }`}
                        placeholder="Enter customer name"
                      />
                      {editErrors.customerName && (
                        <p className="text-red-500 text-xs mt-1">
                          {editErrors.customerName}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <Input
                        value={editData.phone ?? enquiry.phone}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val.startsWith("+91")) {
                            val = "+91" + val.slice(3).replace(/\D/g, "");
                            if (val.length > 13) val = val.slice(0, 13);
                          } else {
                            val = val.replace(/\D/g, "");
                            if (val.length > 10) val = val.slice(0, 10);
                          }
                          setEditData({ ...editData, phone: val });
                          if (editErrors.phone) {
                            setEditErrors({ ...editErrors, phone: "" });
                          }
                        }}
                        onBlur={(e) => {
                          const error = validateField("phone", e.target.value);
                          if (error) {
                            setEditErrors({ ...editErrors, phone: error });
                          }
                        }}
                        className={`mt-1 ${editErrors.phone ? "border-red-500 focus:border-red-500" : ""
                          }`}
                        placeholder="Enter phone number"
                      />
                      {editErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{editErrors.phone}</p>
                      )}
                    </div>

                    {/* Product */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Product Type *
                      </Label>
                      <Select
                        value={editData.product ?? enquiry.product}
                        onValueChange={(value) => {
                          setEditData({ ...editData, product: value });
                          if (editErrors.product) {
                            setEditErrors({ ...editErrors, product: "" });
                          }
                          const error = validateField("product", value);
                          if (error) {
                            setEditErrors({ ...editErrors, product: error });
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`mt-1 ${editErrors.product ? "border-red-500 focus:border-red-500" : ""
                            }`}
                        >
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bag">Bag</SelectItem>
                          <SelectItem value="Shoe">Shoe</SelectItem>
                          <SelectItem value="Wallet">Wallet</SelectItem>
                          <SelectItem value="Belt">Belt</SelectItem>
                          <SelectItem value="All type furniture">
                            All type furniture
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {editErrors.product && (
                        <p className="text-red-500 text-xs mt-1">{editErrors.product}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Quantity *
                      </Label>
                      <Input
                        type="text"
                        value={editData.quantity ?? enquiry.quantity}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setEditData({ ...editData, quantity: parseInt(val) || '' });
                          if (editErrors.quantity) {
                            setEditErrors({ ...editErrors, quantity: "" });
                          }
                        }}
                        onBlur={(e) => {
                          const error = validateField("quantity", String(editData.quantity || enquiry.quantity));
                          if (error) {
                            setEditErrors({ ...editErrors, quantity: error });
                          }
                        }}
                        placeholder="Enter quantity"
                        className={`mt-1 ${editErrors.quantity ? "border-red-500 focus:border-red-500" : ""
                          }`}
                      />
                      {editErrors.quantity && (
                        <p className="text-red-500 text-xs mt-1">{editErrors.quantity}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <Select
                        value={editData.status ?? enquiry.status}
                        onValueChange={(value) =>
                          setEditData({ ...editData, status: value as Enquiry["status"] })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Contacted */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Contacted</Label>
                      <Select
                        value={
                          editData.contacted !== undefined
                            ? editData.contacted.toString()
                            : enquiry.contacted.toString()
                        }
                        onValueChange={(value) =>
                          setEditData({ ...editData, contacted: value === "true" })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Not Contacted</SelectItem>
                          <SelectItem value="true">Contacted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Address</Label>
                    <Textarea
                      value={editData.address ?? enquiry.address}
                      onChange={(e) => {
                        setEditData({ ...editData, address: e.target.value });
                        if (editErrors.address) {
                          setEditErrors({ ...editErrors, address: "" });
                        }
                      }}
                      className={`mt-1 min-h-[80px] ${editErrors.address ? "border-red-500 focus:border-red-500" : ""
                        }`}
                      rows={2}
                    />
                    {editErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.address}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Message</Label>
                    <Textarea
                      value={editData.message ?? enquiry.message}
                      onChange={(e) => {
                        setEditData({ ...editData, message: e.target.value });
                        if (editErrors.message) {
                          setEditErrors({ ...editErrors, message: "" });
                        }
                      }}
                      className={`mt-1 min-h-[100px] ${editErrors.message ? "border-red-500 focus:border-red-500" : ""
                        }`}
                      rows={3}
                    />
                    {editErrors.message && (
                      <p className="text-red-500 text-xs mt-1">{editErrors.message}</p>
                    )}
                  </div>
                </div>
              ) : (
                // ================= View Mode =================
                <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {enquiry.customerName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(enquiry.status)}`}>
                          {getStatusDisplay(enquiry.status)}
                        </Badge>
                        <div className="flex items-center space-x-1 text-gray-500">
                          {getEnquiryIcon(enquiry.inquiryType)}
                          <span className="text-sm">{enquiry.inquiryType}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            Quantity: {enquiry.quantity}
                          </div>
                          <span className="text-gray-500 text-sm">{enquiry.product}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">
                          {enquiry.phone.startsWith("+91")
                            ? enquiry.phone
                            : `+91 ${enquiry.phone}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="ml-1">{enquiry.address || 'No address provided'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="ml-1">
                          {new Date(enquiry.date).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm sm:text-base mb-3">
                      {enquiry.message || 'No message provided'}
                    </p>
                    <div className="mt-3">{getContactStatus(enquiry)}</div>

                    {enquiry.status === "converted" && enquiry.quotedAmount && (
                      <div className="mt-2 flex items-center space-x-1 text-green-600">
                        <span className="text-sm font-medium">₹{enquiry.quotedAmount}</span>
                        <span className="text-xs text-gray-500">(Approx)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:ml-4 min-w-fit">
                    {enquiry.currentStage !== "enquiry" && (
                      <Badge
                        className={`${getStageBadgeColor(
                          enquiry.currentStage
                        )} text-xs px-2 py-1 rounded-full font-medium`}
                      >
                        {getStageDisplay(enquiry.currentStage)}
                      </Badge>
                    )}

                    {enquiry.currentStage === "enquiry" && enquiry.status === "new" && (
                      <Button
                        size="sm"
                        onClick={() => markAsConverted(enquiry)}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark as Converted
                      </Button>
                    )}

                    {enquiry.currentStage === "enquiry" &&
                      enquiry.status === "converted" && (
                        <Button
                          size="sm"
                          onClick={() => schedulePickup(enquiry)}
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Schedule Pickup
                        </Button>
                      )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(enquiry)}
                      className="w-full sm:w-auto border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Convert Enquiry Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {convertingEnquiry && (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{convertingEnquiry.customerName}</h4>
                  <p className="text-sm text-gray-600">{convertingEnquiry.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{convertingEnquiry.product}</span>
                    <span>•</span>
                    <span>Quantity: {convertingEnquiry.quantity}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotedAmount" className="text-sm font-medium text-gray-700">
                    Approx Amount (₹)
                  </Label>
                  <Input
                    id="quotedAmount"
                    type="text"
                    placeholder="1.00"
                    value={quotedAmount}
                    onChange={(e) => {
                      let value = e.target.value;

                      // Allow only numbers with up to 2 decimals
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        // Prevent leading zeros like 0, 01, 00, etc.
                        if (/^0\d+/.test(value)) return;

                        setQuotedAmount(value);
                      }
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Enter amount in format: 1.00 (must be 1 or greater)
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => {
                setShowConvertDialog(false);
                setConvertingEnquiry(null);
                setQuotedAmount("");
              }}
              className="w-24 h-10 bg-red-500 text-white hover:bg-red-600 font-medium"
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (convertingEnquiry && quotedAmount.trim()) {
                  const amount = parseFloat(quotedAmount);

                  // Block invalid or less than 1
                  if (isNaN(amount) || amount < 1) {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a valid quoted amount of 1 or greater.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const today = new Date();
                  const formattedDateForDB = today.toISOString();

                  const updatedEnquiry = {
                    ...convertingEnquiry,
                    status: "converted" as const,
                    contacted: true,
                    contactedAt: formattedDateForDB,
                    quotedAmount: amount,
                  };

                  const result = await updateEnquiry(convertingEnquiry.id, updatedEnquiry);
                  if (result) {
                    toast({
                      title: "Enquiry Converted!",
                      description: `${convertingEnquiry.customerName} has been marked as converted with quoted amount ₹${amount}.`,
                      className: "bg-blue-50 border-blue-200 text-blue-800",
                    });
                  }

                  setShowConvertDialog(false);
                  setConvertingEnquiry(null);
                  setQuotedAmount("");
                } else {
                  toast({
                    title: "Missing Information",
                    description: "Please enter a quoted amount of 1 or greater.",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Convert Enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}