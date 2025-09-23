import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    Package,
    Search,
    Plus,
    Eye,
    Edit,
    Phone,
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertTriangle,
    ArrowLeft,
    User,
    Wrench,
    CheckCircle,
    PlayCircle,
    PauseCircle
} from "lucide-react";
import { useServiceEnquiries, serviceApiService } from "@/services/serviceApiService";
import { ServiceDetails, ServiceTypeStatus } from "@/types";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material"
interface InServiceViewProps {
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

// Helper function to get service status color and capitalize
const getServiceStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'in-progress':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'done':
            return 'text-green-600 bg-green-50 border-green-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

// Helper to capitalize first letter
const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper to get overall service status
const getOverallServiceStatus = (serviceTypes: ServiceTypeStatus[]) => {
    if (!serviceTypes || serviceTypes.length === 0) {
        return "Unassigned";
    } else if (serviceTypes.every(service => service.status === "done")) {
        return "All Done";
    } else if (serviceTypes.some(service => service.status === "in-progress")) {
        return "In Progress";
    } else {
        return "Pending";
    }
};

export function InServiceView({ onNavigate, onBack }: InServiceViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedService, setSelectedService] = useState<ServiceDetails | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Use the service enquiries hook
    const {
        enquiries,
        loading,
        error,
        lastUpdate,
        refetch
    } = useServiceEnquiries(30000); // Poll every 30 seconds

    // Filter for in-service items only (items that have service assigned and are not yet completed)
    const inServiceItems = enquiries.filter(enquiry =>
        enquiry.serviceTypes &&
        enquiry.serviceTypes.length > 0 &&
        !enquiry.serviceTypes.every(service => service.status === "done")
    );

