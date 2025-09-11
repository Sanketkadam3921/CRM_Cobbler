import { 
  Enquiry, 
  ServiceOrder, 
  PickupOrder, 
  InventoryItem, 
  Expense, 
  StaffMember 
} from "@/types";

// Dummy logo SVG for testing
const dummyLogo = `data:image/svg+xml;base64,${btoa(`
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#logoGradient)"/>
  <circle cx="100" cy="80" r="25" fill="white" opacity="0.9"/>
  <path d="M70 120 Q100 140 130 120" stroke="white" stroke-width="8" fill="none" stroke-linecap="round"/>
  <text x="100" y="170" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">RSR</text>
</svg>
`)}`;

// Sample Enquiries Data - All starting in "enquiry" stage for workflow testing
export const sampleEnquiries: Enquiry[] = [
  {
    id: 1,
    customerName: "Priya Sharma",
    phone: "9876543210",
    address: "Baner, Pune, Maharashtra, India",
    message: "Need to repair my leather handbag zipper. The zipper is completely broken and needs replacement.",
    inquiryType: "Instagram",
    product: "Bag",
    quantity: 1,
    date: "2024-01-15",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-15 10:30 AM",
    currentStage: "enquiry",
    quotedAmount: 500,
    // Legacy compatibility
    name: "Priya Sharma",
    number: "9876543210",
    location: "Baner, Pune"
  },
  {
    id: 2,
    customerName: "Rahul Kumar",
    phone: "8765432109",
    address: "Aundh, Pune, Maharashtra, India",
    message: "Shoe sole replacement needed urgently for my formal leather shoes.",
    inquiryType: "WhatsApp",
    product: "Shoe",
    quantity: 2,
    date: "2024-01-14",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-14 10:30 AM",
    currentStage: "enquiry",
    quotedAmount: 800,
    // Legacy compatibility
    name: "Rahul Kumar",
    number: "8765432109",
    location: "Aundh, Pune"
  },
  {
    id: 3,
    customerName: "Sneha Patil",
    phone: "7654321098",
    address: "Kothrud, Pune, Maharashtra, India",
    message: "Designer bag strap repair needed",
    inquiryType: "Facebook",
    product: "Bag",
    quantity: 1,
    date: "2024-01-13",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-13 2:00 PM",
    currentStage: "enquiry",
    quotedAmount: 650,
    // Legacy compatibility
    name: "Sneha Patil",
    number: "7654321098",
    location: "Kothrud, Pune"
  },
  {
    id: 4,
    customerName: "Amit Singh",
    phone: "6543210987",
    address: "Hadapsar, Pune, Maharashtra, India",
    message: "Boot waterproofing service required",
    inquiryType: "Instagram",
    product: "Shoe",
    quantity: 1,
    date: "2024-01-12",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-12 9:00 AM",
    currentStage: "enquiry",
    quotedAmount: 400,
    // Legacy compatibility
    name: "Amit Singh",
    number: "6543210987",
    location: "Hadapsar, Pune"
  },
  {
    id: 5,
    customerName: "Kavita Joshi",
    phone: "5432109876",
    address: "Wakad, Pune, Maharashtra, India",
    message: "Handbag color restoration needed",
    inquiryType: "WhatsApp",
    product: "Bag",
    quantity: 1,
    date: "2024-01-11",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-11 11:00 AM",
    currentStage: "enquiry",
    quotedAmount: 750,
    // Legacy compatibility
    name: "Kavita Joshi",
    number: "5432109876",
    location: "Wakad, Pune"
  },
  {
    id: 6,
    customerName: "Rohan Desai",
    phone: "4321098765",
    address: "Viman Nagar, Pune, Maharashtra, India",
    message: "Formal shoes polish and repair",
    inquiryType: "Facebook",
    product: "Shoe",
    quantity: 1,
    date: "2024-01-10",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-10 11:00 AM",
    currentStage: "enquiry",
    quotedAmount: 300,
    // Legacy compatibility
    name: "Rohan Desai",
    number: "4321098765",
    location: "Viman Nagar, Pune"
  },
  {
    id: 7,
    customerName: "Meera Kulkarni",
    phone: "3210987654",
    address: "Shivaji Nagar, Pune, Maharashtra, India",
    message: "Leather jacket repair consultation",
    inquiryType: "Instagram",
    product: "Bag",
    quantity: 1,
    date: "2024-01-09",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-09 3:00 PM",
    currentStage: "enquiry",
    quotedAmount: 1200,
    // Legacy compatibility
    name: "Meera Kulkarni",
    number: "3210987654",
    location: "Shivaji Nagar, Pune"
  },
  {
    id: 8,
    customerName: "Vikram Rao",
    phone: "2109876543",
    address: "Pune Station, Pune, Maharashtra, India",
    message: "Running shoes sole replacement",
    inquiryType: "WhatsApp",
    product: "Shoe",
    quantity: 1,
    date: "2024-01-08",
    status: "converted",
    contacted: true,
    contactedAt: "2024-01-08 9:30 AM",
    currentStage: "enquiry",
    quotedAmount: 400,
    // Legacy compatibility
    name: "Vikram Rao",
    number: "2109876543",
    location: "Pune Station"
  }
];

