import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DailyRevenue } from "../../hooks/useAccountingAPI";

interface RevenueChartProps {
  data: DailyRevenue[];
  loading: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  const chartContainerStyle = {
    background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
    border: "1px solid #1E3A2E",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    animation: "slideUp 0.6s ease",
  };

  if (loading) {
    return (
      <div style={{ ...chartContainerStyle, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#666" }}>Loading chart data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ ...chartContainerStyle, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#666" }}>No sales data available</div>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    revenue: item.revenue,
    transactions: item.transactions,
    units: item.units,
  }));

  return (
    <div style={chartContainerStyle}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 700, color: "#2D6A4F", margin: "0 0 4px" }}>
          📈 30-Day Revenue Trend
        </h3>
        <p style={{ fontSize: 12, color: "#999", margin: 0 }}>Daily revenue over the last month</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A2E" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#aaa" }}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#aaa" }}
            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#0A0F0C",
              border: "1px solid #1E3A2E",
              borderRadius: 8,
              color: "#f0f0f0",
            }}
            labelStyle={{ color: "#2D6A4F" }}
            formatter={(value: any) => {
              if (typeof value === "number") return [`₦${value.toLocaleString()}`, "Revenue"];
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2D6A4F"
            dot={{ fill: "#3D8B6A", r: 4 }}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 12 }}>
        <div>
          <div style={{ color: "#999" }}>Avg Daily Revenue</div>
          <div style={{ color: "#2D6A4F", fontWeight: 700, marginTop: 2 }}>
            ₦{Math.round(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ color: "#999" }}>Peak Day</div>
          <div style={{ color: "#2D6A4F", fontWeight: 700, marginTop: 2 }}>
            ₦{Math.max(...chartData.map((d) => d.revenue)).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
