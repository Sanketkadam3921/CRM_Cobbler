import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useExpenseData,
  expenseApiService,
  Expense as ApiExpense,
  Employee as ApiEmployee,
  ExpenseCreateRequest,
  EmployeeCreateRequest,
  ExpenseStats as ApiExpenseStats
} from "@/services/expenseApiService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Calendar,
  TrendingUp,
  Receipt,
  DollarSign,
  Upload,
  X,
  Edit,
  Trash2,
  Check,
  AlertTriangle,
  Menu,
  FileText,
  FileUp,
  Wallet,
  Filter,
} from "lucide-react";


// Using API types - renamed for clarity
type Expense = ApiExpense & {
  // Add any local UI-specific properties if needed
  billImage?: string;
  billFileName?: string;
};

type Employee = ApiEmployee;

const expenseCategories = [
  "Materials",
  "Tools",
  "Rent",
  "Utilities",
  "Transportation",
  "Marketing",
  "Staff Salaries",
  "Office Supplies",
  "Maintenance",
  "Professional Services",
  "Insurance",
  "Miscellaneous",
];

// Utility function to convert File to base64 for display
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ExpenseManagementSystem() {
  // API integration
  const {
    expenses,
    employees,
    stats,
    pagination,
    loading,
    error,
    filters,
    fetchExpenses,
    fetchEmployees,
    fetchStats,
    refreshData,
    setFilters
  } = useExpenseData();

  // UI state
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const expenseFormRef = useRef<HTMLDivElement>(null);
  const salaryFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showExpenseForm && expenseFormRef.current) {
      expenseFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showExpenseForm]);

  useEffect(() => {
    if (showSalaryForm && salaryFormRef.current) {
      salaryFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showSalaryForm]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [expenseFormData, setExpenseFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: getTodayDate(),
    description: "",
    notes: "",
    billImage: "",
    billFileName: "",
  });

  const [salaryFormData, setSalaryFormData] = useState({
    name: "",
    role: "",
    monthlySalary: "",
    dateAdded: getTodayDate(),
  });

  // Handle filter changes and trigger API calls - DEBOUNCED to prevent infinite loops
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        search: searchTerm || undefined,
        month: selectedMonth !== "all" ? selectedMonth : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      };

      // Only update if filters actually changed
      const currentFilterString = JSON.stringify(filters);
      const newFilterString = JSON.stringify(newFilters);

      if (currentFilterString !== newFilterString) {
        setFilters(newFilters);
        fetchExpenses(newFilters);
        fetchStats(newFilters);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedMonth, selectedCategory]); // Removed setFilters, fetchExpenses, fetchStats from dependencies

  // Removed generateUniqueId - no longer needed with API integration

  const validateExpenseForm = () => {
    const errors = [];

    if (!expenseFormData.title.trim()) errors.push("Title is required");
    if (!expenseFormData.amount || parseFloat(expenseFormData.amount) <= 0)
      errors.push("Amount must be a positive number");
    if (!expenseFormData.category) errors.push("Category is required");
    if (!expenseFormData.date) errors.push("Date is required");
    if (!expenseFormData.description.trim()) errors.push("Description is required");

    return errors;
  };

  const validateSalaryForm = () => {
    const errors = [];

    if (!salaryFormData.name.trim()) {
      errors.push("Employee name is required");
    } else if (!/^[a-zA-Z\s]+$/.test(salaryFormData.name.trim())) {
      errors.push("Employee name should only contain letters and spaces");
    }
    if (!salaryFormData.role.trim()) errors.push("Role is required");
    if (
      !salaryFormData.monthlySalary ||
      parseFloat(salaryFormData.monthlySalary) <= 0
    )
      errors.push("Salary must be a positive number");
    if (!salaryFormData.dateAdded) errors.push("Date is required");

    return errors;
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateExpenseForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(", "));
      return;
    }

    try {
      const expenseData: ExpenseCreateRequest = {
        title: expenseFormData.title.trim(),
        amount: parseFloat(expenseFormData.amount),
        category: expenseFormData.category,
        date: expenseFormData.date,
        description: expenseFormData.description.trim(),
        notes: expenseFormData.notes.trim() || undefined,
        billFile: billFile || undefined,
      };

      if (editingExpense) {
        // Update existing expense
        await expenseApiService.updateExpense(editingExpense.id, expenseData);
        toast.success("Expense updated successfully");
        setEditingExpense(null);
      } else {
        // Create new expense
        await expenseApiService.createExpense(expenseData);
        toast.success("Expense added successfully");
      }

      // Refresh data
      refreshData();
      resetExpenseForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save expense";
      toast.error(errorMessage);
      console.error("Error saving expense:", error);
    }
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateSalaryForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(", "));
      return;
    }

    try {
      const employeeData: EmployeeCreateRequest = {
        name: salaryFormData.name.trim(),
        role: salaryFormData.role.trim(),
        monthlySalary: parseFloat(salaryFormData.monthlySalary),
        dateAdded: salaryFormData.dateAdded,
      };

      if (editingEmployee) {
        // Update existing employee
        const updatedEmployee = await expenseApiService.updateEmployee(editingEmployee.id, employeeData);
        toast.success("Employee updated successfully");
        setEditingEmployee(null);
      } else {
        // Create new employee
        const newEmployee = await expenseApiService.createEmployee(employeeData);

        // Create corresponding salary expense
        const salaryExpenseData: ExpenseCreateRequest = {
          title: `Salary - ${newEmployee.name} (${newEmployee.role})`,
          amount: newEmployee.monthlySalary,
          category: "Staff Salaries",
          date: new Date(newEmployee.dateAdded).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
          description: `Monthly salary payment for ${newEmployee.name}`,
          notes: `Employee ID: ${newEmployee.id}, Role: ${newEmployee.role}`,
        };

        await expenseApiService.createExpense(salaryExpenseData);
        toast.success("Employee added and salary expense recorded");
      }

      // Refresh data
      refreshData();
      resetSalaryForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save employee";
      toast.error(errorMessage);
      console.error("Error saving employee:", error);
    }
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      title: "",
      amount: "",
      category: "",
      date: getTodayDate(),
      description: "",
      notes: "",
      billImage: "",
      billFileName: "",
    });
    setBillFile(null);
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const resetSalaryForm = () => {
    setSalaryFormData({
      name: "",
      role: "",
      monthlySalary: "",
      dateAdded: getTodayDate(),
    });
    setShowSalaryForm(false);
    setEditingEmployee(null);
  };

  const handleEdit = (expense: Expense) => {
    setExpenseFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      description: expense.description || "",
      notes: expense.notes || "",
      billImage: expense.billUrl || "",
      billFileName: expense.billUrl ? expense.billUrl.split('/').pop() || "" : "",
    });
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSalaryFormData({
      name: employee.name,
      role: employee.role,
      monthlySalary: employee.monthlySalary.toString(),
      dateAdded: employee.dateAdded,
    });
    setEditingEmployee(employee);
    setShowSalaryForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await expenseApiService.deleteExpense(id);
      toast.success("Expense deleted successfully");
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete expense";
      toast.error(errorMessage);
      console.error("Error deleting expense:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      try {
        setBillFile(file);
        const base64 = await fileToBase64(file);
        setExpenseFormData({
          ...expenseFormData,
          billImage: base64,
          billFileName: file.name,
        });
      } catch (error) {
        toast.error("Failed to process file");
        console.error("Error processing file:", error);
      }
    }
  };

  // Use API-provided stats or calculate from filtered data
  const monthlyTotal = stats?.monthlyTotal || 0;
  const filteredEntries = stats?.filteredEntries || expenses.length;
  const averageExpense = stats?.averageExpense || 0;
  const categoryTotals = stats?.categoryBreakdown || [];

  // Fallback calculations if no stats available
  const fallbackMonthlyTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const fallbackCategoryTotals = expenseCategories
    .map((category) => ({
      category,
      totalAmount: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0),
      entryCount: expenses.filter((expense) => expense.category === category).length,
      percentage: expenses.length > 0
        ? Math.round((expenses.filter((expense) => expense.category === category).length / expenses.length) * 100)
        : 0,
    }))
    .filter((item) => item.totalAmount > 0);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Materials: "bg-blue-500",
      Tools: "bg-green-500",
      Rent: "bg-purple-500",
      Utilities: "bg-yellow-500",
      Transportation: "bg-teal-500",
      Marketing: "bg-pink-500",
      "Staff Salaries": "bg-indigo-500",
      "Office Supplies": "bg-orange-500",
      Maintenance: "bg-red-500",
      "Professional Services": "bg-cyan-500",
      Insurance: "bg-violet-500",
      Miscellaneous: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  // Get available months from actual data
  const getAvailableMonths = () => {
    const months = new Set(expenses.map((exp) => exp.date.substring(0, 7)));
    const sortedMonths = Array.from(months).sort().reverse();
    const monthOptions = sortedMonths.map((month) => {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return {
        value: month,
        label: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
      };
    });

    return [{ value: "all", label: "All Months" }, ...monthOptions];
  };

  const isExpenseFormValid =
    expenseFormData.title.trim() &&
    expenseFormData.amount &&
    parseFloat(expenseFormData.amount) > 0 &&
    expenseFormData.category &&
    expenseFormData.date &&
    expenseFormData.description.trim();

  const isSalaryFormValid =
    salaryFormData.name.trim() &&
    salaryFormData.role.trim() &&
    salaryFormData.monthlySalary &&
    parseFloat(salaryFormData.monthlySalary) > 0 &&
    salaryFormData.dateAdded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Expense Management System
            </h1>
            <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Comprehensive expense tracking and management
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => setShowSalaryForm(!showSalaryForm)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm sm:text-base"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
            <Button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-sm sm:text-base"
              size="sm"
            >
              <Plus className="h-4 w-4 " />
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{Math.round(monthlyTotal).toLocaleString("en-IN")}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Monthly Total
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredEntries}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Filtered Entries{" "}
                  {pagination.total !== filteredEntries &&
                    `(of ${pagination.total})`}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  ₹{Math.round(averageExpense).toLocaleString("en-IN")}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Average Expense
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {categoryTotals.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Categories
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <Card className="p-4 sm:p-6 bg-white border border-gray-200 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
              Category Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {(categoryTotals.length > 0 ? categoryTotals : fallbackCategoryTotals).map((item) => (
                <div
                  key={item.category}
                  className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                    <div
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getCategoryColor(
                        item.category
                      )}`}
                    />
                    <span className="font-semibold text-gray-700 text-sm sm:text-base">
                      {item.category}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      ₹{Math.round(item.totalAmount || 0).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {(item.entryCount || 0)} entries ({typeof item.percentage === "number" ? item.percentage.toFixed(2) : "0.00"}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div ref={expenseFormRef}>
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                {editingExpense ? "Update Expense" : "Add New Expense"}
              </h3>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="expenseTitle"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Expense Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expenseTitle"
                      type="text"
                      value={expenseFormData.title}
                      onChange={(e) => {
                        // Allow only letters and spaces
                        let value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // remove non-letters
                        value = value.replace(/\s{2,}/g, " "); // collapse multiple spaces
                        setExpenseFormData({
                          ...expenseFormData,
                          title: value,
                        });
                      }}
                      placeholder="Enter expense title"
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="expenseAmount"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expenseAmount"
                      type="text"
                      inputMode="decimal" // shows decimal keypad on mobile
                      value={expenseFormData.amount}
                      onChange={(e) => {
                        // Allow only numbers and decimals
                        let value = e.target.value.replace(/[^0-9.]/g, "");

                        // Prevent multiple dots
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts[1];
                        }

                        setExpenseFormData({
                          ...expenseFormData,
                          amount: value,
                        });
                      }}
                      placeholder="0"
                      className="mt-1 border-slate-300 focus:border-blue-500 no-spinner text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="expenseCategory"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={expenseFormData.category}
                      onValueChange={(value) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1 border-slate-300 focus:border-blue-500 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="expenseDate"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          date: e.target.value,
                        })
                      }
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                      max={new Date().toISOString().split("T")[0]} // ✅ no future dates
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="expenseBillImage"
                    className="text-slate-700 font-medium text-sm mb-1 block"
                  >
                    Upload Bill
                  </Label>
                  <div
                    className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-900/25 px-6 py-10 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    onDrop={(e) => {
                      e.preventDefault();
                      handleImageUpload({
                        target: { files: e.dataTransfer.files },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() =>
                      document.getElementById("expenseBillImage")?.click()
                    }
                  >
                    <div className="text-center">
                      <FileUp
                        className="mx-auto h-12 w-12 text-slate-400"
                        aria-hidden="true"
                      />
                      <div className="mt-4 flex text-sm leading-6 text-slate-600">
                        <p className="pl-1">
                          Drag and drop, or click to upload
                        </p>
                      </div>
                      <p className="text-xs leading-5 text-slate-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                    <Input
                      id="expenseBillImage"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </div>
                  {expenseFormData.billFileName && (
                    <div className="mt-2 flex items-center justify-between bg-slate-100 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <span className="text-sm text-slate-800 font-medium truncate">
                          {expenseFormData.billFileName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpenseFormData({
                            ...expenseFormData,
                            billImage: "",
                            billFileName: "",
                          })
                        }
                        className="text-red-600 hover:bg-red-100 h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="expenseDescription"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="expenseDescription"
                    value={expenseFormData.description}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the expense..."
                    rows={2}
                    className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="expenseNotes"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Notes
                  </Label>
                  <Textarea
                    id="expenseNotes"
                    value={expenseFormData.notes}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes or details..."
                    rows={3}
                    className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={!isExpenseFormValid}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {editingExpense ? "Update Expense" : "Save Expense"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetExpenseForm}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs sm:text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Salary Form */}
        {showSalaryForm && (
          <div ref={salaryFormRef}>
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                {editingEmployee ? "Update Employee" : "Add New Employee"}
              </h3>
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="employeeName"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Employee Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeName"
                      type="text"
                      value={salaryFormData.name}
                      onChange={(e) => {
                        // Allow only letters and spaces
                        let value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // remove non-letters
                        value = value.replace(/\s{2,}/g, " "); // collapse multiple spaces into one
                        setSalaryFormData({ ...salaryFormData, name: value });
                      }}
                      placeholder="Enter employee name"
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="employeeRole"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeRole"
                      type="text"
                      value={salaryFormData.role}
                      onChange={(e) => {
                        // Allow only letters and spaces
                        const value = e.target.value.replace(
                          /[^a-zA-Z\s]/g,
                          ""
                        );
                        setSalaryFormData({ ...salaryFormData, role: value });
                      }}
                      placeholder="Enter role/position"
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="monthlySalary"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Monthly Salary (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="monthlySalary"
                      type="text" // 👈 use text, we'll validate manually
                      inputMode="numeric" // shows numeric keypad on mobile
                      pattern="[0-9]*" // only digits allowed
                      min="0"
                      value={salaryFormData.monthlySalary}
                      onChange={(e) => {
                        // Allow only digits
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setSalaryFormData({
                          ...salaryFormData,
                          monthlySalary: value,
                        });
                      }}
                      placeholder="0"
                      className="mt-1 border-slate-300 focus:border-blue-500 no-spinner text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="dateAdded"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Date Added <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateAdded"
                      type="date"
                      value={salaryFormData.dateAdded}
                      onChange={(e) =>
                        setSalaryFormData({
                          ...salaryFormData,
                          dateAdded: e.target.value,
                        })
                      }
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                      max={new Date().toISOString().split("T")[0]} // ✅ prevents future dates
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={!isSalaryFormValid}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {editingEmployee ? "Update Employee" : "Add Employee & Record Salary"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetSalaryForm}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs sm:text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Menu className="h-4 w-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <div className={`${showMobileFilters ? "block" : "hidden"} sm:block`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 border-slate-300 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-28 border-slate-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableMonths().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-32 border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>


        {/* Main Content */}
        <div className="space-y-3 sm:space-y-4">
          {expenses.length === 0 ? (
            <Card className="p-8 sm:p-12 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg text-center">
              <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">
                {expenses.length === 0
                  ? "No expenses added yet"
                  : "No expenses match your filters"}
              </h3>
              <p className="text-slate-500 text-sm sm:text-base">
                {expenses.length === 0
                  ? "Add your first expense to get started."
                  : "Try adjusting your search terms or filters to see results."}
              </p>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card
                key={expense.id}
                className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {expense.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getCategoryColor(
                            expense.category
                          )} text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm`}
                        >
                          {expense.category}
                        </Badge>
                      </div>
                    </div>
                    {expense.description && (
                      <p className="text-slate-600 mb-3 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200 text-sm sm:text-base">
                        <strong>Description:</strong> {expense.description}
                      </p>
                    )}
                    {expense.notes && (
                      <p className="text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border-l-4 border-slate-200 text-sm sm:text-base">
                        <strong>Notes:</strong> {expense.notes}
                      </p>
                    )}
                    <div className="text-xs text-slate-600">
                      Created:{" "}
                      {new Date(expense.createdAt).toLocaleString("en-IN")}
                      {expense.updatedAt !== expense.createdAt && (
                        <span>
                          {" "}
                          • Updated:{" "}
                          {new Date(expense.updatedAt).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="lg:text-right lg:ml-6 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                      ₹{Math.round(expense.amount).toLocaleString("en-IN")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(expense)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-8"
                          >
                            <Trash2 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the expense and remove its data
                              from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(expense.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Employee List */}
        {employees.length > 0 && (
          <Card className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Employee Salary Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {employees.map((employee) => (
                <Card
                  key={employee.id}
                  className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Header with name and edit button */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                        {employee.name}
                      </h4>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEmployee(employee)}
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-xs h-7 px-2 ml-2 flex-shrink-0"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <p className="text-sm sm:text-base text-slate-600 font-medium">
                      {employee.role}
                    </p>
                  </div>

                  {/* Salary */}
                  <div className="mb-4">
                    <p className="text-lg sm:text-xl font-bold text-indigo-600">
                      ₹{Math.round(employee.monthlySalary).toLocaleString("en-IN")}/month
                    </p>
                  </div>

                  {/* Date Information */}
                  <div className="space-y-2 pt-3 border-t border-indigo-100">
                    <div className="text-xs sm:text-sm text-slate-500">
                      <span className="font-medium">Added:</span>{" "}
                      {new Date(employee.dateAdded).toLocaleDateString("en-IN")}
                    </div>
                    {employee.updatedAt && employee.updatedAt !== employee.createdAt && (
                      <div className="text-xs sm:text-sm font-bold text-green-600">
                        <span className="font-medium">Updated:</span>{" "}
                        {new Date(employee.updatedAt).toLocaleDateString("en-IN")} at{" "}
                        {new Date(employee.updatedAt).toLocaleTimeString("en-IN", {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Summary Footer */}
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-0 shadow-xl">
          <div className="text-center text-white">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              Expense Summary
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              Total of{" "}
              <span className="font-bold text-white">
                {filteredEntries}
              </span>{" "}
              expenses worth{" "}
              <span className="font-bold mr-2 text-white">
                ₹{Math.round(monthlyTotal).toLocaleString("en-IN")}
              </span>
              across{" "}
              <span className="font-bold text-white">
                {categoryTotals.length || fallbackCategoryTotals.length}
              </span>{" "}
              categories
              {pagination.total !== filteredEntries && (
                <span className="block mt-1 text-xs sm:text-sm">
                  (Filtered from {pagination.total} total expenses)
                </span>
              )}
              {loading && (
                <span className="block mt-1 text-xs text-blue-300">
                  Loading latest data...
                </span>
              )}
              {error && (
                <span className="block mt-1 text-xs text-amber-300">
                  API unavailable - showing cached data
                </span>
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}