// Note: Service Orders and Pickup Orders are now integrated into Enquiries
// All workflow data is managed through the main Enquiry entity

// Sample Inventory Data
export const sampleInventory: InventoryItem[] = [
  {
    id: 1,
    name: "Leather Polish - Brown",
    category: "Polish",
    quantity: 15,
    minStock: 10,
    unit: "bottles",
    cost: 150,
    supplier: "Leather Craft Supplies",
    lastUpdated: "2024-01-15",
    location: "Shelf A1"
  },
  {
    id: 2,
    name: "Shoe Sole - Rubber",
    category: "Soles",
    quantity: 3,
    minStock: 5,
    unit: "pairs",
    cost: 200,
    supplier: "Sole Solutions",
    lastUpdated: "2024-01-14",
    location: "Shelf B2"
  },
  {
    id: 3,
    name: "Thread - Heavy Duty",
    category: "Thread",
    quantity: 8,
    minStock: 3,
    unit: "spools",
    cost: 50,
    supplier: "Stitching Supplies Co",
    lastUpdated: "2024-01-13",
    location: "Drawer C1"
  },
  {
    id: 4,
    name: "Bag Zipper - Metal",
    category: "Hardware",
    quantity: 25,
    minStock: 15,
    unit: "pieces",
    cost: 30,
    supplier: "Hardware Plus",
    lastUpdated: "2024-01-12",
    location: "Drawer D3"
  },
  {
    id: 5,
    name: "Leather Conditioner",
    category: "Polish",
    quantity: 12,
    minStock: 8,
    unit: "bottles",
    cost: 180,
    supplier: "Leather Craft Supplies",
    lastUpdated: "2024-01-11",
    location: "Shelf A2"
  },
  {
    id: 6,
    name: "Shoe Laces - Black",
    category: "Hardware",
    quantity: 50,
    minStock: 20,
    unit: "pairs",
    cost: 15,
    supplier: "Footwear Accessories",
    lastUpdated: "2024-01-10",
    location: "Drawer D1"
  }
];

// Sample Expenses Data
export const sampleExpenses: Expense[] = [
  {
    id: 1,
    date: "2024-01-15",
    amount: 2500,
    category: "Materials",
    description: "Leather sheets and polish",
    notes: "Bulk purchase for January",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    date: "2024-01-14",
    amount: 800,
    category: "Tools",
    description: "New stitching machine needles",
    createdAt: "2024-01-14"
  },
  {
    id: 3,
    date: "2024-01-13",
    amount: 1200,
    category: "Rent",
    description: "Shop rent for January",
    createdAt: "2024-01-13"
  },
  {
    id: 4,
    date: "2024-01-12",
    amount: 300,
    category: "Transportation",
    description: "Fuel for pickup deliveries",
    createdAt: "2024-01-12"
  },
  {
    id: 5,
    date: "2024-01-11",
    amount: 450,
    category: "Utilities",
    description: "Electricity bill for December",
    createdAt: "2024-01-11"
  },
  {
    id: 6,
    date: "2024-01-10",
    amount: 200,
    category: "Marketing",
    description: "Instagram ad campaign",
    createdAt: "2024-01-10"
  }
];

