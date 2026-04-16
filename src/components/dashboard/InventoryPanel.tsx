import React, { useState } from "react";
import { Product } from "../../hooks/useAccountingAPI";

interface InventoryPanelProps {
  products: Product[];
  lowStockProducts: Product[];
  loading: boolean;
  onRestock?: (productId: number) => void;
  purchases?: any[];
  damages?: any[];
  onAddPurchase?: (purchase: any) => void;
  onAddDamage?: (damage: any) => void;
}

interface PurchaseRecord {
  id: string;
  date: string;
  timestamp: number;
  supplierName: string;
  supplierPhone: string;
  supplierAddress: string;
  invoiceNumber: string;
  cratesPurchased: number;
  eggsPerCrate: number;
  pricePerCrate: number;
  subtotal: number;
  transportation: number;
  otherExpenses: number;
  damagedEggs: number;
  notes: string;
  totalCost: number;
  paymentStatus: "pending" | "paid" | "partial";
}

interface DamageRecord {
  id: string;
  date: string;
  timestamp: number;
  eggsDamaged: number;
  reason: "handling" | "storage" | "customer" | "expiry" | "quality" | "other";
  notes: string;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  products,
  lowStockProducts,
  loading,
  onRestock,
  purchases = [],
  damages = [],
  onAddPurchase,
  onAddDamage,
}) => {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    invoiceNumber: "",
    cratesPurchased: "",
    eggsPerCrate: "30",
    pricePerCrate: "",
    transportation: "",
    otherExpenses: "",
    damagedEggs: "",
    paymentStatus: "paid" as "pending" | "paid" | "partial",
    notes: "",
  });
  const [damageFormData, setDamageFormData] = useState({
    eggsDamaged: "",
    reason: "handling" as "handling" | "storage" | "customer" | "expiry" | "quality" | "other",
    notes: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPurchase = () => {
    if (!formData.supplierName.trim()) {
      alert("Please enter supplier name");
      return;
    }
    if (!formData.supplierPhone.trim()) {
      alert("Please enter supplier contact");
      return;
    }
    const cratesPurchased = parseFloat(formData.cratesPurchased) || 0;
    const pricePerCrate = parseFloat(formData.pricePerCrate) || 0;
    const transportation = parseFloat(formData.transportation) || 0;
    const otherExpenses = parseFloat(formData.otherExpenses) || 0;
    const damagedEggs = parseFloat(formData.damagedEggs) || 0;

    if (cratesPurchased <= 0) {
      alert("Please enter number of crates purchased");
      return;
    }

    const subtotal = cratesPurchased * pricePerCrate;
    const totalCost = subtotal + transportation + otherExpenses;
    const newRecord: PurchaseRecord = {
      id: `PUR-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      supplierName: formData.supplierName,
      supplierPhone: formData.supplierPhone,
      supplierAddress: formData.supplierAddress,
      invoiceNumber: formData.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
      cratesPurchased,
      eggsPerCrate: parseInt(formData.eggsPerCrate) || 30,
      pricePerCrate,
      subtotal,
      transportation,
      otherExpenses,
      damagedEggs,
      paymentStatus: formData.paymentStatus,
      notes: formData.notes,
      totalCost,
    };

    if (onAddPurchase) {
      onAddPurchase(newRecord);
    }
    setFormData({
      supplierName: "",
      supplierPhone: "",
      supplierAddress: "",
      invoiceNumber: "",
      cratesPurchased: "",
      eggsPerCrate: "30",
      pricePerCrate: "",
      transportation: "",
      otherExpenses: "",
      damagedEggs: "",
      paymentStatus: "paid",
      notes: "",
    });
    setShowPurchaseForm(false);
  };

  const handleDamageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDamageFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDamage = () => {
    const eggsDamaged = parseFloat(damageFormData.eggsDamaged) || 0;

    if (eggsDamaged <= 0) {
      alert("Please enter number of damaged items");
      return;
    }

    const newDamage: DamageRecord = {
      id: `DMG-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      eggsDamaged,
      reason: damageFormData.reason,
      notes: damageFormData.notes,
    };

    if (onAddDamage) {
      onAddDamage(newDamage);
    }
    setDamageFormData({
      eggsDamaged: "",
      reason: "handling",
      notes: "",
    });
    setShowDamageForm(false);
  };

  const panelStyle = {
    background: "linear-gradient(135deg, #0F1A14 0%, #152A1F 100%)",
    border: "1px solid #1E3A2E",
    borderRadius: 12,
    padding: 16,
    animation: "slideUp 0.6s ease",
  };

  return (
    <div style={panelStyle}>
      {/* Purchase & Expense Section */}
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #1E3A2E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 700, color: "#2D6A4F", margin: 0 }}>
            📥 Purchase & Expenses
          </h3>
          <button
            onClick={() => setShowPurchaseForm(!showPurchaseForm)}
            style={{
              background: showPurchaseForm ? "#f44336" : "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {showPurchaseForm ? "Cancel" : "+ Add Purchase"}
          </button>
        </div>

        {/* Financial Summary */}
        {purchases.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(45, 106, 79, 0.15) 0%, rgba(255, 152, 0, 0.05) 100%)",
            border: "1px solid rgba(45, 106, 79, 0.3)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOTAL RECORDS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D6A4F" }}>{purchases.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOTAL INVESTED</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D6A4F" }}>
                ₦{purchases.reduce((sum, p) => sum + p.totalCost, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOTAL CRATES</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D6A4F" }}>
                {purchases.reduce((sum, p) => sum + p.cratesPurchased, 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOTAL UNITS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D6A4F" }}>
                {purchases.reduce((sum, p) => sum + (p.cratesPurchased * p.eggsPerCrate), 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TRANSPORT COSTS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3D8B6A" }}>
                ₦{purchases.reduce((sum, p) => sum + p.transportation, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>DAMAGED EGGS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f44336" }}>
                {purchases.reduce((sum, p) => sum + p.damagedEggs, 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>PAID STATUS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4caf50" }}>
                {purchases.filter(p => p.paymentStatus === "paid").length}/{purchases.length}
              </div>
            </div>
          </div>
        )}

        {showPurchaseForm && (
          <div style={{
            background: "rgba(45, 106, 79, 0.1)",
            border: "1px solid rgba(45, 106, 79, 0.3)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            {/* Supplier Details Section */}
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(45, 106, 79, 0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2D6A4F", marginBottom: 8 }}>👤 Supplier Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Supplier Name *</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    placeholder="e.g., XYZ Farms"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Contact Phone *</label>
                  <input
                    type="tel"
                    name="supplierPhone"
                    value={formData.supplierPhone}
                    onChange={handleInputChange}
                    placeholder="e.g., +234 801 234 5678"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Supplier Address</label>
                  <input
                    type="text"
                    name="supplierAddress"
                    value={formData.supplierAddress}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Farm Road, Lagos"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if blank"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Purchase Details Section */}
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(45, 106, 79, 0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2D6A4F", marginBottom: 8 }}>📦 Purchase Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Crates Purchased *</label>
                  <input
                    type="number"
                    name="cratesPurchased"
                    value={formData.cratesPurchased}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Units per Pack</label>
                  <input
                    type="number"
                    name="eggsPerCrate"
                    value={formData.eggsPerCrate}
                    onChange={handleInputChange}
                    placeholder="e.g., 30"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Price per Crate (₦) *</label>
                  <input
                    type="number"
                    name="pricePerCrate"
                    value={formData.pricePerCrate}
                    onChange={handleInputChange}
                    placeholder="e.g., 1500"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(45, 106, 79, 0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2D6A4F", marginBottom: 8 }}>💰 Expenses & Damage</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Transportation (₦)</label>
                  <input
                    type="number"
                    name="transportation"
                    value={formData.transportation}
                    onChange={handleInputChange}
                    placeholder="e.g., 2000"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Other Expenses (₦)</label>
                  <input
                    type="number"
                    name="otherExpenses"
                    value={formData.otherExpenses}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Damaged Eggs</label>
                  <input
                    type="number"
                    name="damagedEggs"
                    value={formData.damagedEggs}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#0A0F0C",
                      border: "1px solid #1E3A2E",
                      borderRadius: 4,
                      color: "#f0f0f0",
                      fontSize: 11,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="e.g., Quality notes, payment terms, next delivery date"
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#0A0F0C",
                  border: "1px solid #1E3A2E",
                  borderRadius: 4,
                  color: "#f0f0f0",
                  fontSize: 11,
                  boxSizing: "border-box",
                  minHeight: 50,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAddPurchase}
              style={{
                width: "100%",
                background: "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✅ Save Purchase Record
            </button>
          </div>
        )}

        {/* Purchase History */}
        {purchases.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2D6A4F", marginBottom: 12 }}>📜 Purchase History ({purchases.length})</div>
            <div style={{ maxHeight: 600, overflowY: "auto" as const }}>
              {purchases.map((record) => (
                <div
                  key={record.id}
                  style={{
                    background: "linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)",
                    border: "1px solid rgba(76, 175, 80, 0.3)",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 10,
                    fontSize: 10,
                  }}
                >
                  {/* Header: Date, Status, Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(76, 175, 80, 0.2)" }}>
                    <div>
                      <span style={{ color: "#4caf50", fontWeight: 700 }}>📅 {record.date}</span>
                      <span style={{ color: "#aaa", marginLeft: 12 }}>Invoice: {record.invoiceNumber}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#2D6A4F", fontWeight: 700, fontSize: 12 }}>₦{record.totalCost.toLocaleString()}</div>
                      <div style={{ color: record.paymentStatus === "paid" ? "#4caf50" : record.paymentStatus === "partial" ? "#3D8B6A" : "#f44336", fontSize: 9, fontWeight: 700, marginTop: 2 }}>
                        {record.paymentStatus.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div style={{ background: "rgba(76, 175, 80, 0.1)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: "#4caf50", marginBottom: 4 }}>👤 Supplier</div>
                    <div style={{ color: "#ddd", marginBottom: 2 }}>{record.supplierName}</div>
                    <div style={{ color: "#aaa", fontSize: 9 }}>📞 {record.supplierPhone}</div>
                    {record.supplierAddress && (
                      <div style={{ color: "#aaa", fontSize: 9 }}>📍 {record.supplierAddress}</div>
                    )}
                  </div>

                  {/* Purchase Details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ color: "#999", fontSize: 9 }}>CRATES PURCHASED</div>
                      <div style={{ color: "#2D6A4F", fontWeight: 700 }}>
                        {record.cratesPurchased} crates
                      </div>
                      <div style={{ color: "#aaa", fontSize: 9 }}>
                        ({record.cratesPurchased * record.eggsPerCrate} units @ {record.eggsPerCrate}/crate)
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#999", fontSize: 9 }}>UNIT PRICE</div>
                      <div style={{ color: "#2D6A4F", fontWeight: 700 }}>
                        ₦{record.pricePerCrate.toLocaleString()}/crate
                      </div>
                      <div style={{ color: "#aaa", fontSize: 9 }}>
                        Subtotal: ₦{record.subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div style={{ background: "rgba(255, 152, 0, 0.1)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: "#3D8B6A", marginBottom: 4, fontSize: 9 }}>💰 Cost Breakdown</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 9 }}>
                      <div style={{ color: "#aaa" }}>
                        <div>Subtotal (Eggs):</div>
                        <div style={{ color: "#2D6A4F", fontWeight: 700 }}>₦{record.subtotal.toLocaleString()}</div>
                      </div>
                      {record.transportation > 0 && (
                        <div style={{ color: "#aaa" }}>
                          <div>🚚 Transportation:</div>
                          <div style={{ color: "#2D6A4F", fontWeight: 700 }}>₦{record.transportation.toLocaleString()}</div>
                        </div>
                      )}
                      {record.otherExpenses > 0 && (
                        <div style={{ color: "#aaa" }}>
                          <div>📋 Other Expenses:</div>
                          <div style={{ color: "#2D6A4F", fontWeight: 700 }}>₦{record.otherExpenses.toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Damage & Notes */}
                  <div style={{ display: "flex", gap: 12 }}>
                    {record.damagedEggs > 0 && (
                      <div style={{ background: "rgba(244, 67, 54, 0.15)", borderRadius: 6, padding: 6, flex: 1, color: "#f44336", fontWeight: 700, fontSize: 9 }}>
                        ❌ Damaged Items: {record.damagedEggs}
                      </div>
                    )}
                    {record.notes && (
                      <div style={{ background: "rgba(66, 133, 244, 0.15)", borderRadius: 6, padding: 6, flex: 1, color: "#42a5f5", fontSize: 9 }}>
                        📝 {record.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #1E3A2E" }}>
        <h3 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 700, color: "#2D6A4F", margin: "0 0 4px" }}>
          📦 Inventory Status
        </h3>
        <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
          {products.length} products · {lowStockProducts.length} low stock alerts
        </p>
      </div>

      {lowStockProducts.length > 0 && (
        <div style={{ marginBottom: 16, padding: 12, background: "rgba(244, 67, 54, 0.15)", borderRadius: 8, border: "1px solid rgba(244, 67, 54, 0.3)" }}>
          <div style={{ fontSize: 12, color: "#f44336", fontWeight: 700, marginBottom: 8 }}>⚠️ Low Stock Alert</div>
          {lowStockProducts.map((product) => (
            <div key={product.id} style={{ fontSize: 11, marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid rgba(244, 67, 54, 0.2)" }}>
              <div style={{ color: "#f44336", fontWeight: 700 }}>{product.name}</div>
              <div style={{ color: "#999" }}>
                Stock: <strong style={{ color: "#f44336" }}>{product.stock_quantity}</strong> / Threshold:{" "}
                {product.low_stock_threshold}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Damage Tracking Section */}
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #1E3A2E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 700, color: "#f44336", margin: 0 }}>
            ⚠️ Daily Damage Log
          </h3>
          <button
            onClick={() => setShowDamageForm(!showDamageForm)}
            style={{
              background: showDamageForm ? "#f44336" : "#3D8B6A",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {showDamageForm ? "Cancel" : "+ Record Damage"}
          </button>
        </div>

        {/* Damage Summary */}
        {damages.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(244, 67, 54, 0.05) 100%)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOTAL RECORDS</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f44336" }}>{damages.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOTAL DAMAGED</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f44336" }}>
                {damages.reduce((sum, d) => sum + d.eggsDamaged, 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TODAY'S DAMAGE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ff6b6b" }}>
                {damages.filter(d => d.date === new Date().toLocaleDateString()).reduce((sum, d) => sum + d.eggsDamaged, 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#999", marginBottom: 4 }}>TOP REASON</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f44336" }}>
                {damages.length > 0 ? 
                  [...new Map(damages.map(d => [d.reason, damages.filter(x => x.reason === d.reason).length])).entries()]
                    .sort((a, b) => b[1] - a[1])[0][0].toUpperCase() 
                  : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Damage Form */}
        {showDamageForm && (
          <div style={{
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Items Damaged *</label>
                <input
                  type="number"
                  name="eggsDamaged"
                  value={damageFormData.eggsDamaged}
                  onChange={handleDamageInputChange}
                  placeholder="e.g., 12"
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "#0A0F0C",
                    border: "1px solid #1E3A2E",
                    borderRadius: 4,
                    color: "#f0f0f0",
                    fontSize: 11,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Damage Reason *</label>
                <select
                  name="reason"
                  value={damageFormData.reason}
                  onChange={handleDamageInputChange}
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "#0A0F0C",
                    border: "1px solid #1E3A2E",
                    borderRadius: 4,
                    color: "#f0f0f0",
                    fontSize: 11,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="handling">🤲 Handling Error</option>
                  <option value="storage">📦 Storage Issue</option>
                  <option value="customer">👥 Customer Return</option>
                  <option value="expiry">⏰ Expired/Old Stock</option>
                  <option value="quality">⚡ Quality Issue</option>
                  <option value="other">❓ Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 4 }}>Notes</label>
              <textarea
                name="notes"
                value={damageFormData.notes}
                onChange={handleDamageInputChange}
                placeholder="e.g., Crate fell during restocking, cracked eggs at bottom"
                style={{
                  width: "100%",
                  padding: "6px",
                  background: "#0A0F0C",
                  border: "1px solid #1E3A2E",
                  borderRadius: 4,
                  color: "#f0f0f0",
                  fontSize: 11,
                  boxSizing: "border-box",
                  minHeight: 40,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
            <button
              onClick={handleAddDamage}
              style={{
                width: "100%",
                background: "#f44336",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              🔴 Record Damage
            </button>
          </div>
        )}

        {/* Damage History */}
        {damages.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f44336", marginBottom: 10 }}>📋 Damage History</div>
            <div style={{ maxHeight: 400, overflowY: "auto" as const }}>
              {damages.map((damage) => {
                const reasonEmojis: Record<string, string> = {
                  handling: "🤲",
                  storage: "📦",
                  customer: "👥",
                  expiry: "⏰",
                  quality: "⚡",
                  other: "❓",
                };
                return (
                  <div
                    key={damage.id}
                    style={{
                      background: "rgba(244, 67, 54, 0.1)",
                      border: "1px solid rgba(244, 67, 54, 0.3)",
                      borderRadius: 6,
                      padding: 10,
                      marginBottom: 8,
                      fontSize: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid rgba(244, 67, 54, 0.2)" }}>
                      <div>
                        <div style={{ color: "#f44336", fontWeight: 700 }}>{damage.date}</div>
                        <div style={{ color: "#aaa", fontSize: 9 }}>Time: {new Date(damage.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#f44336" }}>×{damage.eggsDamaged}</div>
                        <div style={{ color: "#999", fontSize: 9 }}>items damaged</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{reasonEmojis[damage.reason]}</span>
                      <span style={{ color: "#2D6A4F", fontWeight: 700 }}>{damage.reason.toUpperCase()}</span>
                    </div>
                    {damage.notes && (
                      <div style={{ background: "rgba(66, 133, 244, 0.15)", borderRadius: 4, padding: 6, color: "#42a5f5", fontSize: 9, fontStyle: "italic" }}>
                        📝 {damage.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* All Products */}
      <div style={{ maxHeight: 500, overflowY: "auto" as const }}>
        {loading ? (
          <div style={{ color: "#666", textAlign: "center", padding: "16px 0" }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", padding: "16px 0", fontSize: 12 }}>
            No products available
          </div>
        ) : (
          products.map((product) => {
            const stockPercent = (product.stock_quantity / Math.max(product.low_stock_threshold * 2, 20)) * 100;
            const isLow = product.stock_quantity <= product.low_stock_threshold;

            return (
              <div
                key={product.id}
                style={{
                  background: isLow ? "rgba(244, 67, 54, 0.1)" : "rgba(45, 106, 79, 0.05)",
                  border: `1px solid ${isLow ? "rgba(244, 67, 54, 0.3)" : "#1E3A2E"}`,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 12, marginBottom: 2 }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#999" }}>
                      {product.unit} · ₦{product.unit_price.toLocaleString()}/unit
                    </div>
                  </div>
                  {isLow && (
                    <div
                      style={{
                        background: "#f44336",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      LOW
                    </div>
                  )}
                </div>

                {/* Stock Bar */}
                <div style={{ background: "#0A0F0C", borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
                  <div
                    style={{
                      background: isLow ? "#f44336" : "linear-gradient(135deg, #2D6A4F 0%, #3D8B6A 100%)",
                      height: 8,
                      width: `${Math.min(stockPercent, 100)}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                  <span style={{ color: "#aaa" }}>
                    Stock: <strong style={{ color: isLow ? "#f44336" : "#2D6A4F" }}>{product.stock_quantity}</strong>
                  </span>
                  {onRestock && (
                    <button
                      onClick={() => onRestock(product.id)}
                      style={{
                        background: "#4caf50",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 10,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Restock
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
