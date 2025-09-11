import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingDetails, BusinessInfo } from "@/types";
import { Download, Send, Printer } from "lucide-react";

interface InvoiceUIProps {
  billingDetails: BillingDetails;
  onDownload?: () => void;
  onSend?: () => void;
  onPrint?: () => void;
}

export function InvoiceUI({ billingDetails, onDownload, onSend, onPrint }: InvoiceUIProps) {
  const businessInfo = billingDetails.businessInfo;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="max-w-4xl mx-auto bg-white shadow-lg border-0">
      {/* Invoice Header */}
      <div className="p-8 border-b border-gray-200">
        <div className="flex justify-between items-start">
          {/* Business Info */}
          <div className="flex items-start space-x-4">
            {businessInfo?.logo && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={businessInfo.logo} 
                  alt="Business Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{businessInfo?.businessName}</h1>
              {businessInfo?.tagline && (
                <p className="text-sm text-gray-600 mt-1">{businessInfo.tagline}</p>
              )}
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>{businessInfo?.address}</p>
                <p>Phone: {businessInfo?.phone}</p>
                <p>Email: {businessInfo?.email}</p>
                {businessInfo?.gstNumber && (
                  <p>GST: {businessInfo.gstNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-blue-600 mb-2">INVOICE</h2>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Invoice #:</span> {billingDetails.invoiceNumber}</p>
              <p><span className="font-medium">Date:</span> {formatDate(billingDetails.invoiceDate || '')}</p>
              <p><span className="font-medium">Due Date:</span> {formatDate(billingDetails.invoiceDate || '')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-8 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{billingDetails.customerName}</p>
              <p>{billingDetails.customerAddress}</p>
              <p>Phone: {billingDetails.customerPhone}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Invoice Number:</span> {billingDetails.invoiceNumber}</p>
              <p><span className="font-medium">Invoice Date:</span> {formatDate(billingDetails.invoiceDate || '')}</p>
              <p><span className="font-medium">Generated:</span> {formatDate(billingDetails.generatedAt || '')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="p-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Service</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {billingDetails.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.serviceType}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(item.finalAmount)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Summary */}
      <div className="p-8 bg-gray-50">
        <div className="flex justify-end">
          <div className="w-80 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-medium">{formatCurrency(billingDetails.finalAmount)}</span>
            </div>
            
                          {billingDetails.items.some(item => (item.discountAmount || 0) > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Service Discounts:
                  </span>
                  <span className="font-medium text-green-600">-{formatCurrency(billingDetails.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}</span>
                </div>
              )}
            
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="font-medium text-gray-900">Subtotal:</span>
              <span className="font-medium text-gray-900">{formatCurrency(billingDetails.subtotal)}</span>
            </div>
            
            {billingDetails.gstIncluded && billingDetails.gstAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST ({billingDetails.gstRate}%):</span>
                <span className="font-medium text-blue-600">+{formatCurrency(billingDetails.gstAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span>Total Amount:</span>
              <span className="text-blue-600">{formatCurrency(billingDetails.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {billingDetails.notes && (
        <div className="p-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
          <p className="text-sm text-gray-600">{billingDetails.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="p-8 bg-gray-900 text-white">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <p>Thank you for your business!</p>
            <p className="text-gray-400 mt-1">{businessInfo?.businessName}</p>
          </div>
          <div className="flex space-x-2">
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            )}
            {onSend && (
              <button
                onClick={onSend}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
              >
                <Send className="h-4 w-4" />
                <span>Send Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
