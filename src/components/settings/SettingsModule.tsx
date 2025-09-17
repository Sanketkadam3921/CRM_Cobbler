// REMOVED: localStorage imports - Reason: Replacing with backend API integration
// import { resetToSampleData } from "@/utils/localStorage";
// import { businessInfoStorage } from "@/utils/localStorage";

// REMOVED: Hardcoded staff data - Reason: Will be loaded from backend database
// const staffMembers: StaffMember[] = [
//   { id: 1, name: "Ramesh Kumar", role: "Senior Technician", email: "ramesh@example.com", phone: "+91 98765 43210", status: "active" },
//   { id: 2, name: "Suresh Patel", role: "Pickup Staff", email: "suresh@example.com", phone: "+91 87654 32109", status: "active" },
//   { id: 3, name: "Mahesh Singh", role: "Junior Technician", email: "mahesh@example.com", phone: "+91 76543 21098", status: "inactive" },
// ];

// export function SettingsModule() {
//   const [staff, setStaff] = useState<StaffMember[]>(staffMembers);
//   const [showStaffForm, setShowStaffForm] = useState(false);
//   const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
//   const [staffFormData, setStaffFormData] = useState({
//     name: "",
//     role: "",
//     email: "",
//     phone: "",
//     status: "active" as "active" | "inactive"
//   });
//   const [notifications, setNotifications] = useState({
//     emailAlerts: true,
//     smsAlerts: false,
//     lowStockAlerts: true,
//     orderUpdates: true,
//     customerApprovals: true,
//   });

//   const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
//     businessName: "Ranjit's Shoe & Bag Repair",
//     ownerName: "Ranjit Kumar",
//     phone: "+91 98765 43210",
//     email: "ranjit@example.com",
//     address: "123 MG Road, Pune, Maharashtra",
//     gstNumber: "27XXXXX1234X1Z5",
//     timezone: "Asia/Kolkata",
//     currency: "INR",
//     logo: undefined,
//     website: "www.ranjitsrepair.com",
//     tagline: "Quality Repair Services"
//   });

//   // Load business info from localStorage
//   useEffect(() => {
//     const savedBusinessInfo = businessInfoStorage.get();
//     setBusinessInfo(savedBusinessInfo);
//   }, []);

//   const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const logoData = e.target?.result as string;
//         setBusinessInfo(prev => ({ ...prev, logo: logoData }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeLogo = () => {
//     setBusinessInfo(prev => ({ ...prev, logo: undefined }));
//   };

//   const saveBusinessInfo = () => {
//     businessInfoStorage.save(businessInfo);
//     alert("Business information saved successfully!");
//   };

//   // Staff Management Functions
//   const resetStaffForm = () => {
//     setStaffFormData({
//       name: "",
//       role: "",
//       email: "",
//       phone: "",
//       status: "active"
//     });
//     setShowStaffForm(false);
//     setEditingStaff(null);
//   };

//   const handleAddStaff = () => {
//     resetStaffForm();
//     setShowStaffForm(true);
//   };

//   const handleEditStaff = (staffMember: StaffMember) => {
//     setStaffFormData({
//       name: staffMember.name,
//       role: staffMember.role,
//       email: staffMember.email,
//       phone: staffMember.phone,
//       status: staffMember.status
//     });
//     setEditingStaff(staffMember);
//     setShowStaffForm(true);
//   };

//   const handleDeleteStaff = (id: number) => {
//     setShowDeleteConfirm(id);
//   };

//   const confirmDeleteStaff = () => {
//     if (showDeleteConfirm) {
//       setStaff(prev => prev.filter(member => member.id !== showDeleteConfirm));
//       setShowDeleteConfirm(null);
//     }
//   };

//   const handleStaffSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (editingStaff) {
//       // Update existing staff member
//       setStaff(prev => prev.map(member => 
//         member.id === editingStaff.id 
//           ? { ...member, ...staffFormData }
//           : member
//       ));
//     } else {
//       // Add new staff member
//       const newStaff: StaffMember = {
//         id: Math.max(...staff.map(s => s.id)) + 1,
//         ...staffFormData
//       };
//       setStaff(prev => [...prev, newStaff]);
//     }
    
