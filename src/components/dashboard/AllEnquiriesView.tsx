import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    Users,
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Phone,
    Calendar,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    UserCheck,
    ArrowLeft,
} from "lucide-react";
import { useEnquiriesWithPolling, EnquiryApiService } from "@/services/enquiryApiService";
import { Enquiry } from "@/types";

interface AllEnquiriesViewProps {
    onNavigate: (view: string, action?: string, id?: number) => void;
    onBack: () => void;
}

// Helper: format date
// Helper: format date (date only, no time)
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

// Status colors
const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "new":
            return "text-blue-600 bg-blue-50 border-blue-200";
        case "contacted":
            return "text-amber-600 bg-amber-50 border-amber-200";
        case "converted":
            return "text-green-600 bg-green-50 border-green-200";
        case "closed":
            return "text-gray-600 bg-gray-50 border-gray-200";
        case "lost":
            return "text-red-600 bg-red-50 border-red-200";
        default:
            return "text-gray-600 bg-gray-50 border-gray-200";
    }
};

// Stage colors
const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
        case "enquiry":
            return "text-blue-600 bg-blue-50 border-blue-200";
        case "pickup":
            return "text-amber-600 bg-amber-50 border-amber-200";
        case "service":
            return "text-purple-600 bg-purple-50 border-purple-200";
        case "billing":
            return "text-orange-600 bg-orange-50 border-orange-200";
        case "delivery":
            return "text-green-600 bg-green-50 border-green-200";
        case "completed":
            return "text-emerald-600 bg-emerald-50 border-emerald-200";
        default:
            return "text-gray-600 bg-gray-50 border-gray-200";
    }
};

// Capitalize
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function AllEnquiriesView({ onNavigate, onBack }: AllEnquiriesViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [stageFilter, setStageFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Polling
    const { enquiries, loading, error, lastUpdate, refetch, deleteEnquiry } =
        useEnquiriesWithPolling(30000);

    // Filter
    const filteredEnquiries = enquiries.filter((enquiry) => {
        const matchesSearch =
            searchTerm === "" ||
            enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enquiry.phone.includes(searchTerm) ||
            enquiry.id.toString().includes(searchTerm);

        const matchesStage = stageFilter === "all" || enquiry.currentStage === stageFilter;

        return matchesSearch && matchesStage;
    });

    // Pagination
    const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEnquiries = filteredEnquiries.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, stageFilter]);

    // Delete
    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this enquiry?")) {
            try {
                await deleteEnquiry(id);
            } catch (error) {
                console.error("Failed to delete enquiry:", error);
            }
        }
    };

    // View
    const handleViewDetails = (enquiry: Enquiry) => {
        setSelectedEnquiry(enquiry);
        setShowDetailsModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in p-2 sm:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-border hidden sm:block"></div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                            All Enquiries
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Manage and track all customer enquiries
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {lastUpdate && (
                        <span className="text-xs text-muted-foreground">
                            Last updated: {formatDate(lastUpdate.toISOString())}
                        </span>
                    )}
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="flex items-center space-x-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>

                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Stage Filter */}
                    <div className="sm:w-48">
                        <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="all">All Stages</option>
                            <option value="enquiry">Enquiry</option>
                            <option value="pickup">Pickup</option>
                            <option value="service">Service</option>
                            <option value="billing">Billing</option>
                            <option value="delivery">Delivery</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Enquiries Table (Responsive) */}
            {/* Enquiries List */}
            <Card className="overflow-hidden">
                {/* Table view - only for laptop/desktop */}
                <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full min-w-[700px]">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4">ID</th>
                                <th className="text-left p-4">Customer</th>
                                <th className="text-left p-4">Contact</th>
                                <th className="text-left p-4">Product</th>
                                <th className="text-left p-4">Status</th>
                                <th className="text-left p-4">Stage</th>
                                <th className="text-left p-4">Created</th>
                                <th className="text-left p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEnquiries.map((enquiry) => (
                                <tr key={enquiry.id} className="border-b border-border hover:bg-muted/30">
                                    <td className="p-4 font-mono text-sm">#{enquiry.id}</td>
                                    <td className="p-4">{enquiry.customerName}</td>
                                    <td className="p-4">
                                        <div className="flex items-center text-sm">
                                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                                            {enquiry.phone}
                                        </div>
                                    </td>
                                    <td className="p-4">{enquiry.product}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs border ${getStatusColor(enquiry.status)}`}>
                                            {capitalize(enquiry.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs border ${getStageColor(enquiry.currentStage)}`}>
                                            {capitalize(enquiry.currentStage)}
                                        </span>
                                    </td>
                                    <td className="p-4">{formatDate(enquiry.date)}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleViewDetails(enquiry)} className="p-1 hover:text-primary">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => onNavigate("crm", "edit-enquiry", enquiry.id)} className="p-1 hover:text-blue-600">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(enquiry.id)} className="p-1 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Card view - only for mobile */}
                <div className="space-y-4 sm:hidden p-4">
                    {paginatedEnquiries.map((enquiry) => (
                        <div
                            key={enquiry.id}
                            className="border border-border rounded-xl p-4 shadow-sm bg-white"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">{enquiry.customerName}</h3>
                                <span className="text-xs font-mono">#{enquiry.id}</span>
                            </div>

                            <p className="text-sm text-muted-foreground flex items-center">
                                <Phone className="h-4 w-4 mr-1" /> {enquiry.phone}
                            </p>
                            <p className="text-sm">Product: {enquiry.product}</p>

                            <div className="flex flex-wrap gap-2 my-2">
                                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(enquiry.status)}`}>
                                    {capitalize(enquiry.status)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs border ${getStageColor(enquiry.currentStage)}`}>
                                    {capitalize(enquiry.currentStage)}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Created: {formatDate(enquiry.date)}
                            </p>

                            <div className="flex justify-end space-x-2 mt-3">
                                <button onClick={() => handleViewDetails(enquiry)} className="p-1 hover:text-primary">
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button onClick={() => onNavigate("crm", "edit-enquiry", enquiry.id)} className="p-1 hover:text-blue-600">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(enquiry.id)} className="p-1 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

        </div>
    );
}
