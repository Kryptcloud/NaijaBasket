import React from "react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface InvoiceData {
  id: number;
  invoice_number: string;
  sale_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
}

interface InvoiceModalProps {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${invoice?.invoice_number}.pdf`,
  });

  const downloadPDF = async () => {
    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${invoice?.invoice_number || "invoice"}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  if (!invoice) return null;

  const modalOverlay = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContent = {
    background: "linear-gradient(135deg, #0A0F0C 0%, #0F1A14 100%)",
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
    maxWidth: 700,
    maxHeight: "90vh",
    overflowY: "auto" as const,
    animation: "slideUp 0.4s ease",
  };

  const invoiceContent = {
    background: "#fff",
    color: "#000",
    padding: 40,
    fontFamily: "Arial, sans-serif",
  };

  const headerStyle = {
    borderBottom: "2px solid #2D6A4F",
    paddingBottom: 20,
    marginBottom: 20,
  };

  const sectionStyle = {
    marginBottom: 20,
  };

  const labelStyle = {
    fontSize: 10,
    color: "#666",
    textTransform: "uppercase" as const,
    fontWeight: "bold" as const,
    marginBottom: 4,
  };

  const valueStyle = {
    fontSize: 12,
    color: "#333",
    marginBottom: 8,
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: 20,
    borderTop: "1px solid #ddd",
    borderBottom: "2px solid #2D6A4F",
  };

  const thStyle = {
    background: "#f5f5f5",
    padding: 8,
    textAlign: "left" as const,
    fontWeight: "bold" as const,
    fontSize: 11,
    borderBottom: "1px solid #ddd",
  };

  const tdStyle = {
    padding: 8,
    fontSize: 12,
    borderBottom: "1px solid #eee",
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)", padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Invoice</div>
            <div style={{ fontSize: 12, color: "rgba(17, 17, 17, 0.7)" }}>{invoice.invoice_number}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              color: "#fff",
              border: "none",
              borderRadius: 50,
              width: 32,
              height: 32,
              fontSize: 18,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>

        {/* Invoice Content */}
        <div ref={printRef} style={invoiceContent}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#111", marginBottom: 4 }}>
              🥚 NaijaBasket
            </div>
            <div style={{ fontSize: 10, color: "#666" }}>Egg Distribution Business · Aba, Nigeria</div>
          </div>

          {/* Invoice Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Customer Info */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Bill To:</div>
              <div style={valueStyle}>
                <strong>{invoice.customer_name}</strong>
              </div>
              {invoice.customer_phone && <div style={valueStyle}>{invoice.customer_phone}</div>}
              {invoice.customer_email && <div style={valueStyle}>{invoice.customer_email}</div>}
              {invoice.customer_address && <div style={valueStyle}>{invoice.customer_address}</div>}
            </div>

            {/* Invoice Info */}
            <div style={sectionStyle}>
              <div style={labelStyle}>Invoice Number:</div>
              <div style={valueStyle}>{invoice.invoice_number}</div>

              <div style={labelStyle}>Date:</div>
              <div style={valueStyle}>
                {new Date(invoice.sale_date).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div style={labelStyle}>Payment Status:</div>
              <div style={{ ...valueStyle, color: invoice.payment_status === "paid" ? "#4caf50" : "#f44336", fontWeight: "bold" }}>
                {invoice.payment_status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Product</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Qty</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>{invoice.product_name}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{invoice.quantity} {invoice.unit}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>₦{invoice.unit_price.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#4caf50" }}>
                  ₦{invoice.total_amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginBottom: 20, textAlign: "right" as const }}>
            <div style={{ ...valueStyle, fontSize: 14, fontWeight: "bold" }}>
              Total: ₦{invoice.total_amount.toLocaleString()}
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, marginBottom: 20 }}>
            <div style={labelStyle}>Payment Method:</div>
            <div style={valueStyle}>{invoice.payment_method.toUpperCase()}</div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={sectionStyle}>
              <div style={labelStyle}>Notes:</div>
              <div style={valueStyle}>{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #ddd", paddingTop: 12, marginTop: 20, textAlign: "center" as const, fontSize: 10, color: "#999" }}>
            <div>Generated on {new Date().toLocaleDateString("en-NG")} • NaijaBasket Accounting System</div>
            <div style={{ marginTop: 4 }}>This is a computer-generated invoice and requires no signature.</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, padding: 20, background: "linear-gradient(135deg, #0F2318 0%, #1A3A28 100%)", borderTop: "1px solid #2D5A40" }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)",
              color: "#111",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            🖨️ Print
          </button>
          <button
            onClick={downloadPDF}
            style={{
              flex: 1,
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            📥 Download PDF
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "#1E3A2E",
              color: "#2D6A4F",
              border: "1px solid #2D5A40",
              borderRadius: 8,
              padding: "10px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
