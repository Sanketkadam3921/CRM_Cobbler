import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    CheckCircle,
    Search,
    Eye,
    Phone,
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertTriangle,
    ArrowLeft,
    Package,
    DollarSign,
    Calendar,
    FileText,
    Truck
} from "lucide-react";
import { useCompletedEnquiries, CompletedEnquiry } from "@/services/completedApiService";

interface CompletedServicesViewProps {
    onNavigate: (view: string, action?: string, id?: number) => void;
    onBack: () => void;
}

// Helper function to format date in DD/MM/YYYY format
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Helper function to get status color and capitalize
const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'delivered':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

// Helper to capitalize first letter
const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper to format delivery method
const formatDeliveryMethod = (method: string) => {
    if (method === 'customer-pickup') return 'Customer Pickup';
    if (method === 'home-delivery') return 'Home Delivery';
    return method;
};

export function CompletedServicesView({ onNavigate, onBack }: CompletedServicesViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedService, setSelectedService] = useState<CompletedEnquiry | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Use the completed enquiries hook
    const {
        enquiries,
        loading,
        error,
        lastUpdate,
        refetch
    } = useCompletedEnquiries(30000); // Poll every 30 seconds

    // Apply search and date filters
    const filteredServices = enquiries.filter(enquiry => {
        const matchesSearch = searchTerm === "" ||
            enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enquiry.phone.includes(searchTerm) ||
            enquiry.id.toString().includes(searchTerm) ||
            enquiry.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enquiry.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateFilter !== "all") {
            const completedDate = new Date(enquiry.deliveredAt || enquiry.updatedAt);
            const now = new Date();

            switch (dateFilter) {
                case "today":
                    matchesDate = completedDate.toDateString() === now.toDateString();
                    break;
                case "week":
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = completedDate >= weekAgo;
                    break;
                case "month":
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    matchesDate = completedDate >= monthAgo;
                    break;
            }
        }

        return matchesSearch && matchesDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter]);

    const handleViewDetails = (service: CompletedEnquiry) => {
        setSelectedService(service);
        setShowDetailsModal(true);
    };

    // Calculate statistics for display
    const totalRevenue = filteredServices.reduce((sum, enquiry) =>
        sum + (enquiry.billedAmount || enquiry.finalAmount || 0), 0
    );

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Back to Dashboard</span>
                    </button>
                    <div className="h-4 sm:h-6 w-px bg-border"></div>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center">
                            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-primary" />
                            Completed Services
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                            View all completed and delivered services
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    {lastUpdate && (
                        <span className="text-xs text-muted-foreground text-center sm:text-left">
                            Last updated: {formatDate(lastUpdate.toISOString())}
                        </span>
                    )}
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-sm">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-green-800">Total Completed</p>
                            <p className="text-lg sm:text-2xl font-bold text-green-900">{filteredServices.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-blue-800">Total Revenue</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-900">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-purple-800">Avg. Revenue</p>
                            <p className="text-lg sm:text-2xl font-bold text-purple-900">
                                ₹{filteredServices.length > 0 ? Math.round(totalRevenue / filteredServices.length).toLocaleString() : '0'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Error State */}
            {error && (
                <Card className="p-4 sm:p-6 bg-red-50 border-red-200">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <h3 className="text-sm font-medium text-red-800">Failed to load completed services</h3>
                            <p className="text-sm text-red-600 mt-1 break-words">{error}</p>
                            <button
                                onClick={refetch}
                                className="text-sm text-red-700 underline hover:text-red-800 mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Filters and Search */}
            <Card className="p-4 sm:p-6">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by customer, product, invoice number, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="sm:w-48">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-xs sm:text-sm text-muted-foreground">
                    <span className="text-center sm:text-left">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredServices.length)} of {filteredServices.length} completed services
                    </span>
                    <span className="flex items-center justify-center sm:justify-start space-x-2">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                        <span>{loading ? 'Syncing...' : 'Up to date'}</span>
                    </span>
                </div>
            </Card>

            {/* Loading State */}
            {loading && enquiries.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading completed services...</p>
                </Card>
            ) : paginatedServices.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No completed services found</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchTerm || dateFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "No services have been completed yet"}
                    </p>
                </Card>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="block sm:hidden space-y-3">
                        {paginatedServices.map((service) => (
                            <Card key={service.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono text-sm font-medium">#{service.id}</span>
                                        {service.deliveredAt ? (
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor('delivered')}`}>
                                                Delivered
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor('completed')}`}>
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => handleViewDetails(service)}
                                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-medium text-foreground text-sm">{service.customerName}</h4>
                                        {service.address && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.address}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                        <div className="flex items-center space-x-1">
                                            <Phone className="h-3 w-3" />
                                            <span>{service.phone}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(service.invoiceDate || service.updatedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Product:</span>
                                            <div className="font-medium text-foreground">{service.product}</div>
                                            <div className="text-muted-foreground">Qty: {service.quantity}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Services:</span>
                                            <div className="font-medium text-foreground">
                                                {service.serviceTypes || 'Multiple Services'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice and Delivery Info */}
                                    <div className="border-t border-border pt-2 space-y-2">
                                        {service.invoiceNumber && (
                                            <div className="text-xs">
                                                <span className="text-muted-foreground">Invoice: </span>
                                                <span className="font-mono">{service.invoiceNumber}</span>
                                            </div>
                                        )}

                                        {service.deliveryMethod && (
                                            <div className="text-xs">
                                                <span className="text-muted-foreground">Delivery: </span>
                                                <span>{formatDeliveryMethod(service.deliveryMethod)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="flex justify-between items-center pt-2 border-t border-border">
                                        <div className="text-xs text-muted-foreground">
                                            {service.gstAmount && `GST: ₹${service.gstAmount.toLocaleString()}`}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-600">
                                                ₹{(service.billedAmount || service.finalAmount || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <Card className="overflow-hidden hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Services</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Completed</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Delivery</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedServices.map((service) => (
                                        <tr key={service.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <span className="font-mono text-sm">#{service.id}</span>
                                                {service.invoiceNumber && (
                                                    <div className="text-xs text-muted-foreground">
                                                        INV: {service.invoiceNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-foreground">{service.customerName}</div>
                                                    {service.address && (
                                                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                            {service.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                                                        <span>{service.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium">{service.product}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Qty: {service.quantity}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-foreground">
                                                    {service.serviceTypes || 'Multiple Services'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-foreground">
                                                        ₹{(service.billedAmount || service.finalAmount || 0).toLocaleString()}
                                                    </div>
                                                    {service.gstAmount && (
                                                        <div className="text-xs text-muted-foreground">
                                                            GST: ₹{service.gstAmount.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {formatDate(service.invoiceDate || service.updatedAt)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {service.deliveredAt ? (
                                                        <>
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor('delivered')}`}>
                                                                Delivered
                                                            </span>
                                                            <div className="text-xs text-muted-foreground">
                                                                {service.deliveryMethod && formatDeliveryMethod(service.deliveryMethod)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor('completed')}`}>
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => handleViewDetails(service)}
                                                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Card className="p-4 border-t border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Completed Service Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-muted-foreground hover:text-foreground text-xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                                        <div className="text-foreground">{selectedService.customerName}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Service ID</label>
                                        <div className="text-foreground font-mono">#{selectedService.id}</div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                        <div className="text-foreground">{selectedService.phone}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                                        <div className="text-foreground">{selectedService.address}</div>
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Product</label>
                                        <div className="text-foreground">{selectedService.product}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                                        <div className="text-foreground">{selectedService.quantity}</div>
                                    </div>
                                </div>

                                {/* Service Information */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Services Performed</label>
                                    <div className="text-foreground bg-muted/30 p-3 rounded-lg mt-2">
                                        {selectedService.serviceTypes || 'Multiple services completed'}
                                    </div>
                                </div>

                                {/* Billing Information */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Final Amount</label>
                                        <div className="text-foreground font-semibold">
                                            ₹{(selectedService.billedAmount || selectedService.finalAmount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    {selectedService.gstAmount && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">GST Amount</label>
                                            <div className="text-foreground">₹{selectedService.gstAmount.toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Invoice Information */}
                                {selectedService.invoiceNumber && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                                            <div className="text-foreground font-mono">{selectedService.invoiceNumber}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                                            <div className="text-foreground">
                                                {selectedService.invoiceDate ? formatDate(selectedService.invoiceDate) : 'Not available'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Information */}
                                {selectedService.deliveredAt && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Delivered At</label>
                                            <div className="text-foreground">{formatDate(selectedService.deliveredAt)}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Delivery Method</label>
                                            <div className="text-foreground">
                                                {selectedService.deliveryMethod ? formatDeliveryMethod(selectedService.deliveryMethod) : 'Not specified'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Work Notes */}
                                {selectedService.workNotes && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Work Notes</label>
                                        <div className="text-foreground bg-muted/30 p-3 rounded-lg mt-2">
                                            {selectedService.workNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Notes */}
                                {selectedService.deliveryNotes && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Delivery Notes</label>
                                        <div className="text-foreground bg-muted/30 p-3 rounded-lg mt-2">
                                            {selectedService.deliveryNotes}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-6 pt-6 border-t border-border">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-center"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}