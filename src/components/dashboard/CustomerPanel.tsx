import React, { useState } from "react";
import { Customer } from "../../hooks/useAccountingAPI";

interface CustomerPanelProps {
  customers: Customer[];
  loading: boolean;
  onSelectCustomer?: (customer: Customer) => void;
  onAddCustomer?: () => void;
}

export const CustomerPanel: React.FC<CustomerPanelProps> = ({
  customers,
  loading,
  onSelectCustomer,
  onAddCustomer,
}) => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = customers.find((c) => c.id === selectedId);

  const panelStyle = {
    background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
    border: "1px solid #1E3A2E",
    borderRadius: 12,
    padding: 16,
    animation: "slideUp 0.6s ease",
  };

  const inputStyle = {
    width: "100%",
    background: "#0A0F0C",
    border: "1px solid #1E3A2E",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#f0f0f0",
    fontSize: 12,
    boxSizing: "border-box" as const,
    marginBottom: 10,
  };

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 700, color: "#2D6A4F", margin: "0 0 4px" }}>
          👥 Customer CRM
        </h3>
        <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
          {customers.length} customers · {customers.length > 0 ? customers.reduce((sum, c) => sum + c.purchase_count, 0) : 0} total purchases
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, phone, email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle as any}
      />

      {/* Add Customer Button */}
      {onAddCustomer && (
        <button
          onClick={onAddCustomer}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)",
            color: "#111",
            border: "none",
            borderRadius: 8,
            padding: "8px",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 12,
            transition: "all 0.3s ease",
          }}
        >
          + New Customer
        </button>
      )}

      {/* Customer List */}
      <div style={{ maxHeight: 400, overflowY: "auto" as const }}>
        {loading ? (
          <div style={{ color: "#666", textAlign: "center", padding: "16px 0" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", padding: "16px 0", fontSize: 12 }}>
            {search ? "No customers found" : "No customers yet"}
          </div>
        ) : (
          filtered.map((customer) => (
            <div
              key={customer.id}
              onClick={() => {
                setSelectedId(customer.id);
                onSelectCustomer?.(customer);
              }}
              style={{
                background: selectedId === customer.id ? "rgba(45, 106, 79, 0.1)" : "rgba(45, 106, 79, 0.05)",
                border: `1px solid ${selectedId === customer.id ? "#2D6A4F" : "#1E3A2E"}`,
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 12, marginBottom: 3 }}>
                {customer.name}
              </div>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
                {customer.phone && <div>📱 {customer.phone}</div>}
                {customer.email && <div>📧 {customer.email}</div>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#aaa" }}>
                  Orders: <strong style={{ color: "#2D6A4F" }}>{customer.purchase_count}</strong>
                </span>
                <span style={{ color: "#aaa" }}>
                  Spent: <strong style={{ color: "#4caf50" }}>₦{customer.total_spent.toLocaleString()}</strong>
                </span>
              </div>
              {customer.last_purchase && (
                <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
                  Last: {new Date(customer.last_purchase).toLocaleDateString("en-NG")}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected Customer Details */}
      {selected && (
        <div style={{ marginTop: 16, padding: 12, background: "rgba(45, 106, 79, 0.1)", borderRadius: 8, border: "1px solid rgba(45, 106, 79, 0.2)" }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>Selected Customer</div>
          <div style={{ fontSize: 11 }}>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: "#2D6A4F" }}>Name:</strong> {selected.name}
            </div>
            {selected.phone && (
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "#2D6A4F" }}>Phone:</strong> {selected.phone}
              </div>
            )}
            {selected.email && (
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "#2D6A4F" }}>Email:</strong> {selected.email}
              </div>
            )}
            {selected.address && (
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "#2D6A4F" }}>Address:</strong> {selected.address}
              </div>
            )}
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: "#2D6A4F" }}>Type:</strong> {selected.customer_type}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1E3A2E" }}>
              <div style={{ marginBottom: 4 }}>
                <strong style={{ color: "#4caf50" }}>Total Spent:</strong> ₦{selected.total_spent.toLocaleString()}
              </div>
              <div>
                <strong style={{ color: "#4caf50" }}>Purchases:</strong> {selected.purchase_count}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