// Sample Staff Data
export const sampleStaff: StaffMember[] = [
  {
    id: 1,
    name: "Ramesh Kumar",
    role: "technician",
    email: "ramesh@example.com",
    phone: "9876543210",
    status: "active",
    department: "Repair",
    createdAt: "2024-01-01"
  },
  {
    id: 2,
    name: "Suresh Patel",
    role: "pickup",
    email: "suresh@example.com",
    phone: "8765432109",
    status: "active",
    department: "Logistics",
    createdAt: "2024-01-01"
  },
  {
    id: 3,
    name: "Mahesh Singh",
    role: "technician",
    email: "mahesh@example.com",
    phone: "7654321098",
    status: "inactive",
    department: "Repair",
    createdAt: "2024-01-01"
  }
];

// Dashboard stats data
export const dashboardStats = [
  {
    name: "Total Enquiries",
    value: "24",
    change: "+12%",
    changeType: "positive",
    redirectTo: "all-enquiries"
  },
  {
    name: "Pending Pickups",
    value: "8",
    change: "+2",
    changeType: "neutral",
    redirectTo: "pending-pickups",
  },
  {
    name: "In Service",
    value: "15",
    change: "3 urgent",
    changeType: "warning",
    redirectTo: "in-service",
  },
  {
    name: "Service Completion Rate",
    value: "32/37",
    change: "delivered",
    changeType: "positive",
    redirectTo: "service-completion",
  },
];

export const recentActivity = [
  {
    id: 1,
    type: "enquiry",
    message: "New enquiry from Instagram - Leather bag repair",
    time: "2 minutes ago",
    status: "new",
  },
  {
    id: 2,
    type: "pickup",
    message: "Pickup scheduled for Ravi Kumar - 3 shoes",
    time: "15 minutes ago",
    status: "scheduled",
  },
  {
    id: 3,
    type: "service",
    message: "Service completed for Order #1243",
    time: "1 hour ago",
    status: "completed",
  },
  {
    id: 4,
    type: "inventory",
    message: "Low stock alert - Leather polish (2 units left)",
    time: "2 hours ago",
    status: "warning",
  },
];

// Reports data
export const monthlyRevenue = [
  { month: "Jan", revenue: 15000, orders: 45 },
  { month: "Feb", revenue: 18000, orders: 52 },
  { month: "Mar", revenue: 22000, orders: 68 },
  { month: "Apr", revenue: 19000, orders: 58 },
  { month: "May", revenue: 25000, orders: 75 },
  { month: "Jun", revenue: 28000, orders: 82 },
];

export const serviceTypes = [
  { name: "Shoe Repair", value: 45, color: "hsl(var(--primary))" },
  { name: "Bag Repair", value: 30, color: "hsl(var(--secondary))" },
  { name: "Cleaning", value: 15, color: "hsl(var(--accent))" },
  { name: "Polish", value: 10, color: "hsl(var(--muted))" },
];

export const topCustomers = [
  { name: "Rajesh Kumar", orders: 12, revenue: 4500 },
  { name: "Priya Sharma", orders: 8, revenue: 3200 },
  { name: "Amit Patel", orders: 6, revenue: 2800 },
  { name: "Sunita Devi", orders: 5, revenue: 2100 },
  { name: "Manoj Singh", orders: 4, revenue: 1800 },
];

export const dailyStats = [
  { day: "Mon", orders: 12, revenue: 3200 },
  { day: "Tue", orders: 15, revenue: 4100 },
  { day: "Wed", orders: 18, revenue: 4800 },
  { day: "Thu", orders: 14, revenue: 3900 },
  { day: "Fri", orders: 20, revenue: 5500 },
  { day: "Sat", orders: 25, revenue: 6200 },
  { day: "Sun", orders: 8, revenue: 2100 },
];

// Constants
export const expenseCategories = [
  "Materials",
  "Tools",
  "Rent",
  "Utilities",
  "Transportation",
  "Marketing",
  "Miscellaneous"
];

export const departments = [
  { value: "sole-repair", label: "Sole Repair" },
  { value: "polishing", label: "Polishing" },
  { value: "stitching", label: "Stitching" },
  { value: "quality-check", label: "Quality Check" },
  { value: "leather-treatment", label: "Leather Treatment" },
  { value: "hardware-repair", label: "Hardware Repair" }
];
