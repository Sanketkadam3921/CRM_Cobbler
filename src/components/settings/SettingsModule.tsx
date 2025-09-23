import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// REMOVED: Switch import - Reason: No longer using notification switches
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, Save, UserPlus, Trash2, RefreshCw, Upload, Image as ImageIcon, X, Edit } from "lucide-react";
// REMOVED: localStorage imports - Reason: Replacing with backend API integration
// import { resetToSampleData } from "@/utils/localStorage";
// import { businessInfoStorage } from "@/utils/localStorage";
// ADDED: Backend API service integration - Reason: Replacing localStorage with proper backend APIs
import { SettingsApiService } from "@/services/settingsApiService";
import { BusinessInfo, StaffMember, NotificationSettings } from "@/types";
import { toast } from "sonner";

// REMOVED: Hardcoded staff data - Reason: Will be loaded from backend database
// const staffMembers: StaffMember[] = [
//   { id: 1, name: "Ramesh Kumar", role: "Senior Technician", email: "ramesh@example.com", phone: "+91 98765 43210", status: "active" },
//   { id: 2, name: "Suresh Patel", role: "Pickup Staff", email: "suresh@example.com", phone: "+91 87654 32109", status: "active" },
//   { id: 3, name: "Mahesh Singh", role: "Junior Technician", email: "mahesh@example.com", phone: "+91 76543 21098", status: "inactive" },
// ];


// Enhanced email validation function
const validateEmail = (email: string): boolean => {
  // More strict email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Additional checks for common invalid patterns
  if (!emailRegex.test(email)) return false;

  // Check for valid TLD (Top Level Domain) - at least 2 characters
  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1];
  const domainParts = domain.split('.');

  // Must have at least one dot in domain
  if (domainParts.length < 2) return false;

  // Last part (TLD) should be at least 2 characters and only letters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
};

