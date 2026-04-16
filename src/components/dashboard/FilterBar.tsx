import React, { useState } from "react";
import { Product } from "../../hooks/useAccountingAPI";

export interface FilterState {
  startDate?: string;
  endDate?: string;
  productId?: number;
  paymentStatus?: string;
  customerSearch?: string;
}

interface FilterBarProps {
  products: Product[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
  loading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  products,
  filters,
  onFilterChange,
  onApply,
  onClear,
  loading,
}) => {
  const containerStyle = {
    background: "linear-gradient(135deg, #0F2318 0%, #1A3A28 100%)",
    border: "1px solid #2D5A40",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  };

  const inputStyle = {
    background: "#0F1A14",
    border: "1px solid #1E3A2E",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f0f0f0",
    fontSize: 13,
    boxSizing: "border-box" as const,
  };

  const buttonStyle = {
    background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)",
    color: "#111",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.3s ease",
    minHeight: 40,
  };

  const secondaryButtonStyle = {
    background: "#1E3A2E",
    color: "#2D6A4F",
    border: "1px solid #2D5A40",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.3s ease",
    minHeight: 40,
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#2D6A4F", fontWeight: 700, textTransform: "uppercase" }}>
          🔍 Filter Sales
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 12 }}>
        {/* Date From */}
        <div>
          <label style={{ fontSize: 11, color: "#999", display: "block", marginBottom: 5 }}>Date From</label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            style={inputStyle as any}
          />
        </div>

        {/* Date To */}
        <div>
          <label style={{ fontSize: 11, color: "#999", display: "block", marginBottom: 5 }}>Date To</label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            style={inputStyle as any}
          />
        </div>

        {/* Product */}
        <div>
          <label style={{ fontSize: 11, color: "#999", display: "block", marginBottom: 5 }}>Product</label>
          <select
            value={filters.productId || ""}
            onChange={(e) => onFilterChange({ ...filters, productId: e.target.value ? parseInt(e.target.value) : undefined })}
            style={inputStyle as any}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <label style={{ fontSize: 11, color: "#999", display: "block", marginBottom: 5 }}>Payment Status</label>
          <select
            value={filters.paymentStatus || ""}
            onChange={(e) => onFilterChange({ ...filters, paymentStatus: e.target.value || undefined })}
            style={inputStyle as any}
          >
            <option value="">All Status</option>
            <option value="paid">✅ Paid</option>
            <option value="pending">⏳ Pending</option>
            <option value="overdue">❌ Overdue</option>
          </select>
        </div>

        {/* Customer Search */}
        <div>
          <label style={{ fontSize: 11, color: "#999", display: "block", marginBottom: 5 }}>Customer</label>
          <input
            type="text"
            placeholder="Name, phone, email..."
            value={filters.customerSearch || ""}
            onChange={(e) => onFilterChange({ ...filters, customerSearch: e.target.value })}
            style={inputStyle as any}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onApply}
          disabled={loading}
          style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        <button
          onClick={onClear}
          disabled={loading}
          style={{ ...secondaryButtonStyle, opacity: loading ? 0.6 : 1 }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
