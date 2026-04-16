import React, { useState, useEffect, useCallback } from "react";
import { useAccountingAPI, Sale, SalesSummary, DailyRevenue, Product, Customer } from "../../hooks/useAccountingAPI";
import { useSocketIO, RealTimeSale } from "../../hooks/useSocketIO";
import { KPICards } from "./KPICards";
import { RevenueChart } from "./RevenueChart";
import { FilterBar, FilterState } from "./FilterBar";
import { SalesTable } from "./SalesTable";
import { CustomerPanel } from "./CustomerPanel";
import { InvoiceModal, InvoiceData } from "./InvoiceModal";
import { PDFReportButton } from "./PDFReport";
import { CustomerLeaderboard } from "./CustomerCRM";

export const AccountingDashboard: React.FC<{inventoryData?: any}> = ({inventoryData = {purchases: [], damages: []}}) => {
  // API Hooks
  const {
    loading,
    error,
    fetchSales,
    fetchSalesSummary,
    fetchDailySales,
    fetchCustomers,
    fetchProducts,
    fetchLowStockProducts,
    fetchInvoice,
  } = useAccountingAPI();

  // State
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailyRevenue[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  const [filters, setFilters] = useState<FilterState>({});
  const [loadingData, setLoadingData] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"day" | "week" | "month" | "year" | "all">("all");

  // Real-time Socket.io
  const handleNewSale = useCallback((sale: RealTimeSale) => {
    console.log("Real-time sale:", sale);
    // Refresh data when new sale comes in
    loadData();
  }, []);

  const { isConnected } = useSocketIO(handleNewSale);

  // Load all data
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [salesData, summaryData, dailyData, customersData, productsData, lowStockData] = await Promise.all([
        fetchSales({
          start_date: filters.startDate,
          end_date: filters.endDate,
          product_id: filters.productId,
          payment_status: filters.paymentStatus,
          limit: 100,
        }),
        fetchSalesSummary({
          start_date: filters.startDate,
          end_date: filters.endDate,
          product_id: filters.productId,
          payment_status: filters.paymentStatus,
        }),
        fetchDailySales(30),
        fetchCustomers(filters.customerSearch),
        fetchProducts(),
        fetchLowStockProducts(),
      ]);

      setSales(salesData);
      setSummary(summaryData);
      setDailySales(dailyData);
      setCustomers(customersData);
      setProducts(productsData);
      setLowStockProducts(lowStockData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [filters, fetchSales, fetchSalesSummary, fetchDailySales, fetchCustomers, fetchProducts, fetchLowStockProducts]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Handle filter apply
  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // View invoice
  const handleViewInvoice = async (saleId: number) => {
    try {
      const invoiceData = await fetchInvoice(saleId);
      setSelectedInvoice(invoiceData);
    } catch (err) {
      console.error("Error fetching invoice:", err);
    }
  };

  // Filter sales by time period
  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (timeFilter) {
      case "day":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        return { startDate: new Date(0), endDate };
    }

    return { startDate, endDate };
  };

  const filteredSalesByTime = sales.filter((s) => {
    const { startDate, endDate } = getDateRange();
    const saleDate = new Date(s.sale_date);
    return saleDate >= startDate && saleDate <= endDate;
  });

  // Calculate today's stats
  const today = new Date().toLocaleDateString();
  const todaysSales = sales.filter(
    (s) => new Date(s.sale_date).toLocaleDateString() === today
  );
  const todaysCount = todaysSales.length;
  const pendingCount = sales.filter((s) => s.payment_status === "pending").length;

  // Calculate inventory losses
  const totalDamageLosses = inventoryData.damages.reduce((sum: number, d: any) => {
    const avgPrice = inventoryData.purchases.length > 0 
      ? inventoryData.purchases.reduce((s: number, p: any) => s + p.pricePerCrate, 0) / inventoryData.purchases.length / (inventoryData.purchases[0]?.eggsPerCrate || 30)
      : 0;
    return sum + (d.eggsDamaged * avgPrice);
  }, 0);

  const totalInventoryInvested = inventoryData.purchases.reduce((sum: number, p: any) => sum + p.totalCost, 0);
  const totalInventoryExpenses = inventoryData.purchases.reduce((sum: number, p: any) => sum + (p.transportation + p.otherExpenses), 0);
  const totalSalesRevenue = filteredSalesByTime.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0;
  
  // Calculate profit/loss
  const totalExpenses = totalInventoryInvested + totalDamageLosses;
  const netProfit = totalSalesRevenue - totalExpenses;

  const dashboardStyle = {
    background: "#0A0F0C",
    color: "#f0f0f0",
    minHeight: "100vh",
    padding: 16,
  };

  const containerStyle = {
    maxWidth: 1400,
    margin: "0 auto",
  };

  const headerStyle = {
    marginBottom: 24,
    animation: "fadeIn 0.6s ease",
  };

  const titleStyle = {
    fontSize: "clamp(28px, 6vw, 36px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent" as any,
    margin: 0,
    marginBottom: 6,
  };

  const statusStyle = {
    fontSize: 12,
    color: "#999",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const twoColumnStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: 16,
    marginTop: 24,
  };

  return (
    <div style={dashboardStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>📊 Accounting Dashboard</h1>
          <div style={statusStyle}>
            <span>{isConnected() ? "🟢 Live" : "🔴 Offline"}</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleTimeString("en-NG")}</span>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {(["day", "week", "month", "year", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              style={{
                background: timeFilter === period ? "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)" : "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
                color: timeFilter === period ? "#111" : "#2D6A4F",
                border: timeFilter === period ? "none" : "1px solid #1E3A2E",
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s ease",
                textTransform: "capitalize",
                boxShadow: timeFilter === period ? "0 4px 12px rgba(45, 106, 79, 0.3)" : "none",
              }}
            >
              {period === "all" ? "All Time" : period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Financial Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>💰 TOTAL REVENUE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#4caf50" }}>₦{totalSalesRevenue.toLocaleString()}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>📦 INVENTORY COST</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#3D8B6A" }}>₦{totalInventoryInvested.toLocaleString()}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>⚠️ DAMAGE LOSSES</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f44336" }}>₦{totalDamageLosses.toLocaleString()}</div>
          </div>
          <div style={{ background: netProfit >= 0 ? "linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.05) 100%)" : "linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.05) 100%)", border: `1px solid ${netProfit >= 0 ? "#4caf50" : "#f44336"}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>📈 NET PROFIT/LOSS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: netProfit >= 0 ? "#4caf50" : "#f44336" }}>₦{netProfit.toLocaleString()}</div>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards summary={summary} loading={loadingData} todayCount={todaysCount} pendingCount={pendingCount} />

        {/* Chart */}
        <RevenueChart data={dailySales} loading={loadingData} />

        {/* Filter Bar */}
        <FilterBar
          products={products}
          filters={filters}
          onFilterChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          loading={loadingData}
        />

        {/* Download Report Button */}
        <div style={{ marginBottom: 20 }}>
          <PDFReportButton
            summary={summary}
            sales={sales}
            loading={loadingData}
            filterInfo={Object.values(filters).some((v) => v) ? "Filtered" : "All Time"}
          />
        </div>

        {/* Inventory Report */}
        {inventoryData.purchases && inventoryData.purchases.length > 0 && (
          <div style={{ background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)", border: "1px solid #1E3A2E", borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <h3 style={{ color: "#2D6A4F", marginBottom: 16, fontSize: 14, fontWeight: 700 }}>📦 Inventory Report</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>TOTAL PURCHASES</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D6A4F" }}>{inventoryData.purchases.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>TOTAL CRATES</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D6A4F" }}>{inventoryData.purchases.reduce((sum: number, p: any) => sum + p.cratesPurchased, 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>TOTAL UNITS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2D6A4F" }}>{inventoryData.purchases.reduce((sum: number, p: any) => sum + (p.cratesPurchased * p.eggsPerCrate), 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>DAMAGED RECORDS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f44336" }}>{inventoryData.damages.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>TOTAL DAMAGED</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f44336" }}>{inventoryData.damages.reduce((sum: number, d: any) => sum + d.eggsDamaged, 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#999", marginBottom: 4 }}>SUPPLIER CONTACTS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#4caf50" }}>{new Set(inventoryData.purchases.map((p: any) => p.supplierName)).size}</div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout: Sales Table + CRM Panel */}
        <div style={twoColumnStyle}>
          {/* Main Content */}
          <div>
            {/* Sales Table */}
            <SalesTable sales={sales} loading={loadingData} onViewInvoice={handleViewInvoice} />

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: "rgba(244, 67, 54, 0.15)",
                  border: "1px solid rgba(244, 67, 54, 0.3)",
                  borderRadius: 12,
                  padding: 16,
                  color: "#f44336",
                  fontSize: 12,
                  marginBottom: 20,
                }}
              >
                ❌ Error: {error}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Customer Panel */}
            <CustomerPanel customers={customers} loading={loadingData} onSelectCustomer={() => {}} />
            
            {/* Customer Leaderboard */}
            <CustomerLeaderboard orders={sales} />
          </div>
        </div>

        {/* Invoice Modal */}
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      </div>
    </div>
  );
};
