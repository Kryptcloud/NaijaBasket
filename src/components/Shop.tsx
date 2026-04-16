import { useState } from "react";

interface ProductVariant {
  id: string;
  size: string;
  unit: string;
  price: number;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  desc: string;
  img: string;
  variants: ProductVariant[];
  inStock: boolean;
  brands?: string[];
}

interface CartItem {
  productId: number;
  variantId: string;
  quantity: number;
  packageLabel?: string;
  brand?: string;
}

interface PackageItem {
  productId: number;
  variantId: string;
  quantity: number;
  required: boolean;
}

interface FoodPackage {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: "soup" | "stew" | "home" | "seasonal";
  items: PackageItem[];
  servings: string;
  discount: number;
  comingSoon?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface FlashDeal {
  productId: number;
  variantId: string;
  discountPercent: number;
  expiresAt: number;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
}

interface ShopProps {
  products: Product[];
  categories: Category[];
  packages: FoodPackage[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  onAddToCart: (productId: number, variantId: string, brand?: string) => void;
  onAddPackage: (pkg: FoodPackage) => void;
  onEditPackage: (pkg: FoodPackage) => void;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  calcPackagePrice: (pkg: FoodPackage) => { original: number; discounted: number; savings: number };
  isPackageAvailable: (pkg: FoodPackage) => { available: boolean; unavailableItems: string[] };
  showToast: (msg: string, type: "success" | "info" | "error") => void;
  flashDeal: FlashDeal;
  dealCountdown: string;
  getProductRating: (productId: number) => { avg: number; count: number };
  onReview: (productId: number) => void;
  currentUser: UserAccount | null;
}

export function Shop({
  products, categories, packages, selectedCategory, onCategoryChange,
  cart, cartCount, cartTotal, onAddToCart, onAddPackage, onEditPackage,
  onNavigate, darkMode, calcPackagePrice, isPackageAvailable, showToast,
  flashDeal, dealCountdown, getProductRating, onReview, currentUser,
}: ShopProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});
  const [selectedBrands, setSelectedBrands] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  const V = {
    bg: "var(--bg-primary)", bgCard: "var(--bg-card)", bgSecondary: "var(--bg-secondary)",
    text: "var(--text-primary)", textMuted: "var(--text-muted)", textSecondary: "var(--text-secondary)",
    border: "var(--border-primary)", borderSubtle: "var(--border-subtle)",
    primary: "var(--color-primary)", primaryHover: "var(--color-primary-hover)",
    secondary: "var(--color-secondary)", accent: "var(--color-accent)",
    success: "var(--color-success)", danger: "var(--color-danger)", warning: "var(--color-warning)",
  };