//     resetStaffForm();
//   };

//   const validateStaffForm = () => {
//     const errors = [];
//     if (!staffFormData.name.trim()) errors.push("Name is required");
//     if (!staffFormData.role.trim()) errors.push("Role is required");
//     if (!staffFormData.email.trim()) errors.push("Email is required");
//     if (!staffFormData.phone.trim()) errors.push("Phone is required");
//     if (staffFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffFormData.email)) {
//       errors.push("Please enter a valid email address");
//     }
//     return errors;
//   };

//   return (
//     <div className="space-y-6 animate-fade-in">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-foreground">Settings</h1>
//         <p className="text-muted-foreground">Configure system settings and preferences</p>
//       </div>

//       <Tabs defaultValue="business" className="space-y-6">
//         <TabsList className="grid w-full grid-cols-3">
//           <TabsTrigger value="business" className="flex items-center space-x-2">
//             <Settings className="h-4 w-4" />
//             <span className="hidden sm:inline">Business</span>
//           </TabsTrigger>
//           <TabsTrigger value="staff" className="flex items-center space-x-2">
//             <User className="h-4 w-4" />
//             <span className="hidden sm:inline">Staff</span>
//           </TabsTrigger>
//           <TabsTrigger value="security" className="flex items-center space-x-2">
//             <Shield className="h-4 w-4" />
//             <span className="hidden sm:inline">Security</span>
//           </TabsTrigger>
//         </TabsList>

//         {/* Business Settings */}
//         <TabsContent value="business" className="space-y-6">
//           <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//             <h3 className="text-lg font-semibold text-foreground mb-4">Business Information</h3>
//             <div className="space-y-6">
//               {/* Logo Upload */}
//               <div className="space-y-4">
//                 <h4 className="font-medium text-foreground">Business Logo</h4>
//                 <div className="flex items-center space-x-4">
//                   {businessInfo.logo ? (
//                     <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
//                       <img
//                         src={businessInfo.logo}
//                         alt="Business Logo"
//                         className="w-full h-full object-contain"
//                       />
//                     </div>
//                   ) : (
//                     <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
//                       <ImageIcon className="h-8 w-8 text-gray-400" />
//                     </div>
//                   )}
//                   <div className="space-y-2">
//                     <div className="flex space-x-2">
//                       <Button variant="outline" size="sm" onClick={() => document.getElementById('logoUpload')?.click()}>
//                         <Upload className="h-4 w-4 mr-2" />
//                         Upload Logo
//                       </Button>
//                       {businessInfo.logo && (
//                         <Button variant="outline" size="sm" onClick={removeLogo}>
//                           <Trash2 className="h-4 w-4 mr-2" />
//                           Remove
//                         </Button>
//                       )}
//                     </div>
//                     <p className="text-xs text-muted-foreground">
//                       Recommended: 200x200px, PNG or JPG format
//                     </p>
//                     <input
//                       id="logoUpload"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleLogoUpload}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <Separator />

//               {/* Business Details */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="businessName">Business Name</Label>
//                   <Input
//                     id="businessName"
//                     value={businessInfo.businessName}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="tagline">Tagline</Label>
//                   <Input
//                     id="tagline"
//                     value={businessInfo.tagline}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
//                     placeholder="Quality Repair Services"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="ownerName">Owner Name</Label>
//                   <Input
//                     id="ownerName"
//                     value={businessInfo.ownerName}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, ownerName: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="website">Website</Label>
//                   <Input
//                     id="website"
//                     value={businessInfo.website}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
//                     placeholder="www.yourbusiness.com"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="phone">Phone Number</Label>
//                   <Input
//                     id="phone"
//                     value={businessInfo.phone}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="email">Email Address</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     value={businessInfo.email}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2 md:col-span-2">
//                   <Label htmlFor="address">Business Address</Label>
//                   <Textarea
//                     id="address"
//                     value={businessInfo.address}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="gstNumber">GST Number</Label>
//                   <Input
//                     id="gstNumber"
//                     value={businessInfo.gstNumber}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, gstNumber: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="timezone">Timezone</Label>
//                   <Select value={businessInfo.timezone} onValueChange={(value) => setBusinessInfo({ ...businessInfo, timezone: value })}>
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
//                       <SelectItem value="Asia/Mumbai">Asia/Mumbai (IST)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <div className="flex justify-end mt-6">
//                 <Button onClick={saveBusinessInfo} className="bg-gradient-primary hover:opacity-90">
//                   <Save className="h-4 w-4 mr-2" />
//                   Save Changes
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         </TabsContent>

