import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search } from "lucide-react";

interface ServiceOrder {
  id: number;
  customerName: string;
  items: string;
  serviceType: string;
  status: "in-progress" | "photos-taken" | "awaiting-approval" | "completed" | "billed";
  estimatedCost: number;
  notes: string;
}

const sampleServices: ServiceOrder[] = [
    { id: 1, customerName: "Rajesh Kumar", items: "Leather Shoes", serviceType: "Sole Replacement", status: "in-progress", estimatedCost: 350, notes: "Customer wants brown sole to match leather" },
    { id: 2, customerName: "Priya Sharma", items: "Hand Bag", serviceType: "Zipper Repair", status: "photos-taken", estimatedCost: 150, notes: "Metal zipper replacement needed" },
    { id: 3, customerName: "Amit Patel", items: "Sports Shoes", serviceType: "Cleaning & Polish", status: "completed", estimatedCost: 200, notes: "Deep cleaning completed" },
    { id: 4, customerName: "Anjali Mehta", items: "Leather Jacket", serviceType: "Tear Repair", status: "awaiting-approval", estimatedCost: 500, notes: "Patch required on left sleeve" },
    { id: 5, customerName: "Vikram Singh", items: "Formal Shoes", serviceType: "Recoloring", status: "in-progress", estimatedCost: 800, notes: "Change from tan to black" },
    { id: 6, customerName: "Sunita Patil", items: "Designer Handbag", serviceType: "Strap Replacement", status: "in-progress", estimatedCost: 650, notes: "Original strap broken" },
    { id: 7, customerName: "Rohan Desai", items: "Suede Boots", serviceType: "Waterproofing", status: "billed", estimatedCost: 400, notes: "Completed and delivered" },
    { id: 8, customerName: "Kavita Rao", items: "Leather Belts", serviceType: "Buckle Replacement", status: "photos-taken", estimatedCost: 250, notes: "Customer providing new buckle" },
];

interface InServiceTableProps {
  onBack: () => void;
}

export function InServiceTable({ onBack }: InServiceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-primary text-primary-foreground";
      case "photos-taken": return "bg-blue-500 text-white";
      case "awaiting-approval": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };
  
  const inServiceItems = sampleServices.filter(s => 
    s.status === 'in-progress' || s.status === 'photos-taken' || s.status === 'awaiting-approval'
  );

  const filteredItems = inServiceItems.filter(item =>
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Items In Service</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {filteredItems.length} items currently in workflow
          </p>
        </div>
      </div>

      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by customer, item, or service..."
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
                <th className="text-left p-3 font-semibold text-foreground">Item & Service</th>
                <th className="text-left p-3 font-semibold text-foreground">Est. Cost</th>
                <th className="text-left p-3 font-semibold text-foreground">Notes</th>
                <th className="text-left p-3 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{item.customerName}</td>
                  <td className="p-3">
                    <div className="font-medium text-foreground">{item.items}</div>
                    <div className="text-xs text-muted-foreground">{item.serviceType}</div>
                  </td>
                  <td className="p-3 font-mono text-sm text-foreground">₹{item.estimatedCost}</td>
                  <td className="p-3 text-sm text-muted-foreground truncate" style={{maxWidth: '200px'}} title={item.notes}>{item.notes}</td>
                  <td className="p-3">
                    <Badge className={`${getStatusColor(item.status)} text-xs`}>{item.status.replace('-', ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-4 bg-gradient-card border-0 shadow-soft">
             <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-foreground text-lg">{item.customerName}</h3>
                    <p className="text-sm text-muted-foreground">{item.items} - {item.serviceType}</p>
                </div>
                <Badge className={`${getStatusColor(item.status)} text-xs`}>
                  {item.status.replace('-', ' ')}
                </Badge>
              </div>
              <div className="border-t border-border my-3"></div>
              <div className="space-y-2 text-sm">
                <p><strong>Est. Cost:</strong> ₹{item.estimatedCost}</p>
                <p className="text-muted-foreground"><strong>Notes:</strong> {item.notes}</p>
              </div>

          </Card>
        ))}
       </div>
    </div>
  );
}