  const isPackageCategory = selectedCategory === "soup-packs" || selectedCategory === "stew-packs" || selectedCategory === "home-packs";

  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    if (selectedCategory === "all") return true;
    if (isPackageCategory) return false;
    return p.category === selectedCategory;
  });

  const filteredPackages = packages.filter(pkg => {
    if (selectedCategory === "soup-packs") return pkg.type === "soup";
    if (selectedCategory === "stew-packs") return pkg.type === "stew";
    if (selectedCategory === "home-packs") return pkg.type === "home" || pkg.type === "seasonal";
    return false;
  });

  function getProduct(id: number) { return products.find(p => p.id === id); }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 100px" }}>
      {/* ===== HERO ===== */}
      <div style={{
        background: "var(--gradient-hero, linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%))",
        borderRadius: 20, padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 32px)", margin: "20px 0 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="nb-hero-badges" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" as const }}>
            <span className="nb-hero-badge" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>✓ Verified sellers</span>
            <span className="nb-hero-badge" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#fff" }}>📦 Next-day delivery</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>Fresh Foodstuffs,<br />Delivered to Your Door</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, margin: "0 0 20px", maxWidth: 500, lineHeight: 1.5 }}>From the markets of Aba to your kitchen — rice, beans, garri, oils, proteins, soups & more. Save with our <strong>Soup Packs, Stew Packs & Home Packages</strong>.</p>
          <div className="nb-hero-buttons" style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            <button onClick={() => onCategoryChange("soup-packs")} style={{ background: "rgba(255,255,255,0.95)", color: "#2D6A4F", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>🍲 Soup Packs</button>
            <button onClick={() => onCategoryChange("stew-packs")} style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>🫕 Stew Packs</button>
            <button onClick={() => onCategoryChange("home-packs")} style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>🏠 Home Packs</button>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: -20, right: -10, fontSize: 120, opacity: 0.15 }}>🧺</div>
      </div>

      {/* ===== SOCIAL PROOF ===== */}
      <div className="nb-social-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { icon: "🛡️", label: "2K+", sub: "Verified Sellers" },
          { icon: "⭐", label: "4.8/5", sub: "Customer Rating" },
          { icon: "🚛", label: "24hrs", sub: "Within Aba" },
          { icon: "💰", label: "Up to 5%", sub: "Pack Savings" },
        ].map((s, i) => (
          <div key={i} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: V.primary, margin: "2px 0" }}>{s.label}</div>
            <div style={{ fontSize: 11, color: V.textMuted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ===== FLASH DEAL OF THE DAY ===== */}
      {(() => {
        const fp = products.find(p => p.id === flashDeal.productId);
        const fv = fp?.variants.find(v => v.id === flashDeal.variantId);
        if (!fp || !fv || dealCountdown === "EXPIRED") return null;
        const dealPrice = Math.round(fv.price * (1 - flashDeal.discountPercent / 100));
        return (
          <div style={{
            background: "linear-gradient(135deg, #C75B12 0%, #E07020 50%, #F09030 100%)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16,
          }}>
            <div style={{ position: "absolute", top: -10, right: -10, fontSize: 80, opacity: 0.15 }}>🔥</div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>⚡ DEAL OF THE DAY</span>
                <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#fff" }}>⏰ {dealCountdown}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 42 }}>{fp.img}</span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>{fp.name}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>{fv.size} ({fv.unit})</p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "line-through" }}>₦{fv.price.toLocaleString()}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>₦{dealPrice.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#FFE066", fontWeight: 700 }}>Save {flashDeal.discountPercent}%</div>
              </div>
              <button onClick={() => onAddToCart(fp.id, fv.id)} style={{ background: "rgba(255,255,255,0.95)", color: "#C75B12", border: "none", borderRadius: 12, padding: "14px 20px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>🧺 Grab Deal</button>
            </div>
          </div>
        );
      })()}

      {/* ===== SEARCH ===== */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text" placeholder="Search products... (e.g. rice, egusi, palm oil)"
          value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (e.target.value) onCategoryChange("all"); }}
          style={{ width: "100%", background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 12, padding: "14px 14px 14px 40px", fontSize: 15, color: V.text, outline: "none" }}
        />
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
        {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: V.textMuted, fontSize: 16 }}>✕</button>}
      </div>

      {/* ===== CATEGORY TABS ===== */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 20 }}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => { onCategoryChange(cat.id); setSearchQuery(""); }}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "none", whiteSpace: "nowrap",
              background: selectedCategory === cat.id ? "var(--gradient-primary)" : V.bgCard,
              color: selectedCategory === cat.id ? "#fff" : V.textSecondary,
              fontWeight: 600, fontSize: 13, cursor: "pointer",
              boxShadow: selectedCategory === cat.id ? "0 2px 10px rgba(45,106,79,0.25)" : "none",
            }}>
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* ===== PACKAGE CARDS ===== */}
      {isPackageCategory && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: V.primary, margin: "0 0 4px" }}>
              {selectedCategory === "soup-packs" ? "🍲 Soup Packs" : selectedCategory === "stew-packs" ? "🫕 Stew Packs" : "🏠 Home Packages"}
            </h2>
            <p style={{ fontSize: 13, color: V.textMuted, margin: 0 }}>
              {selectedCategory === "soup-packs" ? "Ready-to-cook soup ingredient bundles — save 5% vs buying individually" :
               selectedCategory === "stew-packs" ? "Complete stew & one-pot meal kits — save 5%" :
               "Full home food stock for 2 weeks to 1 month — save 3%"}
            </p>
          </div>

          <div className="nb-pkg-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredPackages.map(pkg => {
              const pricing = calcPackagePrice(pkg);
              const availability = isPackageAvailable(pkg);
              const isExpanded = expandedPkg === pkg.id;

              return (
                <div key={pkg.id} className="nb-card" style={{
                  background: V.bgCard, border: `1px solid ${pkg.comingSoon ? V.borderSubtle : V.border}`,
                  borderRadius: 16, overflow: "hidden", transition: "all 0.2s",
                  opacity: pkg.comingSoon ? 0.65 : 1,
                }}>
                  {/* Header */}
                  <div style={{ padding: "18px 18px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 32 }}>{pkg.icon}</span>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, margin: 0 }}>{pkg.name}</h3>
                          <p style={{ fontSize: 12, color: V.textMuted, margin: "2px 0 0" }}>{pkg.servings}</p>
                        </div>
                      </div>
                      {pkg.comingSoon ? (
                        <span style={{ background: "var(--color-warning-bg)", color: V.warning, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>Coming Soon</span>
                      ) : !availability.available ? (
                        <span style={{ background: "var(--color-danger-bg)", color: V.danger, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>Unavailable</span>
                      ) : (
                        <span style={{ background: "var(--color-success-bg)", color: V.success, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>-{pkg.discount}%</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: V.textSecondary, margin: "0 0 12px", lineHeight: 1.4 }}>{pkg.desc}</p>
                  </div>

                  {/* Pricing */}
                  {!pkg.comingSoon && (
                    <div style={{ padding: "0 18px 12px", display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: V.primary }}>₦{pricing.discounted.toLocaleString()}</span>
                      <span style={{ fontSize: 13, color: V.textMuted, textDecoration: "line-through" }}>₦{pricing.original.toLocaleString()}</span>
                      {pricing.savings > 0 && <span style={{ background: "var(--color-success-bg)", color: V.success, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Save ₦{pricing.savings.toLocaleString()}</span>}
                    </div>
                  )}

                  {/* What's Inside - expandable */}
                  {!pkg.comingSoon && (
                    <>
                      <button onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)} style={{ width: "100%", background: V.bgSecondary, border: "none", borderTop: `1px solid ${V.borderSubtle}`, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: V.textSecondary, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>📋 What's Inside ({pkg.items.length} items)</span>
                        <span style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: "8px 18px 12px", background: V.bgSecondary }}>
                          {pkg.items.map((item, idx) => {
                            const p = getProduct(item.productId);
                            if (!p) return null;
                            const v = p.variants.find(vr => vr.id === item.variantId);
                            if (!v) return null;
                            return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 12, borderBottom: idx < pkg.items.length - 1 ? `1px solid ${V.borderSubtle}` : "none" }}>
                                <span style={{ color: V.textSecondary }}>{p.img} {p.name} {item.quantity > 1 ? `×${item.quantity}` : ""}<span style={{ color: V.textMuted, marginLeft: 4 }}>({v.size})</span>{item.required ? "" : <span style={{ fontSize: 10, color: V.textMuted }}> (optional)</span>}</span>
                                <span style={{ fontWeight: 600, color: V.primary }}>₦{(v.price * item.quantity).toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Action buttons */}
                  {!pkg.comingSoon && (
                    <div style={{ padding: "12px 18px 18px", display: "flex", gap: 8 }}>
                      <button onClick={() => onEditPackage(pkg)} disabled={!availability.available} style={{ flex: 1, background: V.bgCard, color: V.primary, border: `1px solid ${V.primary}`, borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 13, cursor: availability.available ? "pointer" : "not-allowed", opacity: availability.available ? 1 : 0.5 }}>✏️ Customize</button>
                      <button onClick={() => onAddPackage(pkg)} disabled={!availability.available} style={{ flex: 1, background: availability.available ? "var(--gradient-primary)" : V.border, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: availability.available ? "pointer" : "not-allowed", boxShadow: availability.available ? "0 2px 10px rgba(45,106,79,0.25)" : "none" }}>🧺 Add Pack</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== PRODUCT GRID ===== */}
      {!isPackageCategory && (
        <>
          {searchQuery && <p style={{ color: V.textMuted, fontSize: 13, marginBottom: 12 }}>{filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "{searchQuery}"</p>}

          <div className="nb-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {filteredProducts.map(p => {
              const selVariant = selectedVariants[p.id] || p.variants[0]?.id;
              const variant = p.variants.find(v => v.id === selVariant) || p.variants[0];
              if (!variant) return null;
              const inCart = cart.find(c => c.productId === p.id && c.variantId === variant.id);

              return (
                <div key={p.id} className="nb-card" style={{
                  background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14,
                  padding: 18, transition: "all 0.2s", display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 38, lineHeight: 1 }}>{p.img}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: variant.stock > 10 ? "var(--color-success-bg)" : variant.stock > 0 ? "var(--color-warning-bg)" : "var(--color-danger-bg)", color: variant.stock > 10 ? V.success : variant.stock > 0 ? V.warning : V.danger }}>
                      {variant.stock > 10 ? "In Stock" : variant.stock > 0 ? `Only ${variant.stock}` : "Out of Stock"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, margin: "0 0 3px" }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: V.textMuted, margin: "0 0 6px", lineHeight: 1.4 }}>{p.desc}</p>

                  {/* Star Rating */}
                  {(() => {
                    const { avg, count } = getProductRating(p.id);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <div style={{ display: "flex", gap: 1 }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ fontSize: 13, color: star <= Math.round(avg) ? "#F5A623" : V.border, cursor: currentUser ? "pointer" : "default" }}
                              onClick={() => currentUser && onReview(p.id)}>★</span>
                          ))}
                        </div>
                        {count > 0 ? (
                          <span style={{ fontSize: 11, color: V.textMuted }}>{avg} ({count})</span>
                        ) : (
                          <button onClick={() => currentUser && onReview(p.id)} style={{ background: "none", border: "none", fontSize: 11, color: V.primary, cursor: "pointer", padding: 0 }}>Rate this</button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Brand dropdown */}
                  {p.brands && p.brands.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <select
                        value={selectedBrands[p.id] || p.brands[0]}
                        onChange={e => setSelectedBrands(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${V.borderSubtle}`, background: V.bgSecondary, color: V.text, fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none" }}
                      >
                        {p.brands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Variant chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {p.variants.map(v => (
                      <button key={v.id} onClick={() => setSelectedVariants(prev => ({ ...prev, [p.id]: v.id }))}
                        style={{
                          padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                          background: selVariant === v.id ? "var(--bg-accent-muted)" : V.bgSecondary,
                          border: selVariant === v.id ? `1.5px solid ${V.primary}` : `1px solid ${V.borderSubtle}`,
                          color: selVariant === v.id ? V.primary : V.textMuted,
                        }}>
                        {v.size}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: V.primary }}>₦{variant.price.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: V.textMuted }}>{variant.unit}</div>
                    </div>
                    <button
                      onClick={() => { if (variant.stock > 0) onAddToCart(p.id, variant.id, p.brands ? (selectedBrands[p.id] || p.brands[0]) : undefined); }}
                      disabled={variant.stock === 0}
                      style={{
                        background: variant.stock === 0 ? V.border : inCart ? "var(--color-success)" : "var(--gradient-primary)",
                        color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px",
                        fontWeight: 700, fontSize: 13, cursor: variant.stock === 0 ? "not-allowed" : "pointer",
                        boxShadow: variant.stock > 0 ? "0 2px 8px rgba(45,106,79,0.2)" : "none",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                      {variant.stock === 0 ? "Sold Out" : inCart ? `✓ In Basket (${inCart.quantity})` : "🧺 Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: V.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>No products found</p>
              <p style={{ fontSize: 13 }}>Try a different search or category</p>
            </div>
          )}
        </>
      )}

      {/* ===== TRUST SIGNALS ===== */}
      <div style={{ marginTop: 40, background: "var(--bg-accent-subtle)", border: `1px solid var(--border-accent)`, borderRadius: 16, padding: "24px 20px", textAlign: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: V.primary, marginBottom: 16 }}>Why NaijaBasket?</h3>
        <div className="nb-trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
          {[
            { icon: "🌾", title: "Farm Fresh", desc: "Direct from farms & markets" },
            { icon: "📦", title: "Ready Packs", desc: "Soup, stew & home bundles" },
            { icon: "🔒", title: "Secure Pay", desc: "Paystack & crypto accepted" },
            { icon: "🚚", title: "Fast Delivery", desc: "Free within Aba" },
          ].map((t, i) => (
            <div key={i}>
              <div style={{ fontSize: 28 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: V.text, margin: "6px 0 2px" }}>{t.title}</div>
              <div style={{ fontSize: 12, color: V.textMuted }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FLOATING CART BAR ===== */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          background: V.bgSecondary, borderTop: `1px solid ${V.border}`,
          padding: "12px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          backdropFilter: "blur(12px)", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: V.text }}>{cartCount} item{cartCount > 1 ? "s" : ""} in basket</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: V.primary }}>₦{cartTotal.toLocaleString()}</div>
          </div>
          <button onClick={() => onNavigate("cart")} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 12px rgba(45,106,79,0.3)" }}>View Basket →</button>
        </div>
      )}
    </div>
  );
}