//         {/* Staff Management */}
//         <TabsContent value="staff" className="space-y-6">
//           <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-semibold text-foreground">Staff Management</h3>
//               <Button onClick={handleAddStaff} className="bg-gradient-primary hover:opacity-90">
//                 <UserPlus className="h-4 w-4 mr-2" />
//                 Add Staff Member
//               </Button>
//             </div>
//             <div className="space-y-4">
//               {staff.map((member) => (
//                 <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
//                       {member.name.split(' ').map(n => n[0]).join('')}
//                     </div>
//                     <div>
//                       <div className="font-medium text-foreground">{member.name}</div>
//                       <div className="text-sm text-muted-foreground">{member.role}</div>
//                       <div className="text-xs text-muted-foreground">{member.email} • {member.phone}</div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Badge variant={member.status === "active" ? "default" : "secondary"}>
//                       {member.status}
//                     </Badge>
//                     <Button 
//                       size="sm" 
//                       variant="outline"
//                       onClick={() => handleEditStaff(member)}
//                     >
//                       <Edit className="h-3 w-3 mr-1" />
//                       Edit
//                     </Button>
//                     <Button 
//                       size="sm" 
//                       variant="outline"
//                       onClick={() => handleDeleteStaff(member.id)}
//                       className="text-red-600 hover:bg-red-50"
//                     >
//                       <Trash2 className="h-3 w-3" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </Card>
//         </TabsContent>

//         {/* Security Settings */}
//         <TabsContent value="security" className="space-y-6">
//           <Card className="p-6 bg-gradient-card border-0 shadow-soft">
//             <h3 className="text-lg font-semibold text-foreground mb-4">Security & Access</h3>
//             <div className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="currentPassword">Current Password</Label>
//                   <Input id="currentPassword" type="password" placeholder="Enter current password" />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="newPassword">New Password</Label>
//                   <Input id="newPassword" type="password" placeholder="Enter new password" />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="confirmPassword">Confirm New Password</Label>
//                   <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
//                 </div>
//               </div>
//               <Separator />
//               <div className="space-y-4">
//                 <h4 className="font-medium text-foreground">Role Permissions</h4>
//                 <div className="space-y-3">
//                   <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                     <span className="text-sm text-foreground">Admin Access</span>
//                     <Badge>Full Access</Badge>
//                   </div>
//                   <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
//                     <span className="text-sm text-foreground">Staff Access</span>
//                     <Badge variant="secondary">Limited Access</Badge>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="flex justify-end mt-6">
//               <Button className="bg-gradient-primary hover:opacity-90">
//                 <Save className="h-4 w-4 mr-2" />
//                 Update Security
//               </Button>
//             </div>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Staff Form Modal */}
//       {showStaffForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-xl font-bold text-gray-900">
//                   {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
//                 </h2>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={resetStaffForm}
//                 >
//                   <X className="h-4 w-4 text-red-600" />
//                 </Button>
//               </div>