export function SettingsModule() {
  // ADDED: Loading states - Reason: Handle async API operations with proper user feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  // ADDED: Business validation errors state - Reason: Track validation errors for inline display
  const [businessValidationErrors, setBusinessValidationErrors] = useState<{ [key: string]: string }>({});

  // MODIFIED: Staff state initialization - Reason: Load from backend instead of hardcoded data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive"
  });

  // MODIFIED: Business info state initialization - Reason: Load from backend instead of localStorage
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    logo: undefined,
    website: "",
    tagline: ""
  });

  // ADDED: Initialize data loading on component mount - Reason: Load all settings from backend
  useEffect(() => {
    const initializeSettings = async () => {
      setIsLoading(true);
      console.log('[SettingsModule] Initializing settings from backend');

      try {
        await Promise.all([
          loadBusinessInfo(),
          loadStaffMembers()
        ]);
        console.log('[SettingsModule] All settings loaded successfully');
      } catch (error) {
        console.error('[SettingsModule] Failed to initialize settings:', error);
        toast.error('Failed to load settings. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []);

  // ADDED: Load business information from backend - Reason: Replace localStorage with API calls
  const loadBusinessInfo = async () => {
    try {
      console.log('[SettingsModule] Loading business information from backend');
      setIsBusinessLoading(true);

      const businessData = await SettingsApiService.getBusinessInfo();
      if (businessData) {
        setBusinessInfo(businessData);
        console.log('[SettingsModule] Business information loaded successfully:', businessData.businessName);
      } else {
        console.log('[SettingsModule] No business information found, using defaults');
        // Keep default values if no data exists
      }
    } catch (error) {
      console.error('[SettingsModule] Failed to load business information:', error);
      // Keep default values on error
    } finally {
      setIsBusinessLoading(false);
    }
  };

  // ADDED: Load staff members from backend - Reason: Replace hardcoded data with API calls
  const loadStaffMembers = async () => {
    try {
      console.log('[SettingsModule] Loading staff members from backend');
      setIsStaffLoading(true);

      const staffData = await SettingsApiService.getAllStaff();
      setStaff(staffData);
      console.log('[SettingsModule] Staff members loaded successfully, count:', staffData.length);
    } catch (error) {
      console.error('[SettingsModule] Failed to load staff members:', error);
      setStaff([]); // Set empty array on error
    } finally {
      setIsStaffLoading(false);
    }
  };

  // REMOVED: Notification settings loading - Reason: User requested to remove notification features

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[SettingsModule] User initiated logo upload');
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setBusinessInfo(prev => ({ ...prev, logo: logoData }));
        console.log('[SettingsModule] Logo uploaded and set in state, size:', logoData.length);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    console.log('[SettingsModule] User removed logo');
    setBusinessInfo(prev => ({ ...prev, logo: undefined }));
  };

  // ADDED: Business information validation - Reason: Add proper validation for mandatory fields
  const validateBusinessInfo = () => {
    const errors: { [key: string]: string } = {};

    // Required fields validation
    if (!businessInfo.businessName.trim()) errors.businessName = "Business Name is required";
    if (!businessInfo.ownerName.trim()) errors.ownerName = "Owner Name is required";
    if (!businessInfo.phone.trim()) errors.phone = "Phone Number is required";
    if (!businessInfo.email.trim()) errors.email = "Email Address is required";
    if (!businessInfo.address.trim()) errors.address = "Business Address is required";

    // Format validation
    if (businessInfo.phone && !/^[0-9]{10}$/.test(businessInfo.phone)) {
      errors.phone = "Phone number must be exactly 10 digits";
    }
    // if (businessInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessInfo.email)) {
    //   errors.email = "Please enter a valid email address";
    // }

    if (businessInfo.email && !validateEmail(businessInfo.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (businessInfo.website && businessInfo.website.trim() && !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(businessInfo.website.replace(/^www\./, ''))) {
      errors.website = "Please enter a valid website URL (e.g., example.com)";
    }
    if (businessInfo.gstNumber && businessInfo.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(businessInfo.gstNumber)) {
      errors.gstNumber = "Please enter a valid GST number (15 characters)";
    }

    return errors;
  };

  // MODIFIED: Save business info to backend with validation - Reason: Add proper validation before saving
  const saveBusinessInfo = async () => {
    console.log('[SettingsModule] User clicked save business info');

    // Validate business information before saving
    const validationErrors = validateBusinessInfo();
    setBusinessValidationErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    setIsBusinessLoading(true);

    try {
      const savedBusinessInfo = await SettingsApiService.saveBusinessInfo(businessInfo);
      setBusinessInfo(savedBusinessInfo);
      setBusinessValidationErrors({}); // Clear validation errors on success

      // Update localStorage so other components can access updated business info immediately
      const { businessInfoStorage } = await import('@/utils/localStorage');
      businessInfoStorage.save(savedBusinessInfo);

      console.log('[SettingsModule] Business information saved successfully to backend and localStorage');
      toast.success("Business information saved successfully!");
    } catch (error) {
      console.error('[SettingsModule] Failed to save business information:', error);
      toast.error("Failed to save business information. Please try again.");
    } finally {
      setIsBusinessLoading(false);
    }
  };

  // Staff Management Functions
  const resetStaffForm = () => {
    console.log('[SettingsModule] Resetting staff form');
    setStaffFormData({
      name: "",
      role: "",
      email: "",
      phone: "",
      status: "active"
    });
    setShowStaffForm(false);
    setEditingStaff(null);
  };

  const handleAddStaff = () => {
    console.log('[SettingsModule] User clicked add staff');
    resetStaffForm();
    setShowStaffForm(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    console.log('[SettingsModule] User clicked edit staff:', staffMember.name);
    setStaffFormData({
      name: staffMember.name,
      role: staffMember.role,
      email: staffMember.email,
      phone: staffMember.phone,
      status: staffMember.status
    });
    setEditingStaff(staffMember);
    setShowStaffForm(true);
  };

  const handleDeleteStaff = (id: number) => {
    console.log('[SettingsModule] User clicked delete staff, id:', id);
    setShowDeleteConfirm(id);
  };

  // MODIFIED: Confirm delete staff with API call - Reason: Delete from backend database
  const confirmDeleteStaff = async () => {
    if (showDeleteConfirm) {
      console.log('[SettingsModule] User confirmed delete staff, id:', showDeleteConfirm);
      setIsStaffLoading(true);

      try {
        const deleted = await SettingsApiService.deleteStaff(showDeleteConfirm);
        if (deleted) {
          // Remove from local state after successful deletion
          setStaff(prev => prev.filter(member => member.id !== showDeleteConfirm));
          console.log('[SettingsModule] Staff member deleted successfully from backend');
        }
        setShowDeleteConfirm(null);
        toast.success("Staff member deleted successfully");
      } catch (error) {
        console.error('[SettingsModule] Failed to delete staff member:', error);
        toast.error("Failed to delete staff member. Please try again.");
      } finally {
        setIsStaffLoading(false);
      }
    }
  };

  // MODIFIED: Handle staff submit with API calls - Reason: Save to backend instead of local state
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SettingsModule] User submitted staff form, editing:', !!editingStaff);

    const validationErrors = validateStaffForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(", "));
      return;
    }

    setIsStaffLoading(true);

    try {
      if (editingStaff) {
        // Update existing staff member via API
        const updatedStaff = await SettingsApiService.updateStaff(editingStaff.id!, staffFormData);
        // Update local state with response from API
        setStaff(prev => prev.map(member =>
          member.id === editingStaff.id ? updatedStaff : member
        ));
        console.log('[SettingsModule] Staff member updated successfully via backend');
        toast.success("Staff member updated successfully");
      } else {
        // Add new staff member via API
        const newStaff = await SettingsApiService.createStaff(staffFormData);
        // Add to local state with response from API
        setStaff(prev => [...prev, newStaff]);
        console.log('[SettingsModule] Staff member created successfully via backend, id:', newStaff.id);
        toast.success("Staff member added successfully");
      }

      resetStaffForm();
    } catch (error) {
      console.error('[SettingsModule] Failed to save staff member:', error);
      let errorMessage = "Failed to save staff member. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          errorMessage = "A staff member with this email already exists.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Staff member not found. Please refresh the page.";
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsStaffLoading(false);
    }
  };

  const validateStaffForm = () => {
    const errors = [];
    if (!staffFormData.name.trim()) errors.push("Name is required");
    if (staffFormData.name && !/^[a-zA-Z\s.'-]+$/.test(staffFormData.name.trim())) {
      errors.push("Name should only contain letters, spaces, periods, apostrophes, and hyphens");
    }
    if (!staffFormData.role.trim()) errors.push("Role is required");
    if (!staffFormData.email.trim()) errors.push("Email is required");
    if (!staffFormData.phone.trim()) errors.push("Phone is required");
    if (staffFormData.phone && !/^[0-9]{10}$/.test(staffFormData.phone)) {
      errors.push("Phone number must be exactly 10 digits");
    }
    // if (staffFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffFormData.email)) {
    //   errors.push("Please enter a valid email address");
    // }

    if (staffFormData.email && !validateEmail(staffFormData.email)) {
      errors.push("Please enter a valid email address");
    }

    return errors;
  };

  // REMOVED: Notification settings handling - Reason: User requested to remove notification features

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
            Settings
          </h1>
          <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Configure system settings and preferences
          </p>
        </div>

        {/* ADDED: Loading indicator - Reason: Show loading state during initial data fetch */}
        {isLoading && (
          <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm sm:text-base">Loading settings...</span>
            </div>
          </Card>
        )}

        <Tabs defaultValue="business" className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 border border-slate-200">
            <TabsTrigger
              value="business"
              className="flex items-center justify-center space-x-1 sm:space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-700 data-[state=active]:font-semibold transition-all duration-200 text-xs sm:text-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="inline">Business</span>
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="flex items-center justify-center space-x-1 sm:space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-700 data-[state=active]:font-semibold transition-all duration-200 text-xs sm:text-sm"
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center justify-center space-x-1 sm:space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-blue-700 data-[state=active]:font-semibold transition-all duration-200 text-xs sm:text-sm"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Settings */}
          <TabsContent value="business" className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Business Information</h3>
              <div className="space-y-4 sm:space-y-6">
                {/* Logo Upload */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-slate-900 text-sm sm:text-base">Business Logo</h4>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    {businessInfo.logo ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        <img
                          src={businessInfo.logo}
                          alt="Business Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-row space-x-2">
                        <Button variant="outline" size="sm" onClick={() => document.getElementById('logoUpload')?.click()}>
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Upload Logo</span>
                        </Button>
                        {businessInfo.logo && (
                          <Button
                            size="sm"
                            onClick={removeLogo}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Remove</span>
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Recommended: PNG, JPG, JPEG format
                      </p>
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium text-slate-700">Business Name <span className="text-gray-600">*</span></Label>
                    <Input
                      id="businessName"
                      value={businessInfo.businessName}
                      onChange={(e) => {
                        // Allow only letters, numbers, spaces, and common business name characters
                        let value = e.target.value.replace(/[^a-zA-Z0-9\s&.,'-]/g, '');
                        setBusinessInfo({ ...businessInfo, businessName: value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.businessName) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.businessName;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter business name"
                      required
                      className={businessValidationErrors.businessName ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.businessName && (
                      <p className="text-sm text-red-600">{businessValidationErrors.businessName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={businessInfo.tagline}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                      placeholder="Quality Repair Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name <span className="text-gray-600">*</span></Label>
                    <Input
                      id="ownerName"
                      value={businessInfo.ownerName}
                      onChange={(e) => {
                        // Allow only letters, spaces, periods, apostrophes, and hyphens
                        let value = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                        setBusinessInfo({ ...businessInfo, ownerName: value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.ownerName) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.ownerName;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter owner name"
                      required
                      className={businessValidationErrors.ownerName ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.ownerName && (
                      <p className="text-sm text-red-600">{businessValidationErrors.ownerName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={businessInfo.website}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Remove http:// or https:// if user enters it
                        value = value.replace(/^https?:\/\//, '');
                        setBusinessInfo({ ...businessInfo, website: value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.website) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.website;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="www.yourbusiness.com"
                      className={businessValidationErrors.website ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.website && (
                      <p className="text-sm text-red-600">{businessValidationErrors.website}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number <span className="text-gray-600">*</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => {
                        // Allow only numeric digits and limit to 10 characters
                        let value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length > 10) {
                          value = value.substring(0, 10);
                        }
                        setBusinessInfo({ ...businessInfo, phone: value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.phone) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.phone;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      required
                      className={businessValidationErrors.phone ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.phone && (
                      <p className="text-sm text-red-600">{businessValidationErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-gray-600">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => {
                        setBusinessInfo({ ...businessInfo, email: e.target.value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.email) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.email;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter email address"
                      required
                      className={businessValidationErrors.email ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.email && (
                      <p className="text-sm text-red-600">{businessValidationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Business Address <span className="text-gray-600">*</span></Label>
                    <Textarea
                      id="address"
                      value={businessInfo.address}
                      onChange={(e) => {
                        setBusinessInfo({ ...businessInfo, address: e.target.value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.address) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.address;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter complete business address"
                      required
                      className={businessValidationErrors.address ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.address && (
                      <p className="text-sm text-red-600">{businessValidationErrors.address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={businessInfo.gstNumber}
                      onChange={(e) => {
                        // Allow only alphanumeric characters and limit to 15 characters
                        let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        if (value.length > 15) {
                          value = value.substring(0, 15);
                        }
                        setBusinessInfo({ ...businessInfo, gstNumber: value });
                        // Clear validation error when user starts typing
                        if (businessValidationErrors.gstNumber) {
                          setBusinessValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.gstNumber;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter 15-character GST number"
                      maxLength={15}
                      className={businessValidationErrors.gstNumber ? "border-red-500" : ""}
                    />
                    {businessValidationErrors.gstNumber && (
                      <p className="text-sm text-red-600">{businessValidationErrors.gstNumber}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={businessInfo.timezone} onValueChange={(value) => setBusinessInfo({ ...businessInfo, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="Asia/Mumbai">Asia/Mumbai (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                  {/* MODIFIED: Save button with loading state - Reason: Show backend save operation progress */}
                  <Button
                    onClick={saveBusinessInfo}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 w-full sm:w-auto"
                    disabled={isBusinessLoading}
                  >
                    {isBusinessLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm sm:text-base">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span className="text-sm sm:text-base">Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Staff Management */}
          <TabsContent value="staff" className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">Staff Management</h3>
                <Button
                  onClick={handleAddStaff}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full sm:w-auto"
                  disabled={isStaffLoading}
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Add Staff Member</span>
                </Button>
              </div>

              {/* ADDED: Loading state for staff section - Reason: Show backend data loading progress */}
              {isStaffLoading && staff.length === 0 ? (
                <div className="flex items-center justify-center p-6 sm:p-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm sm:text-base">Loading staff members...</span>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {staff.length === 0 ? (
                    <div className="text-center p-6 sm:p-8 text-slate-500">
                      <p className="text-sm sm:text-base">No staff members found. Click "Add Staff Member" to get started.</p>
                    </div>
                  ) : (
                    staff.map((member) => (
                      <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-slate-900 text-sm sm:text-base truncate">{member.name}</div>
                              <Badge
                                variant={member.status === "active" ? "default" : "destructive"}
                                className={`text-xs font-medium px-2 py-1 ${member.status === "active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                                  }`}
                              >
                                {member.status === "active" ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600">{member.role}</div>
                            <div className="text-xs text-slate-500 truncate">{member.email} • {member.phone}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStaff(member)}
                            disabled={isStaffLoading}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors flex-1 sm:flex-none"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="text-xs sm:text-sm">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteStaff(member.id!)}
                            className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
                            disabled={isStaffLoading}
                          >
                            <Trash2 className="h-3 w-3 sm:mr-1" />
                            <span className="text-xs sm:text-sm sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Security & Access</h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="Enter current password" className="text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="Enter new password" className="text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm new password" className="text-sm" />
                  </div>
                </div>
                <Separator />

                {/* REMOVED: Notification Settings Integration - Reason: User requested to remove notification features */}

                <Separator />

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-slate-900 text-sm sm:text-base">Role Permissions</h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-900">Admin Access</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Full Access</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs sm:text-sm text-slate-900">Staff Access</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Limited Access</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Update Security</span>
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Staff Form Modal */}
        {showStaffForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <Card className="w-full max-w-sm sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={resetStaffForm}
                    disabled={isStaffLoading}
                    className="text-gray-600 hover:text-black hover:bg-transparent"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>

                <form onSubmit={handleStaffSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="staffName" className="text-sm font-medium text-slate-700">
                      Full Name <span className="text-gray-600">*</span>
                    </Label>
                    <Input
                      id="staffName"
                      type="text"
                      value={staffFormData.name}
                      onChange={(e) => {
                        // Allow only letters, spaces, periods, apostrophes, and hyphens
                        let value = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                        setStaffFormData({ ...staffFormData, name: value });
                      }}
                      placeholder="Enter full name"
                      required
                      className="mt-1"
                      disabled={isStaffLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="staffRole" className="text-sm font-medium text-gray-700">
                      Role/Position <span className="text-gray-600">*</span>
                    </Label>
                    <Input
                      id="staffRole"
                      type="text"
                      value={staffFormData.role}
                      onChange={(e) => {
                        // Allow only letters, spaces, and common role characters
                        let value = e.target.value.replace(/[^a-zA-Z\s&.,'-]/g, '');
                        setStaffFormData({ ...staffFormData, role: value });
                      }}
                      placeholder="e.g., Senior Technician, Pickup Staff"
                      required
                      className="mt-1"
                      disabled={isStaffLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="staffEmail" className="text-sm font-medium text-gray-700">
                      Email Address <span className="text-gray-600">*</span>
                    </Label>
                    <Input
                      id="staffEmail"
                      type="email"
                      value={staffFormData.email}
                      onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                      className="mt-1"
                      disabled={isStaffLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="staffPhone" className="text-sm font-medium text-gray-700">
                      Phone Number <span className="text-gray-600">*</span>
                    </Label>
                    <Input
                      id="staffPhone"
                      type="tel"
                      value={staffFormData.phone}
                      onChange={(e) => {
                        // Allow only numeric digits and limit to 10 characters
                        let value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length > 10) {
                          value = value.substring(0, 10);
                        }
                        setStaffFormData({ ...staffFormData, phone: value });
                      }}
                      placeholder="Enter 10-digit phone number"
                      required
                      className="mt-1"
                      disabled={isStaffLoading}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                    />
                  </div>

                  <div>
                    <Label htmlFor="staffStatus" className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <Select
                      value={staffFormData.status}
                      onValueChange={(value: "active" | "inactive") =>
                        setStaffFormData({ ...staffFormData, status: value })
                      }
                      disabled={isStaffLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
                    <Button
                      type="button"
                      className="flex-1 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                      onClick={resetStaffForm}
                      disabled={isStaffLoading}
                    >
                      <span className="text-sm">Cancel</span>
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      disabled={isStaffLoading}
                    >
                      {isStaffLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          <span className="text-sm">{editingStaff ? "Updating..." : "Adding..."}</span>
                        </>
                      ) : (
                        <span className="text-sm">{editingStaff ? "Update Staff" : "Add Staff"}</span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <Card className="w-full max-w-sm sm:max-w-md">
              <div className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Confirm Delete
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={isStaffLoading}
                    className="text-gray-600 hover:text-black hover:bg-transparent"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>

                <div className="mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base text-slate-600">
                    Are you sure you want to delete this staff member? This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 w-full sm:w-auto"
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={isStaffLoading}
                  >
                    <span className="text-sm">Cancel</span>
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    onClick={confirmDeleteStaff}
                    disabled={isStaffLoading}
                  >
                    {isStaffLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm">Deleting...</span>
                      </>
                    ) : (
                      <span className="text-sm">Delete</span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}