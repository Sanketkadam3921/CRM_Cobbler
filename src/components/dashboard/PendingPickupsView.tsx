import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    Calendar,
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
    Package,
    UserCheck
} from "lucide-react";
import { usePickupEnquiries, PickupApiService } from "@/services/pickupApiService";
import { Enquiry } from "@/types";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface PendingPickupsViewProps {
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

// Helper function to get pickup status color and capitalize
const getPickupStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'scheduled':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'assigned':
            return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'collected':
            return 'text-purple-600 bg-purple-50 border-purple-200';
        case 'received':
            return 'text-green-600 bg-green-50 border-green-200';
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200';
    }
};

// Helper to capitalize first letter
const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export function PendingPickupsView({ onNavigate, onBack }: PendingPickupsViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Use the pickup enquiries hook
    const {
        enquiries,
        loading,
        error,
        lastUpdate,
        refetch,
        assignPickup,
        markCollected,
        markReceived
    } = usePickupEnquiries(30000); // Poll every 30 seconds

    // Filter for pending pickups only
    const pendingPickups = enquiries.filter(enquiry =>
        enquiry.currentStage === 'pickup' &&
        enquiry.pickupDetails?.status !== 'received'
    );

    // Apply search and status filters
    const filteredPickups = pendingPickups.filter(enquiry => {
        const matchesSearch = searchTerm === "" ||
            enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enquiry.phone.includes(searchTerm) ||
            enquiry.id.toString().includes(searchTerm);

        const matchesStatus =
            statusFilter === "all" ||
            (enquiry.pickupDetails?.status?.toLowerCase() || "scheduled") === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredPickups.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPickups = filteredPickups.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Handle actions
    const handleAssignPickup = async (id: number, assignedTo: string) => {
        try {
            await assignPickup(id, assignedTo);
        } catch (error) {
            console.error('Failed to assign pickup:', error);
        }
    };




    const handleViewDetails = (enquiry: Enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowDetailsModal(true);
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
                            Pending Pickups
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                            Manage scheduled, assigned, and collected pickups
                        </p>
                    </div>
                </div>

                {/*  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
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
                            onClick={() => onNavigate("pickup", "schedule-pickup")}
                            className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 sm:flex-none"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm">Schedule</span>
                        </button>
                    </div>
                </div> */}
            </div>

            {/* Error State */}
            {error && (
                <Card className="p-4 sm:p-6 bg-red-50 border-red-200">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                            <h3 className="text-sm font-medium text-red-800">Failed to load pickups</h3>
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
                            placeholder="Search by name, phone, or ID"
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
                            <MenuItem value="scheduled">Scheduled</MenuItem>
                            <MenuItem value="assigned">Assigned</MenuItem>
                            <MenuItem value="collected">Collected</MenuItem>
                        </Select>
                    </FormControl>
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-xs sm:text-sm text-muted-foreground">
                    <span className="text-center sm:text-left">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPickups.length)} of {filteredPickups.length} pending pickups
                    </span>

                </div>
            </Card>

            {/* Loading State */}
            {loading && pendingPickups.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading pending pickups...</p>
                </Card>
            ) : paginatedPickups.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No pending pickups found</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "All pickups are either completed or no pickups are scheduled"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                        <button
                            onClick={() => onNavigate("pickup", "schedule-pickup")}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Schedule First Pickup</span>
                        </button>
                    )}
                </Card>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="space-y-3 lg:hidden">
                        {paginatedPickups.map((enquiry) => (
                            <Card key={enquiry.id} className="p-4 hover:shadow-md transition-shadow flex flex-col space-y-3">
                                {/* Top Info */}
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-mono text-sm font-medium">ID: {enquiry.id}</span>
                                        <h4 className="font-medium text-foreground text-sm">{enquiry.customerName}</h4>
                                        {enquiry.address && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{enquiry.address}</p>
                                        )}
                                    </div>
                                    {/* Status badge */}
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPickupStatusColor(enquiry.pickupDetails?.status || 'scheduled')}`}>
                                        {capitalizeStatus(enquiry.pickupDetails?.status || 'Scheduled')}
                                    </span>
                                </div>

                                {/* Products & Quantity */}
                                <div className="flex justify-between text-sm">
                                    <div className="flex-1">
                                        {enquiry.products && enquiry.products.length > 0 ? (
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground text-xs">Products:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {enquiry.products.map((product, index) => (
                                                        <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                            <Package className="h-3 w-3" />
                                                            <span>{product.product}</span>
                                                            <span>({product.quantity})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-muted-foreground">Product:</span> {enquiry.product}
                                                <div className="text-muted-foreground text-xs">Qty: {enquiry.quantity}</div>
                                            </div>
                                        )}
                                    </div>
                                    {enquiry.quotedAmount && (
                                        <div className="text-sm font-semibold text-green-600 ml-2">
                                            ₹{enquiry.quotedAmount.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Contact & Location */}
                                <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                        <Phone className="h-3 w-3" />
                                        <span>{enquiry.phone}</span>
                                    </div>
                                    {enquiry.location && (
                                        <div className="flex items-center space-x-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{enquiry.location}</span>
                                        </div>
                                    )}
                                    {enquiry.pickupDetails?.scheduledTime && (
                                        <div className="flex items-center space-x-1">
                                            <Clock className="h-3 w-3" />
                                            <span>Scheduled: {formatDate(enquiry.pickupDetails.scheduledTime)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">Assigned:</span> {enquiry.pickupDetails?.assignedTo || 'Unassigned'}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => handleViewDetails(enquiry)}
                                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    {enquiry.pickupDetails?.status === 'scheduled' && !enquiry.pickupDetails?.assignedTo && (
                                        <button
                                            onClick={() => {
                                                const assignTo = prompt('Assign to (staff member name):');
                                                if (assignTo) handleAssignPickup(enquiry.id, assignTo);
                                            }}
                                            className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                                            title="Assign Pickup"
                                        >
                                            <UserCheck className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onNavigate("pickup", "manage-pickup", enquiry.id)}
                                        className="p-1 text-muted-foreground hover:text-green-600 transition-colors"
                                        title="Manage Pickup"
                                    >
                                        <Package className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>

                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <Card className="overflow-hidden hidden lg:block">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Pickup Status</th>
                                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPickups.map((enquiry) => (
                                        <tr key={enquiry.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <span className="font-mono text-sm">{enquiry.id}</span>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-foreground">{enquiry.customerName}</div>
                                                    {enquiry.address && (
                                                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                            {enquiry.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                                                        <span>{enquiry.phone.startsWith("+91") ? enquiry.phone : `+91 ${enquiry.phone}`}</span>
                                                    </div>
                                                    {enquiry.location && (
                                                        <div className="flex items-center text-sm text-muted-foreground">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            <span className="truncate max-w-xs">{enquiry.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    {enquiry.products && enquiry.products.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <div className="text-xs text-muted-foreground">Products:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {enquiry.products.map((product, index) => (
                                                                    <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                                        <Package className="h-3 w-3" />
                                                                        <span>{product.product}</span>
                                                                        <span>({product.quantity})</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-medium">{enquiry.product}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Qty: {enquiry.quantity}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {enquiry.quotedAmount && (
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            ₹{enquiry.quotedAmount.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPickupStatusColor(enquiry.pickupDetails?.status || 'scheduled')}`}>
                                                    {capitalizeStatus(enquiry.pickupDetails?.status || 'Scheduled')}
                                                </span>
                                            </td>


                                            <td className="p-4">
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => handleViewDetails(enquiry)}
                                                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {enquiry.pickupDetails?.status === 'scheduled' && !enquiry.pickupDetails?.assignedTo && (
                                                        <button
                                                            onClick={() => {
                                                                const assignTo = prompt('Assign to (staff member name):');
                                                                if (assignTo) handleAssignPickup(enquiry.id, assignTo);
                                                            }}
                                                            className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                                                            title="Assign Pickup"
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => onNavigate("pickup", "manage-pickup", enquiry.id)}
                                                        className="p-1 text-muted-foreground hover:text-green-600 transition-colors"
                                                        title="Manage Pickup"
                                                    >
                                                        <Package className="h-4 w-4" />
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
            {showDetailsModal && selectedEnquiry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Pickup Details</h3>
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
                                        <div className="text-foreground">{selectedEnquiry.customerName}</div>
                                    </div>

                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                        <div className="text-foreground">{selectedEnquiry.phone.startsWith("+91") ? selectedEnquiry.phone : `+91 ${selectedEnquiry.phone}`}</div>
                                    </div>

                                </div>

                                {/* Address */}
                                {selectedEnquiry.address && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                                        <div className="text-foreground">{selectedEnquiry.address}</div>
                                    </div>
                                )}

                                {/* Product Details */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Products</label>
                                        {selectedEnquiry.products && selectedEnquiry.products.length > 0 ? (
                                            <div className="mt-2 space-y-2">
                                                {selectedEnquiry.products.map((product, index) => (
                                                    <div key={index} className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border">
                                                        <Package className="h-4 w-4 text-blue-600" />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-foreground">{product.product}</div>
                                                            <div className="text-sm text-muted-foreground">Quantity: {product.quantity}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border">
                                                <Package className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-foreground">{selectedEnquiry.product}</div>
                                                    <div className="text-sm text-muted-foreground">Quantity: {selectedEnquiry.quantity}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pickup Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Pickup Status</label>
                                        <div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPickupStatusColor(selectedEnquiry.pickupDetails?.status || 'scheduled')}`}>
                                                {capitalizeStatus(selectedEnquiry.pickupDetails?.status || 'Scheduled')}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                                        <div className="text-foreground">{selectedEnquiry.pickupDetails?.assignedTo || 'Unassigned'}</div>
                                    </div>
                                </div>

                                {/* Timing */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    {selectedEnquiry.pickupDetails?.collectedAt && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Collected At</label>
                                            <div className="text-foreground">{formatDate(selectedEnquiry.pickupDetails.collectedAt)}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                {selectedEnquiry.quotedAmount && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Quoted Amount</label>
                                        <div className="text-foreground">₹{selectedEnquiry.quotedAmount.toLocaleString()}</div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedEnquiry.pickupDetails?.collectionNotes && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Collection Notes</label>
                                        <div className="text-foreground bg-muted/30 p-3 rounded-lg">
                                            {selectedEnquiry.pickupDetails.collectionNotes}
                                        </div>
                                    </div>
                                )}

                                {/* Original Message */}
                                {selectedEnquiry.message && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Original Message</label>
                                        <div className="text-foreground bg-muted/30 p-3 rounded-lg">
                                            {selectedEnquiry.message}
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
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        onNavigate("pickup", "manage-pickup", selectedEnquiry.id);
                                    }}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors text-center"
                                >
                                    Manage Pickup
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}