import { Enquiry } from "@/types";

interface InvoiceDisplayProps {
  enquiry: Enquiry;
}

export function InvoiceDisplay({ enquiry }: InvoiceDisplayProps) {
  if (!enquiry?.serviceDetails?.billingDetails) {
    return <div>No billing details found.</div>;
  }

  const billingDetails = enquiry.serviceDetails.billingDetails;

  // ✅ Force dd/mm/yyyy format
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  return (
    <div
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        background: "white",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Invoice Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "2px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Business Info */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          {billingDetails.businessInfo?.logo && (
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "#f3f4f6",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px solid #e5e7eb",
              }}
            >
              <img
                src={billingDetails.businessInfo.logo}
                alt="Business Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          )}
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#111827",
                margin: "0 0 4px 0",
              }}
            >
              {billingDetails.businessInfo?.businessName || "Business Name"}
            </h1>
            {billingDetails.businessInfo?.tagline && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  margin: "0 0 12px 0",
                }}
              >
                {billingDetails.businessInfo.tagline}
              </p>
            )}
            <div className="text-gray-500 text-sm leading-5">
              <p>
                <span className="font-semibold text-gray-700">Address:</span>{" "}
                {billingDetails.businessInfo?.address || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Phone:</span>{" "}
                {billingDetails.businessInfo?.phone || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Email:</span>{" "}
                {billingDetails.businessInfo?.email || "-"}
              </p>
              {billingDetails.businessInfo?.gstNumber && (
                <p>
                  <span className="font-semibold text-gray-700">GST:</span>{" "}
                  {billingDetails.businessInfo.gstNumber}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Invoice Details */}
        <div className="text-right">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">INVOICE</h2>

          <div className="text-sm md:text-base leading-6 space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold">Invoice #:</span>
              <span>{billingDetails.invoiceNumber || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Date:</span>
              <span>{formatDate(billingDetails.invoiceDate || "")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Due Date:</span>
              <span>{formatDate(billingDetails.invoiceDate || "")}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Customer Info */}
      <div style={{ padding: "20px", borderBottom: "2px solid #e5e7eb" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}
        >
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 12px 0",
              }}
            >
              Bill To:
            </h3>
            <div
              style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.4" }}
            >
              <p
                style={{
                  fontWeight: "500",
                  color: "#111827",
                  margin: "0",
                }}
              >
                {billingDetails.customerName}
              </p>
              <p style={{ margin: "0" }}>{billingDetails.customerAddress}</p>
              <p style={{ margin: "0" }}>Phone: {billingDetails.customerPhone}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
            <div className="text-sm text-gray-500 leading-6 space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Invoice Number:</span>
                <span>{billingDetails.invoiceNumber || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Invoice Date:</span>
                <span>{formatDate(billingDetails.invoiceDate || "")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Generated:</span>
                <span>{formatDate(billingDetails.generatedAt || "")}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Items Summary */}
      {(() => {
        // Group items by product and itemIndex
        const itemsMap = new Map<string, Array<typeof billingDetails.items[0]>>();
        billingDetails.items.forEach(item => {
          const productName = (item as any).productName || 'Unknown Product';
          const itemIndex = (item as any).itemIndex || 1;
          const key = `${productName}-${itemIndex}`;

          if (!itemsMap.has(key)) {
            itemsMap.set(key, []);
          }
          itemsMap.get(key)!.push(item);
        });

        if (itemsMap.size > 1) {
          return (
            <div style={{ padding: "20px", borderBottom: "2px solid #e5e7eb" }}>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                }}
              >
                Items Summary:
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {Array.from(itemsMap.entries()).map(([key, items]) => {
                  const [productName, itemIndex] = key.split('-');
                  return (
                    <div
                      key={key}
                      style={{
                        padding: "12px",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          color: "#111827",
                          margin: "0 0 8px 0",
                          fontSize: "14px",
                        }}
                      >
                        {productName} #{itemIndex}
                      </p>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {items.map((item, idx) => (
                          <p key={idx} style={{ margin: "0 0 4px 0" }}>
                            • {item.serviceType}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Services Table */}
      {/* 👇 keeping your table code as-is */}
      <div style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Service
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Price
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Discount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  GST
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {billingDetails.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div>
                      <p
                        style={{
                          fontWeight: "500",
                          color: "#111827",
                          margin: "0",
                        }}
                      >
                        {item.serviceType}
                      </p>
                      {(item as any).productName && (item as any).itemIndex && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#2563eb",
                            margin: "0",
                            fontWeight: "500",
                          }}
                        >
                          {(item as any).productName} #{(item as any).itemIndex}
                        </p>
                      )}
                      {item.description && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: "0",
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <p
                      style={{
                        fontWeight: "500",
                        color: "#111827",
                        margin: "0",
                      }}
                    >
                      {formatCurrency(
                        parseFloat(item.originalAmount) || 0
                      )}
                    </p>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {(parseFloat(item.discountAmount) || 0) > 0 ? (
                      <p style={{ color: "#059669", margin: "0" }}>
                        -
                        {formatCurrency(
                          parseFloat(item.discountAmount) || 0
                        )}
                      </p>
                    ) : (
                      <p style={{ color: "#6b7280", margin: "0" }}>-</p>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {(parseFloat(item.gstAmount) || 0) > 0 ? (
                      <div>

                        <p style={{ color: "#2563eb", margin: "0" }}>
                          +
                          {formatCurrency(
                            parseFloat(item.gstAmount) || 0
                          )}
                        </p>
                        <p
                          style={{
                            color: "#2563eb",
                            margin: "0",
                            fontSize: "12px",
                          }}
                        >
                          ({parseFloat(item.gstRate) || 0}%)
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: "#6b7280", margin: "0" }}>-</p>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <p
                      style={{
                        fontWeight: "500",
                        color: "#111827",
                        margin: "0",
                      }}
                    >
                      {formatCurrency(
                        (parseFloat(item.finalAmount) || 0) +
                        (parseFloat(item.gstAmount) || 0)
                      )}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Summary */}
      <div style={{ padding: "20px", background: "#f9fafb" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "320px" }}>
            {/* Original Amount */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#111827" }}>Original Amount:</span>
              <span style={{ fontWeight: "500", color: "#111827" }}>
                {formatCurrency(
                  billingDetails.items.reduce(
                    (sum, item) => sum + (parseFloat(item.originalAmount) || 0),
                    0
                  )
                )}
              </span>
            </div>

            {/* Service Discounts */}
            {billingDetails.items.some((item) => (parseFloat(item.discountAmount) || 0) > 0) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontWeight: "600", color: "#059669" }}>Service Discounts:</span>
                <span style={{ fontWeight: "500", color: "#059669" }}>
                  -{formatCurrency(
                    billingDetails.items.reduce(
                      (sum, item) => sum + (parseFloat(item.discountAmount) || 0),
                      0
                    )
                  )}
                </span>
              </div>
            )}

            {/* Subtotal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                marginBottom: "8px",
                borderTop: "1px solid #e5e7eb",
                paddingTop: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#111827" }}>Subtotal:</span>
              <span style={{ fontWeight: "500", color: "#111827" }}>
                {formatCurrency(parseFloat(billingDetails.subtotal) || 0)}
              </span>
            </div>

            {/* GST */}
            {billingDetails.gstIncluded && (parseFloat(billingDetails.gstAmount) || 0) > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontWeight: "600", color: "#2563eb" }}>Total GST:</span>
                <span style={{ fontWeight: "500", color: "#2563eb" }}>
                  +{formatCurrency(parseFloat(billingDetails.gstAmount) || 0)}
                </span>
              </div>
            )}

            {/* Total Amount */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: "bold",
                borderTop: "2px solid #d1d5db",
                paddingTop: "8px",
              }}
            >
              <span style={{ fontWeight: "700", color: "#111827" }}>Total Amount:</span>
              <span style={{ color: "#2563eb", fontWeight: "700" }}>
                {formatCurrency(parseFloat(billingDetails.totalAmount) || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Notes */}
      {billingDetails.notes && (
        <div style={{ padding: "20px", borderTop: "2px solid #e5e7eb" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              margin: "0 0 12px 0",
            }}
          >
            Notes:
          </h3>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
            {billingDetails.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "20px", background: "#111827", color: "white" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px" }}>
            <p style={{ margin: "0" }}>Thank you for your business!</p>
            <p style={{ color: "#9ca3af", margin: "4px 0 0 0" }}>
              {billingDetails.businessInfo?.businessName || "Business Name"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
