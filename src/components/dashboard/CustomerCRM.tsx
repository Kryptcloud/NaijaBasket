import React, { useState, useMemo } from "react";

interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  items: any[];
  total: number;
  date: string;
  status: string;
}

interface CustomerLeaderboardProps {
  orders?: Order[];
}

export const CustomerLeaderboard: React.FC<CustomerLeaderboardProps> = ({ orders = [] }) => {
  const customerStats = useMemo(() => {
    const stats: Record<string, { name: string; phone: string; purchases: number; totalSpent: number; lastOrder: string }> = {};

    orders.forEach((order) => {
      if (!stats[order.name]) {
        stats[order.name] = { name: order.name, phone: order.phone, purchases: 0, totalSpent: 0, lastOrder: "" };
      }
      stats[order.name].purchases += 1;
      stats[order.name].totalSpent += order.total;
      stats[order.name].lastOrder = order.date;
    });

    return Object.values(stats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [orders]);

  return (
    <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 12, padding: 20, marginTop: 24 }}>
      <h3 style={{ color: "#2D6A4F", marginBottom: 16, fontSize: 16, fontWeight: 700 }}>🏆 Top Customers</h3>
      {customerStats.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center" }}>No customer data yet</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E3A2E" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#999", fontSize: 12, fontWeight: 700 }}>#</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#999", fontSize: 12, fontWeight: 700 }}>CUSTOMER</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "#999", fontSize: 12, fontWeight: 700 }}>PURCHASES</th>
                <th style={{ textAlign: "right", padding: "12px 8px", color: "#999", fontSize: 12, fontWeight: 700 }}>TOTAL SPENT</th>
              </tr>
            </thead>
            <tbody>
              {customerStats.map((customer, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(58, 46, 32, 0.5)", hoverColor: "rgba(45, 106, 79, 0.05)" }}>
                  <td style={{ padding: "12px 8px", color: "#2D6A4F", fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ color: "#f0f0f0", fontWeight: 600, fontSize: 14 }}>{customer.name}</div>
                    <div style={{ color: "#666", fontSize: 11 }}>{customer.phone}</div>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center", color: "#4caf50", fontWeight: 700 }}>{customer.purchases}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: "#2D6A4F", fontWeight: 700 }}>₦{customer.totalSpent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const CustomerCRM: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"purchases" | "spent">("spent");

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) => o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.phone.includes(searchTerm)
    );
  }, [orders, searchTerm]);

  const customerStats = useMemo(() => {
    const stats: Record<string, { name: string; phone: string; address: string; purchases: number; totalSpent: number; lastOrder: string; email?: string }> = {};

    filteredOrders.forEach((order) => {
      if (!stats[order.phone]) {
        stats[order.phone] = { name: order.name, phone: order.phone, address: order.address, purchases: 0, totalSpent: 0, lastOrder: "" };
      }
      stats[order.phone].purchases += 1;
      stats[order.phone].totalSpent += order.total;
      stats[order.phone].lastOrder = order.date;
    });

    return Object.values(stats).sort((a, b) => {
      if (sortBy === "purchases") return b.purchases - a.purchases;
      return b.totalSpent - a.totalSpent;
    });
  }, [filteredOrders, sortBy]);

  return (
    <div style={{ background: "#0A0F0C", color: "#f0f0f0", minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 800, background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, marginBottom: 8 }}>
            👥 Customer Management
          </h1>
          <p style={{ color: "#999", margin: 0 }}>View and manage customer information and purchase history</p>
        </div>

        {/* Search and Filter */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
              border: "1px solid #1E3A2E",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#f0f0f0",
              fontSize: 14,
              outline: "none",
              transition: "border 0.2s ease",
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "purchases" | "spent")}
            style={{
              background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
              border: "1px solid #1E3A2E",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#f0f0f0",
              fontSize: 14,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="spent">Sort by: Total Spent</option>
            <option value="purchases">Sort by: Purchases</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24 }}>
          {/* Main Customers Table */}
          <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 12, padding: 20, overflow: "auto" }}>
            <h3 style={{ color: "#2D6A4F", marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: 700 }}>📋 All Customers ({customerStats.length})</h3>
            {customerStats.length === 0 ? (
              <p style={{ color: "#999", textAlign: "center", padding: "40px 0" }}>No customers found</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E3A2E" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px", color: "#999", fontSize: 11, fontWeight: 700 }}>NAME</th>
                    <th style={{ textAlign: "left", padding: "12px 8px", color: "#999", fontSize: 11, fontWeight: 700 }}>PHONE</th>
                    <th style={{ textAlign: "center", padding: "12px 8px", color: "#999", fontSize: 11, fontWeight: 700 }}>PURCHASES</th>
                    <th style={{ textAlign: "right", padding: "12px 8px", color: "#999", fontSize: 11, fontWeight: 700 }}>TOTAL SPENT</th>
                    <th style={{ textAlign: "right", padding: "12px 8px", color: "#999", fontSize: 11, fontWeight: 700 }}>LAST ORDER</th>
                  </tr>
                </thead>
                <tbody>
                  {customerStats.map((customer, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(58, 46, 32, 0.5)" }}>
                      <td style={{ padding: "12px 8px", color: "#f0f0f0", fontWeight: 500 }}>{customer.name}</td>
                      <td style={{ padding: "12px 8px", color: "#aaa", fontSize: 13 }}>{customer.phone}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center", color: "#4caf50", fontWeight: 700 }}>{customer.purchases}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", color: "#2D6A4F", fontWeight: 700 }}>₦{customer.totalSpent.toLocaleString()}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", color: "#999", fontSize: 12 }}>{new Date(customer.lastOrder).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sidebar - Top Customers */}
          <div>
            <CustomerLeaderboard orders={orders} />
          </div>
        </div>
      </div>
    </div>
  );
};