//               <form onSubmit={handleStaffSubmit} className="space-y-4">
//                 <div>
//                   <Label htmlFor="staffName" className="text-sm font-medium text-gray-700">
//                     Full Name <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="staffName"
//                     type="text"
//                     value={staffFormData.name}
//                     onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
//                     placeholder="Enter full name"
//                     required
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="staffRole" className="text-sm font-medium text-gray-700">
//                     Role/Position <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="staffRole"
//                     type="text"
//                     value={staffFormData.role}
//                     onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
//                     placeholder="e.g., Senior Technician, Pickup Staff"
//                     required
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="staffEmail" className="text-sm font-medium text-gray-700">
//                     Email Address <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="staffEmail"
//                     type="email"
//                     value={staffFormData.email}
//                     onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
//                     placeholder="Enter email address"
//                     required
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="staffPhone" className="text-sm font-medium text-gray-700">
//                     Phone Number <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="staffPhone"
//                     type="tel"
//                     value={staffFormData.phone}
//                     onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
//                     placeholder="Enter phone number"
//                     required
//                     className="mt-1"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="staffStatus" className="text-sm font-medium text-gray-700">
//                     Status
//                   </Label>
//                   <Select
//                     value={staffFormData.status}
//                     onValueChange={(value: "active" | "inactive") => 
//                       setStaffFormData({ ...staffFormData, status: value })
//                     }
//                   >
//                     <SelectTrigger className="mt-1">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="active">Active</SelectItem>
//                       <SelectItem value="inactive">Inactive</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="flex space-x-3 mt-6">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     className="flex-1"
//                     onClick={resetStaffForm}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
//                   >
//                     {editingStaff ? "Update Staff" : "Add Staff"}
//                   </Button>
//                 </div>
//               </form>
//             </div>
//           </Card>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <Card className="w-full max-w-md">
//             <div className="p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-xl font-bold text-gray-900">
//                   Confirm Delete
//                 </h2>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowDeleteConfirm(null)}
//                 >
//                   <X className="h-4 w-4 text-red-600" />
//                 </Button>
//               </div>

//               <div className="mb-6">
//                 <p className="text-gray-600">
//                   Are you sure you want to delete this staff member? This action cannot be undone.
//                 </p>
//               </div>

//               <div className="flex space-x-3">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   className="flex-1"
//                   onClick={() => setShowDeleteConfirm(null)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="button"
//                   className="flex-1 bg-red-600 hover:bg-red-700 text-white"
//                   onClick={confirmDeleteStaff}
//                 >
//                   Delete
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }
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

// REMOVED: Hardcoded staff data - Reason: Will be loaded from backend database
// const staffMembers: StaffMember[] = [
//   { id: 1, name: "Ramesh Kumar", role: "Senior Technician", email: "ramesh@example.com", phone: "+91 98765 43210", status: "active" },
//   { id: 2, name: "Suresh Patel", role: "Pickup Staff", email: "suresh@example.com", phone: "+91 87654 32109", status: "active" },
//   { id: 3, name: "Mahesh Singh", role: "Junior Technician", email: "mahesh@example.com", phone: "+91 76543 21098", status: "inactive" },
// ];

