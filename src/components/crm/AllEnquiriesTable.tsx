import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Filter, Instagram, Facebook, MessageCircle, Briefcase, ShoppingBag } from "lucide-react";
import { Enquiry } from "@/types";
import { enquiriesStorage } from "@/utils/localStorage";


interface AllEnquiriesTableProps {
  onBack: () => void;
}

export function AllEnquiriesTable({ onBack }: AllEnquiriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [allEnquiries, setAllEnquiries] = useState<Enquiry[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    setAllEnquiries(enquiriesStorage.getAll());
  }, []);

  const getInquiryIcon = (type: string) => {
    switch (type) {
      case "Instagram": return <Instagram className="h-4 w-4 text-pink-500" />;
      case "Facebook": return <Facebook className="h-4 w-4 text-blue-500" />;
      case "WhatsApp": return <MessageCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getProductIcon = (product: string) => {
    return product === "Bag" ?
      <Briefcase className="h-4 w-4 text-amber-600" /> :
      <ShoppingBag className="h-4 w-4 text-purple-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-primary text-primary-foreground";
      case "contacted": return "bg-warning text-warning-foreground";
      case "converted": return "bg-success text-success-foreground";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredEnquiries = allEnquiries.filter(enquiry => {
    const matchesSearch = (enquiry.customerName || enquiry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enquiry.address || enquiry.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enquiry.phone || enquiry.number || '').includes(searchTerm);

    const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Enquiries</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Total {filteredEnquiries.length} enquiries found
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="text-lg sm:text-xl font-bold text-foreground">{allEnquiries.length}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="text-lg sm:text-xl font-bold text-primary">
            {allEnquiries.filter(e => e.status === 'new').length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">New</div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="text-lg sm:text-xl font-bold text-warning">
            {allEnquiries.filter(e => e.status === 'contacted').length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Contacted</div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="text-lg sm:text-xl font-bold text-success">
            {allEnquiries.filter(e => e.status === 'converted').length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Converted</div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="text-lg sm:text-xl font-bold text-muted-foreground">
            {allEnquiries.filter(e => e.status === 'closed').length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Closed</div>
        </Card>
      </div> */}

      {/* Search and Filter */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, location, phone, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 pr-10 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 text-sm font-medium shadow-md hover:shadow-lg hover:border-blue-300 focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 appearance-none cursor-pointer min-w-[140px] transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button> */}
          </div>
        </div>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden lg:block bg-gradient-card border-0 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-44" /> {/* Customer */}
              <col className="w-36" /> {/* Contact */}
              <col className="w-28" /> {/* Source */}
              <col className="w-24" /> {/* Product */}
              <col className="w-80" /> {/* Message */}
              <col className="w-24" /> {/* Status */}
              <col className="w-28" /> {/* Date */}
            </colgroup>
            <thead className="bg-muted/30">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-foreground">Customer</th>
                <th className="text-left p-3 font-semibold text-foreground">Contact</th>
                <th className="text-left p-3 font-semibold text-foreground">Source</th>
                <th className="text-left p-3 font-semibold text-foreground">Product</th>
                <th className="text-left p-3 font-semibold text-foreground">Message</th>
                <th className="text-left p-3 font-semibold text-foreground">Status</th>
                <th className="text-left p-3 font-semibold text-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-foreground truncate">{enquiry.customerName || enquiry.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{enquiry.address || enquiry.location}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-foreground truncate">{enquiry.phone || enquiry.number}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1">
                      {getInquiryIcon(enquiry.inquiryType)}
                      <span className="text-xs text-foreground truncate">{enquiry.inquiryType}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-1">
                      {getProductIcon(enquiry.product)}
                      <span className="text-xs text-foreground">{enquiry.product}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-foreground break-words line-clamp-2" title={enquiry.message}>
                      {enquiry.message}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={`${getStatusColor(enquiry.status)} text-xs whitespace-nowrap`}>
                      {enquiry.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="text-xs text-foreground">{enquiry.date}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {filteredEnquiries.map((enquiry) => (
          <Card key={enquiry.id} className="p-4 bg-gradient-card border-0 shadow-soft">
            <div className="space-y-3">
              {/* Header with name and status */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-lg">{enquiry.customerName || enquiry.name}</h3>
                <Badge className={`${getStatusColor(enquiry.status)} text-xs`}>
                  {enquiry.status}
                </Badge>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  📞 {enquiry.phone || enquiry.number}
                </div>
                <div className="flex items-center text-muted-foreground">
                  📍 {enquiry.address || enquiry.location}
                </div>
                <div className="flex items-center text-muted-foreground">
                  📅 {enquiry.date}
                </div>
              </div>

              {/* Source and Product */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getInquiryIcon(enquiry.inquiryType)}
                  <span className="text-sm text-muted-foreground">{enquiry.inquiryType}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getProductIcon(enquiry.product)}
                  <span className="text-sm text-muted-foreground">{enquiry.product}</span>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">
                {enquiry.message}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredEnquiries.length === 0 && (
        <Card className="p-8 text-center bg-gradient-card border-0 shadow-soft">
          <div className="text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No enquiries found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        </Card>
      )}
    </div>
  );
}