    // Apply search and status filters
    const filteredServices = inServiceItems.filter(enquiry => {
        const matchesSearch = searchTerm === "" ||
            enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enquiry.phone.includes(searchTerm) ||
            enquiry.enquiryId.toString().includes(searchTerm) ||
            enquiry.product.toLowerCase().includes(searchTerm.toLowerCase());

        const overallStatus = getOverallServiceStatus(enquiry.serviceTypes || []).toLowerCase();
        const matchesStatus = statusFilter === "all" || overallStatus === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleViewDetails = (service: ServiceDetails) => {
        setSelectedService(service);
        setShowDetailsModal(true);
    };

    // Get progress information for a service
    const getProgressInfo = (serviceTypes: ServiceTypeStatus[]) => {
        if (!serviceTypes || serviceTypes.length === 0) return { done: 0, total: 0, percentage: 0 };

        const done = serviceTypes.filter(service => service.status === "done").length;
        const total = serviceTypes.length;
        const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

        return { done, total, percentage };
    };

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
                    </button>
                    <div className="h-4 sm:h-6 w-px bg-border"></div>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center">
                            In Service
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                            Track items currently being serviced
                        </p>
                    </div>
                </div>

                {/* <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    {lastUpdate && (
                        <span className="text-xs text-muted-foreground text-center sm:text-left">
                            Last updated: {formatDate(lastUpdate.toISOString())}
                        </span>
                    )}
                    <div className="flex space-x-2">
                        <button
                            onClick={refetch}
                            disabled={loading}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-sm">Refresh</span>
                        </button>
                        <button
                            onClick={() => onNavigate("service", "manage-services")}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 sm:flex-none"
                        >
                            <Wrench className="h-4 w-4" />
                            <span className="text-sm">Workshop</span>
                        </button>
                    </div>
                </div>*/}
            </div>

            {/* Error State */}
            {error && (
                <Card className="p-4 sm:p-6 bg-red-50 border-red-200">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <h3 className="text-sm font-medium text-red-800">Failed to load services</h3>
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
                            placeholder="Search by customer, product, or ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>

                    {/* Status Filter */}
                    <FormControl size="small" className="sm:w-48 w-full">
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                            labelId="status-filter-label"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="in progress">In Progress</MenuItem>
                        </Select>
                    </FormControl>
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-xs sm:text-sm text-muted-foreground">
                    <span className="text-center sm:text-left">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredServices.length)} of {filteredServices.length} items in service
                    </span>

                </div>
            </Card>

            {/* Loading State */}
            {loading && inServiceItems.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading services</p>
                </Card>
            ) : paginatedServices.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No services found</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "No items are currently in service"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                        <button
                            onClick={() => onNavigate("service", "manage-services")}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
                        >
                            <Wrench className="h-4 w-4" />
                            <span>Go to Service Workshop</span>
                        </button>
                    )}
                </Card>
            ) : (
                <>
                    {/* Mobile + Tablet Card View (now applies to both mobile and tablet) */}
                    <div className="block lg:hidden space-y-4">
                        {paginatedServices.map((service) => {
                            const progress = getProgressInfo(service.serviceTypes || []);
                            const overallStatus = getOverallServiceStatus(service.serviceTypes || []);

                            return (
                                <Card key={service.enquiryId} className="p-4 hover:shadow-md transition-shadow flex flex-col space-y-3">
                                    {/* Top Row: ID + Status + Actions */}
                                    <div className="flex justify-between items-start flex-wrap">
                                        <div className="flex items-center space-x-2 flex-wrap">
                                            <span className="font-mono text-sm font-medium">{service.enquiryId}</span>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getServiceStatusColor(overallStatus.toLowerCase())}`}
                                            >
                                                {overallStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-1 mt-2 sm:mt-0">
                                            <button
                                                onClick={() => handleViewDetails(service)}
                                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onNavigate("service", "manage-service", service.enquiryId)}
                                                className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors rounded"
                                                title="Manage Service"
                                            >
                                                <Wrench className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-foreground text-sm truncate">{service.customerName}</h4>
                                        {service.address && <p className="text-xs text-muted-foreground line-clamp-2">{service.address}</p>}
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            <span className="truncate">{service.phone}</span>
                                        </div>
                                    </div>

                                    {/* Product & Cost */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Product:</span>
                                            <div className="font-medium text-foreground truncate">{service.product}</div>
                                            <div className="text-muted-foreground">Qty: {service.quantity}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Estimated Cost:</span>
                                            <div className="font-medium text-foreground">
                                                ₹{service.estimatedCost?.toLocaleString() || "0"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="text-muted-foreground">{progress.done}/{progress.total} completed</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-center text-xs font-medium text-blue-600">{progress.percentage}% Complete</div>
                                    </div>

                                    {/* Services List */}
                                    <div className="border-t border-border pt-2">
                                        <span className="text-xs text-muted-foreground">Services:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {service.serviceTypes?.slice(0, 3).map((serviceType, index) => (
                                                <span
                                                    key={index}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getServiceStatusColor(
                                                        serviceType.status
                                                    )}`}
                                                >
                                                    {serviceType.type}
                                                </span>
                                            ))}
                                            {service.serviceTypes && service.serviceTypes.length > 3 && (
                                                <span className="text-xs text-muted-foreground py-0.5">
                                                    +{service.serviceTypes.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <Card className="overflow-hidden hidden lg:block">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Services</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Progress</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Estimated Cost</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedServices.map((service) => {
                                        const progress = getProgressInfo(service.serviceTypes || []);
                                        const overallStatus = getOverallServiceStatus(service.serviceTypes || []);

                                        return (
                                            <tr
                                                key={service.enquiryId}
                                                className="border-b border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <span className="font-mono text-sm">{service.enquiryId}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div>
                                                        <div className="font-medium text-foreground">{service.customerName}</div>
                                                        {service.address && (
                                                            <div className="text-sm text-muted-foreground truncate max-w-xs">{service.address}</div>
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
                                                        <div className="text-sm text-muted-foreground">Qty: {service.quantity}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        {service.serviceTypes?.slice(0, 2).map((serviceType, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <span
                                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getServiceStatusColor(
                                                                        serviceType.status
                                                                    )}`}
                                                                >
                                                                    {capitalizeStatus(serviceType.status)}
                                                                </span>
                                                                <span className="text-sm text-foreground">{serviceType.type}</span>
                                                            </div>
                                                        ))}
                                                        {service.serviceTypes && service.serviceTypes.length > 2 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                +{service.serviceTypes.length - 2} more services
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${progress.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{progress.percentage}%</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {progress.done}/{progress.total} completed
                                                        </div>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getServiceStatusColor(
                                                                overallStatus.toLowerCase()
                                                            )}`}
                                                        >
                                                            {overallStatus}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-foreground">
                                                        ₹{service.estimatedCost?.toLocaleString() || "0"}
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

                                                        <button
                                                            onClick={() => onNavigate("service", "manage-service", service.enquiryId)}
                                                            className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                                                            title="Manage Service"
                                                        >
                                                            <Wrench className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                <h3 className="text-lg font-semibold">Service Details</h3>
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
                                        <div className="text-foreground font-mono">{selectedService.enquiryId}</div>
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
                                        <div className="text-foreground">{selectedService.address || 'Not provided'}</div>
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

                                {/* Cost Information */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Estimated Cost</label>
                                        <div className="text-foreground">₹{selectedService.estimatedCost?.toLocaleString() || '0'}</div>
                                    </div>
                                    {selectedService.actualCost && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Actual Cost</label>
                                            <div className="text-foreground">₹{selectedService.actualCost.toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Service Types */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Service Types</label>
                                    <div className="mt-2 space-y-3">
                                        {selectedService.serviceTypes?.map((serviceType, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-medium">{serviceType.type}</span>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getServiceStatusColor(serviceType.status)}`}>
                                                        {capitalizeStatus(serviceType.status)}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {serviceType.assignedTo && `Assigned to: ${serviceType.assignedTo}`}
                                                    {serviceType.department && ` (${serviceType.department})`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Overall Photos */}
                                {(selectedService.overallPhotos?.beforePhoto || selectedService.overallPhotos?.afterPhoto) && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Overall Photos</label>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedService.overallPhotos?.beforePhoto && (
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-2">Before Service</p>
                                                    <img
                                                        src={selectedService.overallPhotos.beforePhoto}
                                                        alt="Before service"
                                                        className="w-full h-32 object-cover rounded-lg border"
                                                    />
                                                </div>
                                            )}
                                            {selectedService.overallPhotos?.afterPhoto && (
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground mb-2">After Service</p>
                                                    <img
                                                        src={selectedService.overallPhotos.afterPhoto}
                                                        alt="After service"
                                                        className="w-full h-32 object-cover rounded-lg border"
                                                    />
                                                </div>
                                            )}
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

                                {/* Completion Date */}
                                {selectedService.completedAt && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Completed At</label>
                                        <div className="text-foreground">{formatDate(selectedService.completedAt)}</div>
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
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        onNavigate("service", "manage-service", selectedService.enquiryId);
                                    }}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors text-center"
                                >
                                    Manage Service
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}