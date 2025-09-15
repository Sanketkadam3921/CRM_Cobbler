import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, User, Clock } from "lucide-react";
import { stringUtils } from "@/utils";

interface PickupOrder {
  id: number;
  customerName: string;
  customerPhone: string;
  address: string;
  items: string;
  quantity: number;
  status: "pending" | "assigned" | "picked-up" | "completed";
  assignedTo?: string;
  scheduledTime: string;
  pin: string;
}

const samplePickups: PickupOrder[] = [
  { id: 1, customerName: "Rajesh Kumar", customerPhone: "+91 98765 43210", address: "123 MG Road, Pune", items: "Leather Shoes, Hand Bag", quantity: 2, status: "pending", scheduledTime: "2024-01-16 10:00 AM", pin: "1234" },
  { id: 2, customerName: "Priya Sharma", customerPhone: "+91 87654 32109", address: "456 FC Road, Pune", items: "Sports Shoes", quantity: 1, status: "assigned", assignedTo: "Ramesh", scheduledTime: "2024-01-16 2:00 PM", pin: "5678" },
  { id: 3, customerName: "Anjali Mehta", customerPhone: "+91 76543 21098", address: "789 JM Road, Pune", items: "Leather Jacket", quantity: 1, status: "pending", scheduledTime: "2024-01-17 11:00 AM", pin: "9876" },
  { id: 4, customerName: "Vikram Singh", customerPhone: "+91 65432 10987", address: "101 Koregaon Park, Pune", items: "3 pairs of formal shoes", quantity: 3, status: "pending", scheduledTime: "2024-01-17 3:00 PM", pin: "5432" },
  { id: 5, customerName: "Sunita Patil", customerPhone: "+91 54321 09876", address: "212 Baner, Pune", items: "Designer handbag", quantity: 1, status: "assigned", assignedTo: "Suresh", scheduledTime: "2024-01-18 12:00 PM", pin: "1122" },
  { id: 6, customerName: "Rohan Desai", customerPhone: "+91 43210 98765", address: "333 Aundh, Pune", items: "Suede boots", quantity: 1, status: "picked-up", scheduledTime: "2024-01-15 10:00 AM", pin: "3344" },
  { id: 7, customerName: "Kavita Rao", customerPhone: "+91 32109 87654", address: "444 Viman Nagar, Pune", items: "2 leather belts", quantity: 2, status: "completed", scheduledTime: "2024-01-14 2:00 PM", pin: "5566" },
  { id: 8, customerName: "Sameer Joshi", customerPhone: "+91 21098 76543", address: "555 Hinjewadi, Pune", items: "Office bag", quantity: 1, status: "pending", scheduledTime: "2024-01-18 5:00 PM", pin: "7788" },
];

interface PendingPickupsTableProps {
  onBack: () => void;
}

export function PendingPickupsTable({ onBack }: PendingPickupsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "assigned": return "bg-primary text-primary-foreground";
      case "picked-up": return "bg-blue-500 text-white";
      case "completed": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const pendingPickups = samplePickups.filter(p => p.status === 'pending' || p.status === 'assigned');

  const filteredPickups = pendingPickups.filter(pickup =>
    pickup.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pickup.items.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pending Pickups</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {filteredPickups.length} pickups awaiting action
          </p>
        </div>
      </div>

      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by customer, address, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card className="hidden lg:block bg-gradient-card border-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-foreground">Customer</th>
                <th className="text-left p-3 font-semibold text-foreground">Details</th>
                <th className="text-left p-3 font-semibold text-foreground">Schedule</th>
                {/* <th className="text-left p-3 font-semibold text-foreground">Assigned To</th>
                <th className="text-left p-3 font-semibold text-foreground">Status</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredPickups.map((pickup) => (
                <tr key={pickup.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-foreground">{pickup.customerName}</div>
                    <div className="text-xs text-muted-foreground">{pickup.customerPhone}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-foreground">{pickup.items} ({pickup.quantity})</div>
                    <div className="text-xs text-muted-foreground">{pickup.address}</div>
                  </td>
                  <td className="p-3 text-sm text-foreground">{pickup.scheduledTime}</td>
                  {/* <td className="p-3 text-sm text-foreground">{pickup.assignedTo || "Unassigned"}</td>
                  <td className="p-3">
                    <Badge className={`${getStatusColor(pickup.status)} text-xs`}>{pickup.status}</Badge>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {filteredPickups.map((pickup) => (
          <Card key={pickup.id} className="p-4 bg-gradient-card border-0 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-lg">{pickup.customerName}</h3>
              <Badge className={`${getStatusColor(pickup.status)} text-xs`}>
                {stringUtils.capitalizeWords(pickup.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{pickup.customerPhone}</p>
            <div className="border-t border-border my-3"></div>
            <div className="space-y-2 text-sm">
              <p><strong>Items:</strong> {pickup.items} ({pickup.quantity})</p>
              <p><strong>Address:</strong> {pickup.address}</p>
              <p><strong>Scheduled:</strong> {pickup.scheduledTime}</p>
              <p><strong>Assigned:</strong> {pickup.assignedTo || "Unassigned"}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}