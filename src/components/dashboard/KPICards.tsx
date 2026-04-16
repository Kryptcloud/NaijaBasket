import React from "react";
import { SalesSummary } from "../../hooks/useAccountingAPI";

interface KPICardsProps {
  summary: SalesSummary | null;
  loading: boolean;
  todayCount: number;
  pendingCount: number;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary, loading, todayCount, pendingCount }) => {
  const cardStyle = {
    background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
    border: "1px solid #1E3A2E",
    borderRadius: 12,
    padding: 20,
    textAlign: "center" as const,
    animation: "slideUp 0.6s ease",
  };

  const labelStyle = {
    fontSize: "clamp(11px, 1.8vw, 13px)",
    color: "#999",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  };

  const numStyle = {
    fontSize: "clamp(24px, 5vw, 32px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent" as any,
  };

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...cardStyle, opacity: 0.5 }}>
            <div style={labelStyle}>Loading...</div>
            <div style={numStyle}>--</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
      {/* Total Revenue Today */}
      <div style={cardStyle}>
        <div style={labelStyle}>💰 Revenue Today</div>
        <div style={numStyle}>₦{(summary?.total_revenue || 0).toLocaleString()}</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
          Avg: ₦{Math.round(summary?.average_order_value || 0).toLocaleString()}
        </div>
      </div>

      {/* Transactions Today */}
      <div style={cardStyle}>
        <div style={labelStyle}>📊 Transactions</div>
        <div style={numStyle}>{todayCount}</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Today's orders</div>
      </div>

      {/* Units Sold */}
      <div style={cardStyle}>
        <div style={labelStyle}>📦 Units Sold</div>
        <div style={numStyle}>{summary?.total_units_sold || 0}</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Crates/units</div>
      </div>

      {/* Pending Payments */}
      <div style={cardStyle}>
        <div style={labelStyle}>⏳ Pending Payments</div>
        <div style={{ ...numStyle, color: "#3D8B6A" }}>{pendingCount}</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>Awaiting confirmation</div>
      </div>
    </div>
  );
};
