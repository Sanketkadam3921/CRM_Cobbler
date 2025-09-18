import {
  Home,
  Users,
  Package,
  Settings,
  BarChart3,
  MapPin,
  Truck,
  CheckCircle,
  Calculator,
  IndianRupee,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import BuildIcon from "@mui/icons-material/Build";
import { LucideIcon } from "lucide-react";
import ReceiptIcon from '@mui/icons-material/Receipt';
interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string, action?: string) => void;
}

interface NavigationItem {
  name: string;
  icon: LucideIcon | typeof BuildIcon;
  id: string;
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "CRM", icon: Users, id: "crm" },
  { name: "Pickup Management", icon: MapPin, id: "pickup" },
  { name: "Service Workflow", icon: BuildIcon, id: "service" },
  { name: "Billing & Invoice", icon: ReceiptIcon, id: "billing" },
  { name: "Delivery Management", icon: Truck, id: "delivery" },
  { name: "Completed Orders", icon: CheckCircle, id: "completed" },
  { name: "Inventory", icon: Package, id: "inventory" },
  { name: "Expenses", icon: IndianRupee, id: "expenses" },
  { name: "Reports", icon: BarChart3, id: "reports" },
  { name: "Settings", icon: Settings, id: "settings" },
];

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();

  const handleNavigation = (view: string) => {
    onViewChange(view);
    // Auto-collapse sidebar on mobile/tablet after selection
    setOpenMobile(false);
  };

  return (
    <Sidebar
      className="border-r border-border bg-gradient-card"
      collapsible="icon"
    >
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-foreground">Cobbler CRM</h2>
            <p className="text-sm text-muted-foreground">Business Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarMenu>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.id} className="my-1">
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.id)}
                  isActive={currentView === item.id}
                  className={`w-full py-3 px-3 gap-3 text-[15px] transition-all duration-200 hover:bg-primary/10 hover:text-primary ${currentView === item.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground"
                    }`}
                  tooltip={item.name}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-medium">{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
