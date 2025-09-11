import { Enquiry } from "@/types";

interface InvoiceDisplayProps {
  enquiry: Enquiry;
}

export function InvoiceDisplay({ enquiry }: InvoiceDisplayProps) {
  if (!enquiry?.serviceDetails?.billingDetails) {
    return <div>No billing details found.</div>;
  }

  const billingDetails = enquiry.serviceDetails.billingDetails;

  const formatDate = (dateString: string) => {
    if (!dateString) return new Date().toLocaleDateString('en-IN');
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toLocaleDateString('en-IN') : date.toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', background: 'white', fontFamily: 'Arial, sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      {/* Invoice Header */}
      <div style={{ padding: '20px', borderBottom: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Business Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {billingDetails.businessInfo?.logo && (
            <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
              <img 
                src={billingDetails.businessInfo.logo} 
                alt="Business Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>
              {billingDetails.businessInfo?.businessName || 'Business Name'}
            </h1>
            {billingDetails.businessInfo?.tagline && (
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' }}>
                {billingDetails.businessInfo.tagline}
              </p>
            )}
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
              <p style={{ margin: '0' }}>{billingDetails.businessInfo?.address || 'Address'}</p>
              <p style={{ margin: '0' }}>Phone: {billingDetails.businessInfo?.phone || 'Phone'}</p>
              <p style={{ margin: '0' }}>Email: {billingDetails.businessInfo?.email || 'Email'}</p>
              {billingDetails.businessInfo?.gstNumber && (
                <p style={{ margin: '0' }}>GST: {billingDetails.businessInfo.gstNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: '0 0 8px 0' }}>INVOICE</h2>
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            <p style={{ margin: '0' }}><strong>Invoice #:</strong> {billingDetails.invoiceNumber}</p>
            <p style={{ margin: '0' }}><strong>Date:</strong> {formatDate(billingDetails.invoiceDate || '')}</p>
            <p style={{ margin: '0' }}><strong>Due Date:</strong> {formatDate(billingDetails.invoiceDate || '')}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ padding: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>Bill To:</h3>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
              <p style={{ fontWeight: '500', color: '#111827', margin: '0' }}>{billingDetails.customerName}</p>
              <p style={{ margin: '0' }}>{billingDetails.customerAddress}</p>
              <p style={{ margin: '0' }}>Phone: {billingDetails.customerPhone}</p>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>Invoice Details:</h3>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>
              <p style={{ margin: '0' }}><strong>Invoice Number:</strong> {billingDetails.invoiceNumber}</p>
              <p style={{ margin: '0' }}><strong>Invoice Date:</strong> {formatDate(billingDetails.invoiceDate || '')}</p>
              <p style={{ margin: '0' }}><strong>Generated:</strong> {formatDate(billingDetails.generatedAt || '')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#111827' }}>Service</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#111827' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#111827' }}>Discount</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#111827' }}>GST</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#111827' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {billingDetails.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div>
                      <p style={{ fontWeight: '500', color: '#111827', margin: '0' }}>{item.serviceType}</p>
                      {item.description && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <p style={{ fontWeight: '500', color: '#111827', margin: '0' }}>{formatCurrency(parseFloat(item.originalAmount) || 0)}</p>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {(parseFloat(item.discountAmount) || 0) > 0 ? (
                      <p style={{ color: '#059669', margin: '0' }}>-{formatCurrency(parseFloat(item.discountAmount) || 0)}</p>
                    ) : (
                      <p style={{ color: '#6b7280', margin: '0' }}>-</p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {(parseFloat(item.gstAmount) || 0) > 0 ? (
                      <div>
                        <p style={{ color: '#2563eb', margin: '0', fontSize: '12px' }}>({parseFloat(item.gstRate) || 0}%)</p>
                        <p style={{ color: '#2563eb', margin: '0' }}>+{formatCurrency(parseFloat(item.gstAmount) || 0)}</p>
                      </div>
                    ) : (
                      <p style={{ color: '#6b7280', margin: '0' }}>-</p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <p style={{ fontWeight: '500', color: '#111827', margin: '0' }}>{formatCurrency((parseFloat(item.finalAmount) || 0) + (parseFloat(item.gstAmount) || 0))}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Summary */}
      <div style={{ padding: '20px', background: '#f9fafb' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ color: '#6b7280' }}>Original Amount:</span>
              <span style={{ fontWeight: '500' }}>{formatCurrency(billingDetails.items.reduce((sum, item) => sum + (parseFloat(item.originalAmount) || 0), 0))}</span>
            </div>
                          {billingDetails.items.some(item => (parseFloat(item.discountAmount) || 0) > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#059669' }}>
                  <span>
                    Service Discounts:
                  </span>
                  <span>-{formatCurrency(billingDetails.items.reduce((sum, item) => sum + (parseFloat(item.discountAmount) || 0), 0))}</span>
                </div>
              )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
              <span style={{ fontWeight: '500', color: '#111827' }}>Subtotal:</span>
              <span style={{ fontWeight: '500', color: '#111827' }}>{formatCurrency(parseFloat(billingDetails.subtotal) || 0)}</span>
            </div>
            {billingDetails.gstIncluded && (parseFloat(billingDetails.gstAmount) || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#2563eb' }}>
                <span>Total GST:</span>
                <span>+{formatCurrency(parseFloat(billingDetails.gstAmount) || 0)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #d1d5db', paddingTop: '8px' }}>
              <span>Total Amount:</span>
              <span style={{ color: '#2563eb' }}>{formatCurrency(parseFloat(billingDetails.totalAmount) || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {billingDetails.notes && (
        <div style={{ padding: '20px', borderTop: '2px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>Notes:</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>{billingDetails.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '20px', background: '#111827', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px' }}>
            <p style={{ margin: '0' }}>Thank you for your business!</p>
            <p style={{ color: '#9ca3af', margin: '4px 0 0 0' }}>
              {billingDetails.businessInfo?.businessName || 'Business Name'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}