export function SettingsModule() {
  // ADDED: Loading states - Reason: Handle async API operations with proper user feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isBusinessLoading, setIsBusinessLoading] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);

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
        alert('Failed to load settings. Please refresh the page.');
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

  // MODIFIED: Save business info to backend - Reason: Replace localStorage with API call
  const saveBusinessInfo = async () => {
    console.log('[SettingsModule] User clicked save business info');
    setIsBusinessLoading(true);
    
    try {
      const savedBusinessInfo = await SettingsApiService.saveBusinessInfo(businessInfo);
      setBusinessInfo(savedBusinessInfo);
      console.log('[SettingsModule] Business information saved successfully to backend');
      alert("Business information saved successfully!");
    } catch (error) {
      console.error('[SettingsModule] Failed to save business information:', error);
      alert("Failed to save business information. Please try again.");
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
      } catch (error) {
        console.error('[SettingsModule] Failed to delete staff member:', error);
        alert("Failed to delete staff member. Please try again.");
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
      alert("Please fix the following errors:\n" + validationErrors.join('\n'));
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
      } else {
        // Add new staff member via API
        const newStaff = await SettingsApiService.createStaff(staffFormData);
        // Add to local state with response from API
        setStaff(prev => [...prev, newStaff]);
        console.log('[SettingsModule] Staff member created successfully via backend, id:', newStaff.id);
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
      
      alert(errorMessage);
    } finally {
      setIsStaffLoading(false);
    }
  };

  const validateStaffForm = () => {
    const errors = [];
    if (!staffFormData.name.trim()) errors.push("Name is required");
    if (!staffFormData.role.trim()) errors.push("Role is required");
    if (!staffFormData.email.trim()) errors.push("Email is required");
    if (!staffFormData.phone.trim()) errors.push("Phone is required");
    if (staffFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffFormData.email)) {
      errors.push("Please enter a valid email address");
    }
    return errors;
  };

  // REMOVED: Notification settings handling - Reason: User requested to remove notification features

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      {/* ADDED: Loading indicator - Reason: Show loading state during initial data fetch */}
      {isLoading && (
        <Card className="p-6 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading settings...</span>
          </div>
        </Card>
      )}

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card className="p-6 bg-gradient-card border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-4">Business Information</h3>
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Business Logo</h4>
                <div className="flex items-center space-x-4">
                  {businessInfo.logo ? (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      <img
                        src={businessInfo.logo}
                        alt="Business Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('logoUpload')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      {businessInfo.logo && (
                        <Button variant="outline" size="sm" onClick={removeLogo}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 200x200px, PNG or JPG format
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessInfo.businessName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                  />
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
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={businessInfo.ownerName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, ownerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                    placeholder="www.yourbusiness.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={businessInfo.gstNumber}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, gstNumber: e.target.value })}
                  />
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
              <div className="flex justify-end mt-6">
                {/* MODIFIED: Save button with loading state - Reason: Show backend save operation progress */}
                <Button 
                  onClick={saveBusinessInfo} 
                  className="bg-gradient-primary hover:opacity-90"
                  disabled={isBusinessLoading}
                >
                  {isBusinessLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Staff Management */}
        <TabsContent value="staff" className="space-y-6">
          <Card className="p-6 bg-gradient-card border-0 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Staff Management</h3>
              <Button 
                onClick={handleAddStaff} 
                className="bg-gradient-primary hover:opacity-90"
                disabled={isStaffLoading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </div>
            
            {/* ADDED: Loading state for staff section - Reason: Show backend data loading progress */}
            {isStaffLoading && staff.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span>Loading staff members...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {staff.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No staff members found. Click "Add Staff Member" to get started.
                  </div>
                ) : (
                  staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.role}</div>
                          <div className="text-xs text-muted-foreground">{member.email} • {member.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditStaff(member)}
                          disabled={isStaffLoading}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteStaff(member.id!)}
                          className="text-red-600 hover:bg-red-50"
                          disabled={isStaffLoading}
                        >
                          <Trash2 className="h-3 w-3" />
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
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 bg-gradient-card border-0 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-4">Security & Access</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                </div>
              </div>
              <Separator />
              
              {/* REMOVED: Notification Settings Integration - Reason: User requested to remove notification features */}
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Role Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">Admin Access</span>
                    <Badge>Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-foreground">Staff Access</span>
                    <Badge variant="secondary">Limited Access</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button className="bg-gradient-primary hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Update Security
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetStaffForm}
                  disabled={isStaffLoading}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="staffName" className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staffName"
                    type="text"
                    value={staffFormData.name}
                    onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="mt-1"
                    disabled={isStaffLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="staffRole" className="text-sm font-medium text-gray-700">
                    Role/Position <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staffRole"
                    type="text"
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                    placeholder="e.g., Senior Technician, Pickup Staff"
                    required
                    className="mt-1"
                    disabled={isStaffLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="staffEmail" className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
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
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staffPhone"
                    type="tel"
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                    className="mt-1"
                    disabled={isStaffLoading}
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

                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={resetStaffForm}
                    disabled={isStaffLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isStaffLoading}
                  >
                    {isStaffLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {editingStaff ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      editingStaff ? "Update Staff" : "Add Staff"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Confirm Delete
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isStaffLoading}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600">
                  Are you sure you want to delete this staff member? This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isStaffLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDeleteStaff}
                  disabled={isStaffLoading}
                >
                  {isStaffLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}