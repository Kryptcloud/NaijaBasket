import React, { useState } from "react";
import { Sale } from "../../hooks/useAccountingAPI";

interface SalesTableProps {
  sales: Sale[];
  loading: boolean;
  onViewInvoice: (saleId: number) => void;
  onDelete?: (saleId: number) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({ sales, loading, onViewInvoice, onDelete }) => {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<keyof Sale>("sale_date");
  const [sortDesc, setSortDesc] = useState(true);

  const itemsPerPage = 15;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return { background: "rgba(76, 175, 80, 0.2)", color: "#4caf50" };
      case "pending":
        return { background: "rgba(255, 152, 0, 0.2)", color: "#3D8B6A" };
      case "overdue":
        return { background: "rgba(244, 67, 54, 0.2)", color: "#f44336" };
      default:
        return { background: "rgba(45, 106, 79, 0.2)", color: "#2D6A4F" };
    }
  };

  const sortedSales = [...sales].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDesc ? bVal - aVal : aVal - bVal;
    }
    
    const aStr = String(aVal || "").toLowerCase();
    const bStr = String(bVal || "").toLowerCase();
    return sortDesc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
  });

  const paginatedSales = sortedSales.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: 20,
    animation: "slideUp 0.6s ease",
  };

  const headerCellStyle = {
    background: "linear-gradient(135deg, #0F2318 0%, #1A3A28 100%)",
    border: "1px solid #2D5A40",
    padding: "12px",
    textAlign: "left" as const,
    fontWeight: 700,
    color: "#2D6A4F",
    fontSize: "clamp(11px, 2vw, 13px)",
    cursor: "pointer" as const,
    userSelect: "none" as const,
  };

  const bodyCellStyle = {
    background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
    border: "1px solid #1E3A2E",
    padding: "10px",
    fontSize: "clamp(11px, 2vw, 13px)",
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 700, color: "#2D6A4F", margin: "0 0 4px" }}>
          📋 Sales History
        </h3>
        <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
          Showing {paginatedSales.length} of {sortedSales.length} sales
        </p>
      </div>

      {loading ? (
        <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 12, padding: 24, textAlign: "center" }}>
          <div style={{ color: "#666" }}>Loading sales data...</div>
        </div>
      ) : sortedSales.length === 0 ? (
        <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 12, padding: 24, textAlign: "center" }}>
          <div style={{ color: "#666" }}>No sales found</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #1E3A2E" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th
                    style={headerCellStyle}
                    onClick={() => {
                      setSortBy("sale_date");
                      setSortDesc(sortBy === "sale_date" ? !sortDesc : true);
                    }}
                  >
                    Date {sortBy === "sale_date" && (sortDesc ? "▼" : "▲")}
                  </th>
                  <th
                    style={headerCellStyle}
                    onClick={() => {
                      setSortBy("customer_name");
                      setSortDesc(sortBy === "customer_name" ? !sortDesc : true);
                    }}
                  >
                    Customer {sortBy === "customer_name" && (sortDesc ? "▼" : "▲")}
                  </th>
                  <th style={headerCellStyle}>Product</th>
                  <th
                    style={headerCellStyle}
                    onClick={() => {
                      setSortBy("quantity");
                      setSortDesc(sortBy === "quantity" ? !sortDesc : true);
                    }}
                  >
                    Qty {sortBy === "quantity" && (sortDesc ? "▼" : "▲")}
                  </th>
                  <th style={headerCellStyle}>Unit Price</th>
                  <th
                    style={headerCellStyle}
                    onClick={() => {
                      setSortBy("total_amount");
                      setSortDesc(sortBy === "total_amount" ? !sortDesc : true);
                    }}
                  >
                    Total {sortBy === "total_amount" && (sortDesc ? "▼" : "▲")}
                  </th>
                  <th style={headerCellStyle}>Method</th>
                  <th
                    style={headerCellStyle}
                    onClick={() => {
                      setSortBy("payment_status");
                      setSortDesc(sortBy === "payment_status" ? !sortDesc : true);
                    }}
                  >
                    Status {sortBy === "payment_status" && (sortDesc ? "▼" : "▲")}
                  </th>
                  <th style={headerCellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} style={{ transition: "background 0.2s ease" }}>
                    <td style={bodyCellStyle}>
                      {new Date(sale.sale_date).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={bodyCellStyle}>
                      <strong style={{ color: "#2D6A4F" }}>{sale.customer_name || "N/A"}</strong>
                      {sale.customer_phone && <div style={{ fontSize: 10, color: "#666" }}>{sale.customer_phone}</div>}
                    </td>
                    <td style={bodyCellStyle}>{sale.product_name}</td>
                    <td style={bodyCellStyle}>{sale.quantity}</td>
                    <td style={bodyCellStyle}>₦{sale.unit_price.toLocaleString()}</td>
                    <td style={{ ...bodyCellStyle, fontWeight: 700, color: "#4caf50" }}>
                      ₦{sale.total_amount.toLocaleString()}
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={{ fontSize: 12 }}>
                        {sale.payment_method === "cash" ? "💵" : sale.payment_method === "transfer" ? "🏦" : sale.payment_method === "credit" ? "💳" : "₿"}
                      </span>
                      {sale.payment_method}
                    </td>
                    <td style={bodyCellStyle}>
                      <span
                        style={{
                          ...getStatusColor(sale.payment_status),
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {sale.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => onViewInvoice(sale.id)}
                          style={{
                            background: "#4caf50",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: 11,
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          Invoice
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(sale.id)}
                            style={{
                              background: "#f44336",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "4px 8px",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#999" }}>
              Page {page + 1} of {totalPages || 1}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  background: page === 0 ? "#1E3A2E" : "#2D6A4F",
                  color: page === 0 ? "#666" : "#111",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontWeight: 700,
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  fontSize: 12,
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  background: page >= totalPages - 1 ? "#1E3A2E" : "#2D6A4F",
                  color: page >= totalPages - 1 ? "#666" : "#111",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontWeight: 700,
                  cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                  fontSize: 12,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
