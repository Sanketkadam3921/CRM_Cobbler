import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Bell, Shield, Database, Palette, Globe, Save, UserPlus, Trash2, RefreshCw, Upload, Image as ImageIcon, X, Edit } from "lucide-react";
import { resetToSampleData } from "@/utils/localStorage";
import { BusinessInfo } from "@/types";
import { businessInfoStorage } from "@/utils/localStorage";

interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

const staffMembers: StaffMember[] = [
  { id: 1, name: "Ramesh Kumar", role: "Senior Technician", email: "ramesh@example.com", phone: "+91 98765 43210", status: "active" },
  { id: 2, name: "Suresh Patel", role: "Pickup Staff", email: "suresh@example.com", phone: "+91 87654 32109", status: "active" },
  { id: 3, name: "Mahesh Singh", role: "Junior Technician", email: "mahesh@example.com", phone: "+91 76543 21098", status: "inactive" },
];

export function SettingsModule() {
  const [staff, setStaff] = useState<StaffMember[]>(staffMembers);
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
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    lowStockAlerts: true,
    orderUpdates: true,
    customerApprovals: true,
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: "Ranjit's Shoe & Bag Repair",
    ownerName: "Ranjit Kumar",
    phone: "+91 98765 43210",
    email: "ranjit@example.com",
    address: "123 MG Road, Pune, Maharashtra",
    gstNumber: "27XXXXX1234X1Z5",
    timezone: "Asia/Kolkata",
    currency: "INR",
    logo: undefined,
    website: "www.ranjitsrepair.com",
    tagline: "Quality Repair Services"
  });

  // Load business info from localStorage
  useEffect(() => {
    const savedBusinessInfo = businessInfoStorage.get();
    setBusinessInfo(savedBusinessInfo);
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        setBusinessInfo(prev => ({ ...prev, logo: logoData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBusinessInfo(prev => ({ ...prev, logo: undefined }));
  };

  const saveBusinessInfo = () => {
    businessInfoStorage.save(businessInfo);
    alert("Business information saved successfully!");
  };

  // Staff Management Functions
  const resetStaffForm = () => {
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
    resetStaffForm();
    setShowStaffForm(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
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
    setShowDeleteConfirm(id);
  };

  const confirmDeleteStaff = () => {
    if (showDeleteConfirm) {
      setStaff(prev => prev.filter(member => member.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStaff) {
      // Update existing staff member
      setStaff(prev => prev.map(member => 
        member.id === editingStaff.id 
          ? { ...member, ...staffFormData }
          : member
      ));
    } else {
      // Add new staff member
      const newStaff: StaffMember = {
        id: Math.max(...staff.map(s => s.id)) + 1,
        ...staffFormData
      };
      setStaff(prev => [...prev, newStaff]);
    }
    
    resetStaffForm();
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

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
                <Button onClick={saveBusinessInfo} className="bg-gradient-primary hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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
              <Button onClick={handleAddStaff} className="bg-gradient-primary hover:opacity-90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </div>
            <div className="space-y-4">
              {staff.map((member) => (
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
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteStaff(member.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingStaff ? "Update Staff" : "Add Staff"}
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
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDeleteStaff}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
