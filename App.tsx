import { useState, useEffect, useCallback, useRef } from "react";
import { Shop } from "./src/components/Shop";

// ============ TYPES ============
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
}

interface CartItem {
  productId: number;
  variantId: string;
  quantity: number;
  packageLabel?: string; // groups items from a package visually in cart
}

interface Order {
  id: string;
  date: string;
  items: Array<{
    productId: number;
    variantId: string;
    name: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentRef?: string;
  txHash?: string;
  status: string;
  deliveryStatus: string;
  customer: { name: string; phone: string; email: string; address: string };
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

// Package types
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
  discount: number; // percentage
  comingSoon?: boolean;
}

// Chat types
interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "customer" | "admin";
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  messages: ChatMessage[];
  status: "active" | "resolved";
  lastActivity: string;
  unreadCount: number;
}

// Expense types
interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

// User account types
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

// Review types
interface ProductReview {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

// Flash deal type
interface FlashDeal {
  productId: number;
  variantId: string;
  discountPercent: number;
  expiresAt: number; // timestamp
}

// ============ PRODUCT CATALOG ============
const CATEGORIES = [
  { id: "soup-packs", name: "Soup Packs", icon: "🍲" },
  { id: "stew-packs", name: "Stew Packs", icon: "🫕" },
  { id: "home-packs", name: "Home Packs", icon: "🏠" },
  { id: "all", name: "All Items", icon: "🛒" },
  { id: "grains", name: "Grains", icon: "🌾" },
  { id: "tubers", name: "Tubers", icon: "🥔" },
  { id: "oils", name: "Oils", icon: "🫒" },
  { id: "vegetables", name: "Vegetables", icon: "🍅" },
  { id: "proteins", name: "Proteins", icon: "🥩" },
  { id: "soups", name: "Soups & Seeds", icon: "🥣" },
  { id: "spices", name: "Spices", icon: "🧄" },
  { id: "pasta", name: "Pasta & Flour", icon: "🍝" },
];

const INITIAL_PRODUCTS: Product[] = [
  // Grains
  { id: 1, name: "Rice (Local)", category: "grains", desc: "Premium Nigerian long-grain rice", img: "🌾",
    variants: [
      { id: "1-q", size: "Quarter Bag", unit: "12.5kg", price: 15000, stock: 50 },
      { id: "1-h", size: "Half Bag", unit: "25kg", price: 28000, stock: 40 },
      { id: "1-f", size: "Full Bag", unit: "50kg", price: 52000, stock: 30 },
    ], inStock: true },
  { id: 2, name: "Rice (Foreign)", category: "grains", desc: "Imported parboiled rice, premium quality", img: "🌾",
    variants: [
      { id: "2-q", size: "Quarter Bag", unit: "12.5kg", price: 19000, stock: 35 },
      { id: "2-h", size: "Half Bag", unit: "25kg", price: 36000, stock: 25 },
      { id: "2-f", size: "Full Bag", unit: "50kg", price: 68000, stock: 20 },
    ], inStock: true },
  { id: 3, name: "Beans (Brown)", category: "grains", desc: "Clean, stone-free honey beans", img: "🫘",
    variants: [
      { id: "3-q", size: "Quarter Bag", unit: "12.5kg", price: 12000, stock: 45 },
      { id: "3-h", size: "Half Bag", unit: "25kg", price: 22000, stock: 30 },
      { id: "3-f", size: "Full Bag", unit: "50kg", price: 42000, stock: 20 },
    ], inStock: true },
  { id: 4, name: "Beans (White)", category: "grains", desc: "Premium white beans for moi-moi & akara", img: "🫘",
    variants: [
      { id: "4-q", size: "Quarter Bag", unit: "12.5kg", price: 11000, stock: 40 },
      { id: "4-h", size: "Half Bag", unit: "25kg", price: 20000, stock: 25 },
      { id: "4-f", size: "Full Bag", unit: "50kg", price: 38000, stock: 15 },
    ], inStock: true },
  { id: 5, name: "Maize (Corn)", category: "grains", desc: "Dried yellow maize, perfect for pap & feed", img: "🌽",
    variants: [
      { id: "5-q", size: "Quarter Bag", unit: "12.5kg", price: 7000, stock: 60 },
      { id: "5-h", size: "Half Bag", unit: "25kg", price: 13000, stock: 40 },
      { id: "5-f", size: "Full Bag", unit: "50kg", price: 24000, stock: 25 },
    ], inStock: true },
  { id: 6, name: "Millet", category: "grains", desc: "Quality millet grain for fura & porridge", img: "🌾",
    variants: [
      { id: "6-q", size: "Quarter Bag", unit: "12.5kg", price: 8000, stock: 30 },
      { id: "6-h", size: "Half Bag", unit: "25kg", price: 15000, stock: 20 },
    ], inStock: true },

  // Tubers
  { id: 7, name: "Garri (White)", category: "tubers", desc: "Premium processed white garri", img: "🥣",
    variants: [
      { id: "7-p", size: "Paint Bucket", unit: "~4kg", price: 3500, stock: 80 },
      { id: "7-h", size: "Half Bag", unit: "25kg", price: 15000, stock: 40 },
      { id: "7-f", size: "Full Bag", unit: "50kg", price: 28000, stock: 25 },
    ], inStock: true },
  { id: 8, name: "Garri (Yellow)", category: "tubers", desc: "Quality yellow garri from Imo", img: "🥣",
    variants: [
      { id: "8-p", size: "Paint Bucket", unit: "~4kg", price: 4000, stock: 70 },
      { id: "8-h", size: "Half Bag", unit: "25kg", price: 18000, stock: 35 },
      { id: "8-f", size: "Full Bag", unit: "50kg", price: 33000, stock: 20 },
    ], inStock: true },
  { id: 9, name: "Yam", category: "tubers", desc: "Fresh quality yam tubers from the North", img: "🥔",
    variants: [
      { id: "9-s", size: "Small Tuber", unit: "~2kg", price: 2500, stock: 100 },
      { id: "9-m", size: "Medium Tuber", unit: "~4kg", price: 4500, stock: 80 },
      { id: "9-l", size: "Large Tuber", unit: "~6kg", price: 7000, stock: 50 },
    ], inStock: true },
  { id: 10, name: "Potatoes (Sweet)", category: "tubers", desc: "Fresh sweet potatoes, farm direct", img: "🍠",
    variants: [
      { id: "10-p", size: "Paint Bucket", unit: "~5kg", price: 3000, stock: 60 },
      { id: "10-b", size: "Bag", unit: "~25kg", price: 12000, stock: 30 },
    ], inStock: true },

  // Oils
  { id: 11, name: "Palm Oil", category: "oils", desc: "Fresh red palm oil from Abia State", img: "🫒",
    variants: [
      { id: "11-1", size: "1 Litre", unit: "1L", price: 1800, stock: 100 },
      { id: "11-5", size: "5 Litres", unit: "5L", price: 8500, stock: 60 },
      { id: "11-25", size: "25L Jerrycan", unit: "25L", price: 40000, stock: 25 },
    ], inStock: true },
  { id: 12, name: "Groundnut Oil", category: "oils", desc: "Pure groundnut oil, no additives", img: "🥜",
    variants: [
      { id: "12-1", size: "1 Litre", unit: "1L", price: 2200, stock: 80 },
      { id: "12-5", size: "5 Litres", unit: "5L", price: 10000, stock: 40 },
      { id: "12-25", size: "25L Jerrycan", unit: "25L", price: 48000, stock: 15 },
    ], inStock: true },
  { id: 13, name: "Vegetable Oil", category: "oils", desc: "Premium vegetable cooking oil", img: "🍶",
    variants: [
      { id: "13-5", size: "5 Litres", unit: "5L", price: 9000, stock: 50 },
      { id: "13-25", size: "25L Jerrycan", unit: "25L", price: 42000, stock: 20 },
    ], inStock: true },

  // Vegetables
  { id: 14, name: "Tomatoes", category: "vegetables", desc: "Fresh ripe tomatoes, market quality", img: "🍅",
    variants: [
      { id: "14-b", size: "Basket (Small)", unit: "~15kg", price: 8000, stock: 40 },
      { id: "14-B", size: "Basket (Big)", unit: "~30kg", price: 15000, stock: 25 },
    ], inStock: true },
  { id: 15, name: "Onions", category: "vegetables", desc: "Fresh dry onions, large size", img: "🧅",
    variants: [
      { id: "15-p", size: "Paint Bucket", unit: "~5kg", price: 4000, stock: 50 },
      { id: "15-b", size: "Bag", unit: "~50kg", price: 35000, stock: 20 },
    ], inStock: true },
  { id: 16, name: "Pepper (Fresh)", category: "vegetables", desc: "Fresh scotch bonnet pepper (ata rodo)", img: "🌶️",
    variants: [
      { id: "16-p", size: "Paint Bucket", unit: "~4kg", price: 5000, stock: 60 },
      { id: "16-b", size: "Basket", unit: "~20kg", price: 18000, stock: 25 },
    ], inStock: true },
  { id: 17, name: "Okra (Dried)", category: "vegetables", desc: "Dried okra for draw soup", img: "🥒",
    variants: [
      { id: "17-m", size: "Mudu", unit: "~1kg", price: 3000, stock: 80 },
      { id: "17-p", size: "Paint Bucket", unit: "~4kg", price: 10000, stock: 40 },
    ], inStock: true },
  // New vegetables for packages
  { id: 35, name: "Oha Leaves", category: "vegetables", desc: "Fresh oha leaves for traditional soup", img: "🥬",
    variants: [
      { id: "35-s", size: "Small Bundle", unit: "~200g", price: 1500, stock: 60 },
      { id: "35-l", size: "Large Bundle", unit: "~500g", price: 3500, stock: 30 },
    ], inStock: true },
  { id: 36, name: "Ugu (Pumpkin Leaves)", category: "vegetables", desc: "Fresh ugu leaves, farm picked", img: "🥬",
    variants: [
      { id: "36-s", size: "Small Bundle", unit: "~300g", price: 800, stock: 80 },
      { id: "36-l", size: "Large Bundle", unit: "~1kg", price: 2000, stock: 40 },
    ], inStock: true },
  { id: 37, name: "Bitter Leaf", category: "vegetables", desc: "Fresh washed bitter leaf, ready to cook", img: "🥬",
    variants: [
      { id: "37-s", size: "Small Bundle", unit: "~300g", price: 1000, stock: 70 },
      { id: "37-l", size: "Large Bundle", unit: "~1kg", price: 2500, stock: 35 },
    ], inStock: true },
  { id: 38, name: "Spinach (Green)", category: "vegetables", desc: "Fresh green amaranth / efo tete", img: "🥬",
    variants: [
      { id: "38-s", size: "Small Bundle", unit: "~300g", price: 500, stock: 100 },
      { id: "38-l", size: "Large Bundle", unit: "~1kg", price: 1200, stock: 50 },
    ], inStock: true },

  // Proteins
  { id: 18, name: "Eggs (Crate)", category: "proteins", desc: "Fresh farm eggs, 30 per crate", img: "🥚",
    variants: [
      { id: "18-1", size: "1 Crate", unit: "30 eggs", price: 3500, stock: 100 },
      { id: "18-5", size: "5 Crates", unit: "150 eggs", price: 16500, stock: 50 },
    ], inStock: true },
  { id: 19, name: "Crayfish", category: "proteins", desc: "Dried crayfish, premium grade", img: "🦐",
    variants: [
      { id: "19-m", size: "Mudu", unit: "~1kg", price: 5000, stock: 70 },
      { id: "19-p", size: "Paint Bucket", unit: "~4kg", price: 18000, stock: 35 },
      { id: "19-b", size: "Bag", unit: "~25kg", price: 100000, stock: 10 },
    ], inStock: true },
  { id: 20, name: "Stockfish", category: "proteins", desc: "Imported stockfish, assorted sizes", img: "🐟",
    variants: [
      { id: "20-s", size: "Small Pack", unit: "~500g", price: 6000, stock: 50 },
      { id: "20-l", size: "Large Pack", unit: "~2kg", price: 22000, stock: 25 },
    ], inStock: true },
  { id: 21, name: "Dried Fish", category: "proteins", desc: "Smoked catfish & dried fish assorted", img: "🐟",
    variants: [
      { id: "21-s", size: "Small Bundle", unit: "~500g", price: 4000, stock: 60 },
      { id: "21-l", size: "Large Bundle", unit: "~2kg", price: 14000, stock: 30 },
    ], inStock: true },
  { id: 22, name: "Chicken", category: "proteins", desc: "Whole frozen chicken, cleaned & ready", img: "🍗",
    variants: [
      { id: "22-1", size: "1 Chicken", unit: "~1.5kg", price: 5500, stock: 40 },
      { id: "22-c", size: "Carton (10)", unit: "~15kg", price: 50000, stock: 15 },
    ], inStock: true },
  { id: 23, name: "Meat (Beef)", category: "proteins", desc: "Fresh beef, market cut", img: "🥩",
    variants: [
      { id: "23-1", size: "1 kg", unit: "1kg", price: 5000, stock: 50 },
      { id: "23-5", size: "5 kg", unit: "5kg", price: 23000, stock: 25 },
    ], inStock: true },
  { id: 41, name: "Fresh Fish", category: "proteins", desc: "Fresh catfish & tilapia, cleaned and gutted", img: "🐟",
    variants: [
      { id: "41-s", size: "Small (2-3 fish)", unit: "~1kg", price: 4000, stock: 60 },
      { id: "41-m", size: "Medium (4-5 fish)", unit: "~2.5kg", price: 9000, stock: 40 },
      { id: "41-l", size: "Large (8-10 fish)", unit: "~5kg", price: 16000, stock: 20 },
    ], inStock: true },

  // Soups & Seeds
  { id: 24, name: "Egusi (Melon)", category: "soups", desc: "Clean shelled egusi seeds", img: "🥣",
    variants: [
      { id: "24-m", size: "Half Paint", unit: "~1.5kg", price: 5000, stock: 60 },
      { id: "24-p", size: "Paint Bucket", unit: "~6kg", price: 18000, stock: 30 },
      { id: "24-b", size: "Bag", unit: "~25kg", price: 70000, stock: 10 },
    ], inStock: true },
  { id: 25, name: "Ogbono", category: "soups", desc: "Premium ogbono seeds for draw soup", img: "🥣",
    variants: [
      { id: "25-m", size: "Mudu", unit: "~1kg", price: 6000, stock: 50 },
      { id: "25-p", size: "Paint Bucket", unit: "~4kg", price: 22000, stock: 20 },
    ], inStock: true },

  // Spices
  { id: 26, name: "Ginger", category: "spices", desc: "Fresh dry ginger, strong aroma", img: "🧄",
    variants: [
      { id: "26-1", size: "1 kg", unit: "1kg", price: 3500, stock: 80 },
      { id: "26-p", size: "Paint Bucket", unit: "~5kg", price: 15000, stock: 30 },
    ], inStock: true },
  { id: 27, name: "Garlic", category: "spices", desc: "Fresh garlic bulbs, imported", img: "🧄",
    variants: [
      { id: "27-1", size: "1 kg", unit: "1kg", price: 4000, stock: 60 },
      { id: "27-p", size: "Paint Bucket", unit: "~5kg", price: 18000, stock: 25 },
    ], inStock: true },
  { id: 28, name: "Dawadawa (Locust Beans)", category: "spices", desc: "Traditional fermented locust beans", img: "🫘",
    variants: [
      { id: "28-s", size: "Small Pack", unit: "~200g", price: 1500, stock: 100 },
      { id: "28-l", size: "Large Pack", unit: "~1kg", price: 6000, stock: 50 },
    ], inStock: true },
  { id: 29, name: "Ogiri", category: "spices", desc: "Traditional fermented oil seed seasoning", img: "🫙",
    variants: [
      { id: "29-s", size: "Small Wrap", unit: "~100g", price: 500, stock: 150 },
      { id: "29-l", size: "Large Wrap", unit: "~500g", price: 2000, stock: 80 },
    ], inStock: true },
  // New spices
  { id: 39, name: "Seasoning Cubes", category: "spices", desc: "Maggi / Knorr assorted seasoning cubes", img: "🧂",
    variants: [
      { id: "39-p", size: "Pack (50 cubes)", unit: "~250g", price: 2500, stock: 120 },
      { id: "39-c", size: "Carton", unit: "~2.5kg", price: 22000, stock: 30 },
    ], inStock: true },
  { id: 40, name: "Salt", category: "spices", desc: "Fine table salt, iodized", img: "🧂",
    variants: [
      { id: "40-1", size: "1 kg", unit: "1kg", price: 500, stock: 200 },
      { id: "40-b", size: "Bag (25kg)", unit: "25kg", price: 8000, stock: 30 },
    ], inStock: true },

  // Pasta & Flour
  { id: 30, name: "Spaghetti", category: "pasta", desc: "Quality spaghetti pasta", img: "🍝",
    variants: [
      { id: "30-p", size: "Pack (500g)", unit: "500g", price: 800, stock: 200 },
      { id: "30-c", size: "Carton (20 packs)", unit: "10kg", price: 14000, stock: 40 },
    ], inStock: true },
  { id: 31, name: "Noodles", category: "pasta", desc: "Indomie & assorted noodles", img: "🍜",
    variants: [
      { id: "31-p", size: "Pack (single)", unit: "70g", price: 250, stock: 500 },
      { id: "31-c", size: "Carton (40 packs)", unit: "2.8kg", price: 9000, stock: 50 },
    ], inStock: true },
  { id: 32, name: "Semolina", category: "pasta", desc: "Quality semolina flour for swallow", img: "🍚",
    variants: [
      { id: "32-1", size: "1 kg", unit: "1kg", price: 1500, stock: 80 },
      { id: "32-5", size: "5 kg", unit: "5kg", price: 7000, stock: 40 },
    ], inStock: true },
  { id: 33, name: "Wheat Flour", category: "pasta", desc: "All-purpose wheat flour for baking", img: "🌾",
    variants: [
      { id: "33-h", size: "Half Bag", unit: "25kg", price: 18000, stock: 30 },
      { id: "33-f", size: "Full Bag", unit: "50kg", price: 34000, stock: 15 },
    ], inStock: true },
  { id: 34, name: "Poundo Yam", category: "pasta", desc: "Instant poundo yam flour", img: "🥔",
    variants: [
      { id: "34-1", size: "1 kg", unit: "1kg", price: 1800, stock: 70 },
      { id: "34-5", size: "5 kg", unit: "5kg", price: 8500, stock: 35 },
    ], inStock: true },
];

// ============ FOOD PACKAGES ============
const PACKAGES: FoodPackage[] = [
  // === SOUP PACKS (5% discount) ===
  { id: "pkg-egusi", name: "Egusi Soup Pack", desc: "Everything to cook a rich pot of egusi soup", icon: "🍲", type: "soup", servings: "Feeds 4–6", discount: 5,
    items: [
      { productId: 24, variantId: "24-m", quantity: 1, required: true },  // Egusi half paint
      { productId: 11, variantId: "11-1", quantity: 1, required: true },  // Palm oil 1L
      { productId: 19, variantId: "19-m", quantity: 1, required: true },  // Crayfish mudu
      { productId: 20, variantId: "20-s", quantity: 1, required: false }, // Stockfish small
      { productId: 21, variantId: "21-s", quantity: 1, required: false }, // Dried fish small
      { productId: 16, variantId: "16-p", quantity: 1, required: true },  // Pepper paint bucket
      { productId: 15, variantId: "15-p", quantity: 1, required: true },  // Onions paint bucket
      { productId: 36, variantId: "36-l", quantity: 1, required: false }, // Ugu leaves large
      { productId: 39, variantId: "39-p", quantity: 1, required: true },  // Seasoning cubes
      { productId: 40, variantId: "40-1", quantity: 1, required: true },  // Salt 1kg
    ] },
  { id: "pkg-ogbono", name: "Ogbono Soup Pack", desc: "Premium ogbono draw soup ingredients", icon: "🍲", type: "soup", servings: "Feeds 4–6", discount: 5,
    items: [
      { productId: 25, variantId: "25-m", quantity: 1, required: true },
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 19, variantId: "19-m", quantity: 1, required: true },
      { productId: 20, variantId: "20-s", quantity: 1, required: false },
      { productId: 21, variantId: "21-s", quantity: 1, required: false },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
      { productId: 40, variantId: "40-1", quantity: 1, required: true },
    ] },
  { id: "pkg-okra", name: "Okra Soup Pack", desc: "Fresh okra draw soup with all the fixings", icon: "🍲", type: "soup", servings: "Feeds 4–6", discount: 5,
    items: [
      { productId: 17, variantId: "17-m", quantity: 2, required: true },
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 19, variantId: "19-m", quantity: 1, required: true },
      { productId: 20, variantId: "20-s", quantity: 1, required: false },
      { productId: 21, variantId: "21-s", quantity: 1, required: false },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
    ] },
  { id: "pkg-oha", name: "Oha Soup Pack", desc: "Traditional oha leaf soup with ogbono", icon: "🍲", type: "soup", servings: "Feeds 4–6", discount: 5,
    items: [
      { productId: 35, variantId: "35-l", quantity: 1, required: true },  // Oha leaves
      { productId: 25, variantId: "25-m", quantity: 1, required: true },  // Ogbono (thickener)
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 19, variantId: "19-m", quantity: 1, required: true },
      { productId: 20, variantId: "20-s", quantity: 1, required: false },
      { productId: 21, variantId: "21-s", quantity: 1, required: false },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
    ] },
  { id: "pkg-vegetable", name: "Vegetable Soup Pack", desc: "Ugu & egusi vegetable soup combo", icon: "🍲", type: "soup", servings: "Feeds 4–6", discount: 5,
    items: [
      { productId: 36, variantId: "36-l", quantity: 2, required: true },  // Ugu leaves
      { productId: 24, variantId: "24-m", quantity: 1, required: true },  // Egusi (thickener)
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 19, variantId: "19-m", quantity: 1, required: true },
      { productId: 20, variantId: "20-s", quantity: 1, required: false },
      { productId: 21, variantId: "21-s", quantity: 1, required: false },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
    ] },
  { id: "pkg-bitterleaf", name: "Bitter Leaf Soup Pack", desc: "Authentic bitter leaf soup with ogbono", icon: "🍲", type: "soup", servings: "Feeds 4–6", discount: 5,
    items: [
      { productId: 37, variantId: "37-l", quantity: 1, required: true },
      { productId: 25, variantId: "25-m", quantity: 1, required: true },
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 19, variantId: "19-m", quantity: 1, required: true },
      { productId: 20, variantId: "20-s", quantity: 1, required: false },
      { productId: 21, variantId: "21-s", quantity: 1, required: false },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
    ] },
  { id: "pkg-pepper", name: "Pepper Soup Pack", desc: "Spicy pepper soup essentials", icon: "🌶️", type: "soup", servings: "Feeds 3–4", discount: 5,
    items: [
      { productId: 23, variantId: "23-1", quantity: 1, required: true },  // Beef 1kg
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 26, variantId: "26-1", quantity: 1, required: true },  // Ginger
      { productId: 27, variantId: "27-1", quantity: 1, required: false }, // Garlic
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
      { productId: 40, variantId: "40-1", quantity: 1, required: true },
    ] },

  // === STEW PACKS (5% discount) ===
  { id: "pkg-stew", name: "Tomato Stew Pack", desc: "Base stew for rice, yam & more", icon: "🫕", type: "stew", servings: "Makes 3–4L", discount: 5,
    items: [
      { productId: 14, variantId: "14-b", quantity: 1, required: true },  // Tomatoes small basket
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 13, variantId: "13-5", quantity: 1, required: true },  // Veg oil 5L
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
      { productId: 40, variantId: "40-1", quantity: 1, required: true },
    ] },
  { id: "pkg-jollof", name: "Jollof Rice Pack", desc: "Complete jollof rice ingredients", icon: "🍚", type: "stew", servings: "Feeds 6–8", discount: 5,
    items: [
      { productId: 1, variantId: "1-q", quantity: 1, required: true },   // Rice quarter bag
      { productId: 14, variantId: "14-b", quantity: 1, required: true },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 13, variantId: "13-5", quantity: 1, required: true },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
      { productId: 40, variantId: "40-1", quantity: 1, required: true },
    ] },
  { id: "pkg-porridge", name: "Porridge Yam Pack", desc: "Yam porridge with all the extras", icon: "🍠", type: "stew", servings: "Feeds 3–4", discount: 5,
    items: [
      { productId: 9, variantId: "9-m", quantity: 1, required: true },   // Yam medium
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 19, variantId: "19-m", quantity: 1, required: false },
      { productId: 18, variantId: "18-1", quantity: 1, required: false }, // Eggs
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
    ] },

  // === HOME PACKS (3% discount) ===
  { id: "pkg-bachelor", name: "Bachelor Home Pack", desc: "Essentials for 1–2 people, ~2 weeks", icon: "🏠", type: "home", servings: "1–2 people, 2 weeks", discount: 3,
    items: [
      { productId: 1, variantId: "1-q", quantity: 1, required: true },
      { productId: 3, variantId: "3-q", quantity: 1, required: true },
      { productId: 7, variantId: "7-p", quantity: 1, required: true },
      { productId: 11, variantId: "11-1", quantity: 1, required: true },
      { productId: 13, variantId: "13-5", quantity: 1, required: true },
      { productId: 14, variantId: "14-b", quantity: 1, required: true },
      { productId: 16, variantId: "16-p", quantity: 1, required: true },
      { productId: 15, variantId: "15-p", quantity: 1, required: true },
      { productId: 18, variantId: "18-1", quantity: 1, required: false },
      { productId: 19, variantId: "19-m", quantity: 1, required: false },
      { productId: 39, variantId: "39-p", quantity: 1, required: true },
      { productId: 40, variantId: "40-1", quantity: 1, required: true },
    ] },
  { id: "pkg-family", name: "Family Home Pack", desc: "Full stock for 3–5 people, ~2 weeks", icon: "👨‍👩‍👧‍👦", type: "home", servings: "3–5 people, 2 weeks", discount: 3,
    items: [
      { productId: 1, variantId: "1-h", quantity: 1, required: true },
      { productId: 3, variantId: "3-q", quantity: 1, required: true },
      { productId: 7, variantId: "7-h", quantity: 1, required: true },
      { productId: 9, variantId: "9-l", quantity: 1, required: false },
      { productId: 11, variantId: "11-5", quantity: 1, required: true },
      { productId: 13, variantId: "13-5", quantity: 1, required: true },
      { productId: 14, variantId: "14-B", quantity: 1, required: true },
      { productId: 16, variantId: "16-b", quantity: 1, required: true },
      { productId: 15, variantId: "15-b", quantity: 1, required: true },
      { productId: 18, variantId: "18-5", quantity: 1, required: false },
      { productId: 22, variantId: "22-c", quantity: 1, required: false },
      { productId: 23, variantId: "23-5", quantity: 1, required: false },
      { productId: 19, variantId: "19-p", quantity: 1, required: true },
      { productId: 24, variantId: "24-m", quantity: 1, required: false },
      { productId: 25, variantId: "25-m", quantity: 1, required: false },
      { productId: 30, variantId: "30-c", quantity: 1, required: false },
      { productId: 31, variantId: "31-c", quantity: 1, required: false },
      { productId: 32, variantId: "32-5", quantity: 1, required: false },
      { productId: 39, variantId: "39-p", quantity: 2, required: true },
      { productId: 40, variantId: "40-1", quantity: 2, required: true },
    ] },
  { id: "pkg-super", name: "Super Home Pack", desc: "Complete monthly food stock, massive savings", icon: "🏡", type: "home", servings: "Family, ~1 month", discount: 3,
    items: [
      { productId: 1, variantId: "1-f", quantity: 1, required: true },
      { productId: 2, variantId: "2-q", quantity: 1, required: false },
      { productId: 3, variantId: "3-h", quantity: 1, required: true },
      { productId: 4, variantId: "4-q", quantity: 1, required: false },
      { productId: 7, variantId: "7-h", quantity: 1, required: true },
      { productId: 8, variantId: "8-h", quantity: 1, required: false },
      { productId: 9, variantId: "9-l", quantity: 2, required: false },
      { productId: 11, variantId: "11-25", quantity: 1, required: true },
      { productId: 13, variantId: "13-25", quantity: 1, required: true },
      { productId: 12, variantId: "12-5", quantity: 1, required: false },
      { productId: 14, variantId: "14-B", quantity: 2, required: true },
      { productId: 16, variantId: "16-b", quantity: 1, required: true },
      { productId: 15, variantId: "15-b", quantity: 1, required: true },
      { productId: 18, variantId: "18-5", quantity: 1, required: false },
      { productId: 22, variantId: "22-c", quantity: 1, required: false },
      { productId: 23, variantId: "23-5", quantity: 1, required: false },
      { productId: 19, variantId: "19-b", quantity: 1, required: true },
      { productId: 20, variantId: "20-l", quantity: 1, required: false },
      { productId: 21, variantId: "21-l", quantity: 1, required: false },
      { productId: 24, variantId: "24-p", quantity: 1, required: false },
      { productId: 25, variantId: "25-p", quantity: 1, required: false },
      { productId: 30, variantId: "30-c", quantity: 1, required: false },
      { productId: 31, variantId: "31-c", quantity: 1, required: false },
      { productId: 32, variantId: "32-5", quantity: 1, required: false },
      { productId: 33, variantId: "33-h", quantity: 1, required: false },
      { productId: 39, variantId: "39-c", quantity: 1, required: true },
      { productId: 40, variantId: "40-b", quantity: 1, required: true },
    ] },

  // === SEASONAL (Coming Soon) ===
  { id: "pkg-christmas", name: "Christmas Pack", desc: "Festive season food stock — rice, chicken, drinks & more", icon: "🎄", type: "seasonal", servings: "Family celebration", discount: 5, comingSoon: true, items: [] },
  { id: "pkg-sallah", name: "Sallah Pack", desc: "Eid celebration essentials — ram provisions & spices", icon: "🌙", type: "seasonal", servings: "Family celebration", discount: 5, comingSoon: true, items: [] },
];

// ============ PACKAGE HELPERS ============
function calcPackagePrice(pkg: FoodPackage, productList: Product[]): { original: number; discounted: number; savings: number } {
  let total = 0;
  for (const item of pkg.items) {
    const product = productList.find(p => p.id === item.productId);
    if (!product) continue;
    const variant = product.variants.find(v => v.id === item.variantId);
    if (!variant) continue;
    total += variant.price * item.quantity;
  }
  const discounted = Math.round(total * (1 - pkg.discount / 100));
  return { original: total, discounted, savings: total - discounted };
}

function isPackageAvailable(pkg: FoodPackage, productList: Product[]): { available: boolean; unavailableItems: string[] } {
  if (pkg.comingSoon) return { available: false, unavailableItems: [] };
  const unavailable: string[] = [];
  for (const item of pkg.items) {
    const product = productList.find(p => p.id === item.productId);
    if (!product || !product.inStock) {
      unavailable.push(product?.name || "Unknown");
    }
  }
  return { available: unavailable.length === 0, unavailableItems: unavailable };
}

// ============ OTHER CONSTANTS ============
const PAYMENT_METHODS = [
  { id: "naira", label: "Pay with Naira (₦)", icon: "💳", desc: "Via Paystack" },
  { id: "crypto", label: "Pay with Crypto", icon: "💰", desc: "USDT, BNB, ETH" },
];

const MIN_ORDER = 5000;

const EXPENSE_CATEGORIES = ["Rent", "Transport", "Utility", "Packaging", "Staff", "Marketing", "Other"];

// Points rate: 1 point per ₦100 spent. 100 points = ₦100 discount
const POINTS_PER_NAIRA = 0.01; // earn
const POINTS_VALUE = 1; // redeem: 1 point = ₦1

// Flash deal helper — picks a random product each day
function getDailyFlashDeal(productList: Product[]): FlashDeal {
  const today = new Date();
  // Use date as seed for consistent daily deal
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const dealProducts = productList.filter(p => p.inStock && p.variants.some(v => v.stock > 5));
  if (dealProducts.length === 0) {
    // Fallback to first product
    const fallback = productList[0];
    return { productId: fallback.id, variantId: fallback.variants[0].id, discountPercent: 10, expiresAt: Date.now() + 86400000 };
  }
  const pick = dealProducts[seed % dealProducts.length];
  const variant = pick.variants[0];
  // Deal expires at midnight
  const midnight = new Date(today);
  midnight.setHours(23, 59, 59, 999);
  return {
    productId: pick.id,
    variantId: variant.id,
    discountPercent: [10, 15, 12, 8, 20][seed % 5],
    expiresAt: midnight.getTime(),
  };
}

function generateReferralCode(name: string): string {
  return "NB-" + name.replace(/\s/g, "").substring(0, 4).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============ HELPERS ============
function generateOrderId(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `NB-${dateStr}-${rand}`;
}

function getProductFrom(productList: Product[], id: number): Product | undefined {
  return productList.find(p => p.id === id);
}

function getVariant(product: Product, variantId: string): ProductVariant | undefined {
  return product.variants.find(v => v.id === variantId);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// ============ APP ============
export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("nb_theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Navigation
  const [page, setPage] = useState<string>("shop");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try { const saved = localStorage.getItem("nb_orders"); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });

  // Checkout form
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", payment: "naira" });

  // UI state
  const [placed, setPlaced] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentScreen, setPaymentScreen] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Admin
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminView, setAdminView] = useState<"stats" | "inventory" | "accounting" | "crm" | "audit" | "messages" | "settings">("stats");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Inventory
  const [inventoryData, setInventoryData] = useState<{ purchases: any[]; damages: any[] }>({ purchases: [], damages: [] });

  // Package editor
  const [editingPackage, setEditingPackage] = useState<{ pkg: FoodPackage; items: PackageItem[] } | null>(null);

  // Accounting state
  const [acctPeriod, setAcctPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try { const saved = localStorage.getItem("nb_expenses"); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [expenseForm, setExpenseForm] = useState({ category: "Transport", description: "", amount: "" });

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try { const saved = localStorage.getItem("nb_chats"); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<"chat" | "whatsapp">("chat");
  const [chatInput, setChatInput] = useState("");
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try { const saved = localStorage.getItem("nb_user"); return saved ? JSON.parse(saved) : null; }
    catch { return null; }
  });
  const [userToken, setUserToken] = useState<string | null>(() => localStorage.getItem("nb_user_token"));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<"choose" | "signup" | "otp-email" | "otp-phone" | "add-phone">("choose");
  const [signupForm, setSignupForm] = useState({ name: "", email: "", phone: "" });
  const [otpInput, setOtpInput] = useState("");
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
  const [otpTarget, setOtpTarget] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<{ type: "single"; productId: number; variantId: string } | { type: "package"; pkg: FoodPackage; items?: PackageItem[] } | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  // Dev OTP display (only for mock server testing)
  const [devOtp, setDevOtp] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try { const saved = localStorage.getItem("nb_reviews"); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [reviewModal, setReviewModal] = useState<{ productId: number; rating: number; comment: string } | null>(null);

  // Products state (mutable for admin management)
  const [products, setProducts] = useState<Product[]>(() => {
    try { const saved = localStorage.getItem("nb_products"); return saved ? JSON.parse(saved) : INITIAL_PRODUCTS; }
    catch { return INITIAL_PRODUCTS; }
  });

  // Flash deal
  const [flashDeal] = useState<FlashDeal>(() => getDailyFlashDeal(products));
  const [dealCountdown, setDealCountdown] = useState("");

  // Referral
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralInput, setReferralInput] = useState("");

  // Loyalty points redeem
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin product management
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "grains", desc: "", variants: [{ size: "", unit: "", price: "", stock: "" }] });

  // Product helper wrappers
  const getProduct = (id: number) => getProductFrom(products, id);

  // Auto-generate emoji icon based on product name/category
  function autoIcon(name: string, category: string): string {
    const n = name.toLowerCase();
    if (n.includes("rice")) return "🌾";
    if (n.includes("beans")) return "🫘";
    if (n.includes("maize") || n.includes("corn")) return "🌽";
    if (n.includes("millet") || n.includes("wheat") || n.includes("flour")) return "🌾";
    if (n.includes("garri") || n.includes("semolina") || n.includes("poundo")) return "🥣";
    if (n.includes("yam") || n.includes("potato")) return "🥔";
    if (n.includes("palm oil")) return "🫒";
    if (n.includes("groundnut") || n.includes("peanut")) return "🥜";
    if (n.includes("oil")) return "🍶";
    if (n.includes("tomato")) return "🍅";
    if (n.includes("onion")) return "🧅";
    if (n.includes("pepper")) return "🌶️";
    if (n.includes("okra")) return "🥒";
    if (n.includes("spinach") || n.includes("ugu") || n.includes("leaf") || n.includes("leaves")) return "🥬";
    if (n.includes("egg")) return "🥚";
    if (n.includes("fish") || n.includes("stockfish")) return "🐟";
    if (n.includes("crayfish") || n.includes("shrimp") || n.includes("prawn")) return "🦐";
    if (n.includes("chicken") || n.includes("turkey")) return "🍗";
    if (n.includes("meat") || n.includes("beef") || n.includes("goat") || n.includes("ram")) return "🥩";
    if (n.includes("snail")) return "🐌";
    if (n.includes("egusi") || n.includes("melon") || n.includes("ogbono")) return "🥣";
    if (n.includes("ginger") || n.includes("garlic")) return "🧄";
    if (n.includes("salt") || n.includes("seasoning") || n.includes("cube")) return "🧂";
    if (n.includes("dawadawa") || n.includes("locust")) return "🫘";
    if (n.includes("spaghetti") || n.includes("pasta")) return "🍝";
    if (n.includes("noodle") || n.includes("indomie")) return "🍜";
    if (n.includes("sugar")) return "🍬";
    if (n.includes("milk") || n.includes("cream")) return "🥛";
    if (n.includes("bread")) return "🍞";
    if (n.includes("fruit") || n.includes("orange") || n.includes("banana") || n.includes("plantain")) return "🍌";
    if (n.includes("coconut")) return "🥥";
    if (n.includes("honey")) return "🍯";
    if (n.includes("water") || n.includes("drink")) return "🥤";
    // Fallback by category
    const catIcons: Record<string, string> = { grains: "🌾", tubers: "🥔", oils: "🫒", vegetables: "🍅", proteins: "🥩", soups: "🥣", spices: "🧄", pasta: "🍝" };
    return catIcons[category] || "📦";
  }

  // ===== EFFECTS =====
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("nb_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => { localStorage.setItem("nb_orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("nb_expenses", JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem("nb_chats", JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem("nb_products", JSON.stringify(products)); }, [products]);

  useEffect(() => {
    if (!paymentScreen || paymentScreen.type !== "crypto" || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(t => { if (t <= 1) { setPaymentScreen(null); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentScreen, timer]);

  // Reviews persistence
  useEffect(() => { localStorage.setItem("nb_reviews", JSON.stringify(reviews)); }, [reviews]);

  // Flash deal countdown
  useEffect(() => {
    const updateCountdown = () => {
      const diff = flashDeal.expiresAt - Date.now();
      if (diff <= 0) { setDealCountdown("EXPIRED"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDealCountdown(`${h}h ${m}m ${s}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [flashDeal]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timeout = setTimeout(() => setToasts(prev => prev.slice(1)), 5000);
    return () => clearTimeout(timeout);
  }, [toasts]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatOpen, conversations]);

  // ===== TOAST =====
  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  // ===== USER AUTH PERSISTENCE =====
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("nb_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("nb_user");
    }
  }, [currentUser]);

  useEffect(() => {
    if (userToken) {
      localStorage.setItem("nb_user_token", userToken);
    } else {
      localStorage.removeItem("nb_user_token");
    }
  }, [userToken]);

  // ===== AUTH FUNCTIONS =====
  const resetAuthModal = () => {
    setShowAuthModal(false);
    setAuthStep("choose");
    setSignupForm({ name: "", email: "", phone: "" });
    setOtpInput("");
    setAuthError("");
    setAuthLoading(false);
    setEmailVerified(false);
    setPhoneVerified(false);
    setDevOtp("");
  };

  // Generate a random 6-digit OTP for client-side mock auth
  const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  const handleSignup = async () => {
    setAuthError("");
    if (!signupForm.name || !signupForm.email) { setAuthError("Please fill in your name and email."); return; }
    setAuthLoading(true);
    const user = { id: `u_${Date.now()}`, name: signupForm.name, email: signupForm.email, phone: signupForm.phone };
    setCurrentUser({ ...user, emailVerified: false, phoneVerified: false, loyaltyPoints: 0, referralCode: generateReferralCode(signupForm.name) });
    setUserToken(`tok_${Date.now()}`);
    await sendOtp("email", signupForm.email);
    setAuthStep("otp-email");
    setAuthLoading(false);
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthLoading(true);
    // Client-side Google mock — in production, integrate Google Identity Services
    const mockEmail = `user${Date.now()}@gmail.com`;
    const mockName = "Google User";
    const user = { id: `g_${Date.now()}`, name: mockName, email: mockEmail, phone: "" };
    setCurrentUser({ ...user, emailVerified: true, phoneVerified: false, loyaltyPoints: 0, referralCode: generateReferralCode(mockName) });
    setUserToken(`tok_${Date.now()}`);
    setEmailVerified(true);
    setAuthStep("add-phone");
    setAuthLoading(false);
  };

  const sendOtp = async (channel: "email" | "phone", value: string) => {
    setAuthError("");
    setOtpChannel(channel);
    setOtpTarget(value);
    setOtpInput("");
    const otp = generateOtp();
    setDevOtp(otp);
    showToast(`OTP sent to your ${channel}: ${otp}`, "success");
  };

  const verifyOtp = async () => {
    setAuthError("");
    setAuthLoading(true);
    if (otpInput === devOtp) {
      if (otpChannel === "email") {
        setEmailVerified(true);
        setCurrentUser(prev => prev ? { ...prev, emailVerified: true } : null);
        await sendOtp("phone", currentUser?.phone || signupForm.phone);
        setAuthStep("otp-phone");
      } else {
        setPhoneVerified(true);
        setCurrentUser(prev => prev ? { ...prev, phoneVerified: true } : null);
        showToast("Account verified! Welcome to NaijaBasket 🎉", "success");
        const pending = pendingCartAction;
        resetAuthModal();
        if (pending) {
          if (pending.type === "single") {
            doAddToCart(pending.productId, pending.variantId);
          } else {
            doAddPackageToCart(pending.pkg, pending.items);
          }
          setPendingCartAction(null);
        }
      }
    } else {
      setAuthError("Invalid OTP. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleAddPhoneAndVerify = async () => {
    if (!signupForm.phone) { setAuthError("Please enter your phone number."); return; }
    setAuthLoading(true);
    setCurrentUser(prev => prev ? { ...prev, phone: signupForm.phone } : null);
    await sendOtp("phone", signupForm.phone);
    setAuthStep("otp-phone");
    setAuthLoading(false);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    setUserToken(null);
    localStorage.removeItem("nb_user");
    localStorage.removeItem("nb_user_token");
    showToast("Logged out successfully", "info");
  };

  const isUserFullyVerified = !!(currentUser && currentUser.emailVerified && currentUser.phoneVerified);

  // ===== REVIEWS =====
  const getProductRating = (productId: number) => {
    const productReviews = reviews.filter(r => r.productId === productId);
    if (productReviews.length === 0) return { avg: 0, count: 0 };
    const avg = productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length;
    return { avg: Math.round(avg * 10) / 10, count: productReviews.length };
  };

  const submitReview = () => {
    if (!reviewModal || !currentUser) return;
    if (reviewModal.rating === 0) { showToast("Please select a star rating", "error"); return; }
    const review: ProductReview = {
      id: generateId(),
      productId: reviewModal.productId,
      userId: currentUser.id,
      userName: currentUser.name,
      rating: reviewModal.rating,
      comment: reviewModal.comment,
      date: new Date().toISOString(),
    };
    setReviews(prev => [review, ...prev]);
    setReviewModal(null);
    showToast("Review submitted! Thank you ⭐", "success");
  };

  // ===== LOYALTY POINTS =====
  const userPoints = currentUser?.loyaltyPoints || 0;
  const earnPointsFromOrder = (orderTotal: number) => {
    const earned = Math.floor(orderTotal * POINTS_PER_NAIRA);
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, loyaltyPoints: (prev.loyaltyPoints || 0) + earned } : null);
      showToast(`You earned ${earned} loyalty points! 🎉`, "success");
    }
    return earned;
  };

  // ===== REFERRAL =====
  const applyReferralCode = (code: string) => {
    if (!currentUser) { showToast("Please sign up first", "error"); return; }
    if (currentUser.referredBy) { showToast("You've already used a referral code", "info"); return; }
    if (code === currentUser.referralCode) { showToast("You can't use your own referral code", "error"); return; }
    // In production, validate against server. For now, accept any NB- code
    if (!code.startsWith("NB-")) { showToast("Invalid referral code", "error"); return; }
    setCurrentUser(prev => prev ? { ...prev, referredBy: code, loyaltyPoints: (prev.loyaltyPoints || 0) + 500 } : null);
    showToast("Referral applied! You earned 500 bonus points 🎉", "success");
    setShowReferralModal(false);
    setReferralInput("");
  };

  // ===== FLASH DEAL HELPERS =====
  const flashProduct = getProduct(flashDeal.productId);
  const flashVariant = flashProduct ? getVariant(flashProduct, flashDeal.variantId) : null;
  const flashPrice = flashVariant ? Math.round(flashVariant.price * (1 - flashDeal.discountPercent / 100)) : 0;

  // ===== CART =====
  // Internal cart add functions (bypasses auth check)
  const doAddToCart = (productId: number, variantId: string, packageLabel?: string) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.productId === productId && c.variantId === variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId, variantId, quantity: 1, packageLabel }];
    });
    const p = getProduct(productId);
    if (p && !packageLabel) showToast(`${p.name} added to basket`, "success");
  };

  const doAddPackageToCart = (pkg: FoodPackage, customItems?: PackageItem[]) => {
    const items = customItems || pkg.items;
    const { available } = isPackageAvailable(pkg, products);
    if (!available) { showToast("This package is currently unavailable", "error"); return; }
    setCart(prev => {
      const newItems: CartItem[] = [...prev];
      for (const item of items) {
        const idx = newItems.findIndex(c => c.productId === item.productId && c.variantId === item.variantId);
        if (idx >= 0) {
          newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + item.quantity, packageLabel: pkg.name };
        } else {
          newItems.push({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, packageLabel: pkg.name });
        }
      }
      return newItems;
    });
    showToast(`📦 ${pkg.name} added to basket!`, "success");
    setEditingPackage(null);
  };

  // Public cart functions — gate behind auth
  const addToCart = useCallback((productId: number, variantId: string, _packageLabel?: string) => {
    if (!isUserFullyVerified) {
      setPendingCartAction({ type: "single", productId, variantId });
      setShowAuthModal(true);
      setAuthStep(currentUser ? (currentUser.emailVerified ? (currentUser.phone ? "otp-phone" : "add-phone") : "otp-email") : "choose");
      return;
    }
    doAddToCart(productId, variantId, _packageLabel);
  }, [isUserFullyVerified, currentUser]);

  const addPackageToCart = useCallback((pkg: FoodPackage, customItems?: PackageItem[]) => {
    if (!isUserFullyVerified) {
      setPendingCartAction({ type: "package", pkg, items: customItems });
      setShowAuthModal(true);
      setAuthStep(currentUser ? (currentUser.emailVerified ? (currentUser.phone ? "otp-phone" : "add-phone") : "otp-email") : "choose");
      return;
    }
    doAddPackageToCart(pkg, customItems);
  }, [showToast]);

  const updateCartQty = useCallback((productId: number, variantId: string, delta: number) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.productId === productId && c.variantId === variantId);
      if (idx < 0) return prev;
      const newQty = prev[idx].quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: number, variantId: string) => {
    setCart(prev => prev.filter(c => !(c.productId === productId && c.variantId === variantId)));
  }, []);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartSubtotal = cart.reduce((sum, c) => {
    const p = getProduct(c.productId);
    if (!p) return sum;
    const v = getVariant(p, c.variantId);
    if (!v) return sum;
    return sum + v.price * c.quantity;
  }, 0);
  const deliveryFee = form.address.toLowerCase().includes("aba") || form.address === "" ? 0 : 2500;
  const cartTotal = cartSubtotal + deliveryFee;
  const pointsDiscount = Math.min(redeemPoints * POINTS_VALUE, cartSubtotal, userPoints * POINTS_VALUE);

  // ===== ADMIN AUTH =====
  async function handleAdminLogin() {
    setLoginError("");
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user?.role === "admin") {
          localStorage.setItem("nb_token", data.accessToken);
          setAdminAuth(true); setPage("admin-dashboard");
          showToast("Welcome back, Admin!", "success");
        } else { setLoginError("This account does not have admin access."); }
      } else {
        const err = await res.json().catch(() => ({}));
        setLoginError(err.error || "Invalid credentials. Please try again.");
      }
    } catch { setLoginError("Could not connect to server. Please try again."); }
  }

  function handleAdminLogout() {
    localStorage.removeItem("nb_token");
    setAdminAuth(false); setPage("shop");
    showToast("Logged out successfully", "info");
  }

  async function handleChangePassword() {
    setPwMsg(null);
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwMsg({ text: "All fields are required.", type: "error" }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ text: "New passwords do not match.", type: "error" }); return; }
    if (pwForm.newPw.length < 6) { setPwMsg({ text: "New password must be at least 6 characters.", type: "error" }); return; }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("nb_token");
      const res = await fetch("http://localhost:3000/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (res.ok) { setPwMsg({ text: "Password changed successfully!", type: "success" }); setPwForm({ current: "", newPw: "", confirm: "" }); showToast("Admin password updated", "success"); }
      else { setPwMsg({ text: data.error || "Failed to change password.", type: "error" }); }
    } catch { setPwMsg({ text: "Could not connect to server.", type: "error" }); }
    finally { setPwLoading(false); }
  }

  // ===== ORDER PLACEMENT =====
  async function placeOrder() {
    if (!form.name || !form.phone || !form.address) { showToast("Please fill in all delivery details", "error"); return; }
    if (cartSubtotal < MIN_ORDER) { showToast(`Minimum order is ₦${MIN_ORDER.toLocaleString()}.`, "error"); return; }

    setProcessing(true);
    const orderItems = cart.map(c => {
      const p = getProduct(c.productId)!;
      const v = getVariant(p, c.variantId)!;
      return { productId: c.productId, variantId: c.variantId, name: p.name, variant: `${v.size} (${v.unit})`, quantity: c.quantity, unitPrice: v.price, total: v.price * c.quantity };
    });

    const order: Order = {
      id: generateOrderId(), date: new Date().toISOString(), items: orderItems,
      subtotal: cartSubtotal, deliveryFee, total: cartTotal, paymentMethod: form.payment,
      status: "pending", deliveryStatus: "preparing",
      customer: { name: form.name, phone: form.phone, email: form.email, address: form.address },
    };

    try {
      if (form.payment === "naira") {
        const paystackRes = await fetch("http://localhost:3000/api/payments/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("nb_token") || ""}` },
          body: JSON.stringify({ orderId: order.id, email: form.email || `${form.phone}@naijabasket.com`, amount: cartTotal }),
        });
        if (paystackRes.ok) {
          const paymentData = await paystackRes.json();
          order.paymentRef = paymentData.data?.reference;
          setOrders(prev => [order, ...prev]);
          setPaymentScreen({ type: "naira", order, authUrl: paymentData.data?.authorizationUrl });
        } else { showToast("Failed to initialize payment. Please try again.", "error"); }
      } else {
        setOrders(prev => [order, ...prev]);
        setTimer(30 * 60);
        setPaymentScreen({ type: "crypto", order, merchantAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68" });
      }
    } catch { showToast("Connection error. Please try again.", "error"); }
    setProcessing(false);
  }

  function handlePaymentConfirmed(txHash?: string) {
    if (paymentScreen) {
      const oid = paymentScreen.order.id;
      setOrders(prev => prev.map(o => o.id === oid ? { ...o, status: txHash ? "confirming" : "paid", txHash } : o));
      // Award loyalty points
      earnPointsFromOrder(paymentScreen.order.total);
      // Deduct redeemed points
      if (redeemPoints > 0) {
        setCurrentUser(prev => prev ? { ...prev, loyaltyPoints: Math.max(0, (prev.loyaltyPoints || 0) - redeemPoints) } : null);
        setRedeemPoints(0);
      }
      setCart([]); setPlaced(paymentScreen.order); setPaymentScreen(null); setPage("confirm");
      showToast(txHash ? "Payment submitted! Verifying on-chain..." : "Payment confirmed! 🎉", "success");
    }
  }

  // ===== INVENTORY =====
  const addPurchaseRecord = (purchase: any) => setInventoryData(prev => ({ ...prev, purchases: [purchase, ...prev.purchases] }));
  const addDamageRecord = (damage: any) => setInventoryData(prev => ({ ...prev, damages: [damage, ...prev.damages] }));

  // ===== EXPENSES =====
  function addExpense() {
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.description || !amount || amount <= 0) { showToast("Fill expense details", "error"); return; }
    const exp: Expense = { id: generateId(), date: new Date().toISOString(), category: expenseForm.category, description: expenseForm.description, amount };
    setExpenses(prev => [exp, ...prev]);
    setExpenseForm({ category: "Transport", description: "", amount: "" });
    showToast("Expense recorded", "success");
  }

  // ===== CHAT =====
  function getOrCreateConversation(): Conversation {
    const custName = form.name || "Guest";
    const custPhone = form.phone || "N/A";
    let convo = conversations.find(c => c.status === "active" && c.customerName === custName);
    if (!convo) {
      convo = {
        id: generateId(), customerName: custName, customerPhone: custPhone,
        messages: [{ id: generateId(), conversationId: "", sender: "admin", text: "Hi! 👋 Welcome to NaijaBasket. How can we help you today?", timestamp: new Date().toISOString(), read: true }],
        status: "active", lastActivity: new Date().toISOString(), unreadCount: 0,
      };
      convo.messages[0].conversationId = convo.id;
      setConversations(prev => [convo!, ...prev]);
    }
    return convo;
  }

  function sendChatMessage(text: string) {
    if (!text.trim()) return;
    const convo = getOrCreateConversation();
    const msg: ChatMessage = { id: generateId(), conversationId: convo.id, sender: "customer", text: text.trim(), timestamp: new Date().toISOString(), read: false };
    setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, messages: [...c.messages, msg], lastActivity: msg.timestamp, unreadCount: c.unreadCount + 1 } : c));
    setChatInput("");
  }

  function sendAdminReply(convoId: string, text: string) {
    if (!text.trim()) return;
    const msg: ChatMessage = { id: generateId(), conversationId: convoId, sender: "admin", text: text.trim(), timestamp: new Date().toISOString(), read: true };
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, messages: [...c.messages, msg], lastActivity: msg.timestamp, unreadCount: 0 } : c));
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  // ===== ACCOUNTING HELPERS =====
  function getFilteredOrders(): Order[] {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.date);
      if (acctPeriod === "today") return d.toDateString() === now.toDateString();
      if (acctPeriod === "week") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
      if (acctPeriod === "month") { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
      return true;
    });
  }

  function getFilteredExpenses(): Expense[] {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (acctPeriod === "today") return d.toDateString() === now.toDateString();
      if (acctPeriod === "week") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
      if (acctPeriod === "month") { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
      return true;
    });
  }

  // ===== RECEIPT =====
  function downloadReceipt(order: Order) {
    const receipt = `
════════════════════════════════════════════
       🧺  N A I J A B A S K E T
    Your trusted foodstuff market, online
════════════════════════════════════════════

Receipt: ${order.id}
Date: ${new Date(order.date).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}

CUSTOMER
────────────────────────────────────────────
Name:    ${order.customer.name}
Phone:   ${order.customer.phone}
Address: ${order.customer.address}

ITEMS ORDERED
────────────────────────────────────────────
${order.items.map(i => `${i.name} — ${i.variant}\n  ${i.quantity} × ₦${i.unitPrice.toLocaleString()} = ₦${i.total.toLocaleString()}`).join("\n\n")}

────────────────────────────────────────────
Subtotal:      ₦${order.subtotal.toLocaleString()}
Delivery Fee:  ${order.deliveryFee === 0 ? "FREE (Aba)" : `₦${order.deliveryFee.toLocaleString()}`}
TOTAL:         ₦${order.total.toLocaleString()}

PAYMENT
────────────────────────────────────────────
Method: ${order.paymentMethod === "naira" ? "Paystack (Naira)" : "Cryptocurrency"}
Status: ${order.status.toUpperCase()}
${order.paymentRef ? `Reference: ${order.paymentRef}` : ""}${order.txHash ? `Tx Hash: ${order.txHash}` : ""}

════════════════════════════════════════════
  Thank you for shopping with NaijaBasket! 🧺
  Questions? WhatsApp: +234 815 924 2986
════════════════════════════════════════════
`;
    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `NaijaBasket-Receipt-${order.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  // ===== STYLES =====
  const V = {
    bg: "var(--bg-primary)", bgCard: "var(--bg-card)", bgSecondary: "var(--bg-secondary)",
    text: "var(--text-primary)", textMuted: "var(--text-muted)", textSecondary: "var(--text-secondary)",
    border: "var(--border-primary)", borderSubtle: "var(--border-subtle)",
    primary: "var(--color-primary)", primaryHover: "var(--color-primary-hover)",
    secondary: "var(--color-secondary)", accent: "var(--color-accent)",
    success: "var(--color-success)", danger: "var(--color-danger)", warning: "var(--color-warning)",
    shadowMd: "var(--shadow-md)",
  };

  // ===== ACCOUNTING COMPUTED =====
  const filteredOrders = getFilteredOrders();
  const filteredExpenses = getFilteredExpenses();
  const acctRevenue = filteredOrders.filter(o => o.status === "paid").reduce((s, o) => s + o.total, 0);
  const acctPending = filteredOrders.filter(o => o.status === "pending").reduce((s, o) => s + o.total, 0);
  const acctCOGS = inventoryData.purchases.reduce((s, p) => s + (p.totalCost || 0), 0);
  const acctDamages = inventoryData.damages.reduce((s, d) => s + (d.estimatedLoss || 0), 0);
  const acctExpenseTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const acctGrossProfit = acctRevenue - acctCOGS;
  const acctNetProfit = acctGrossProfit - acctExpenseTotal - acctDamages;
  const acctMargin = acctRevenue > 0 ? Math.round((acctGrossProfit / acctRevenue) * 100) : 0;
  const acctByCategory: Record<string, number> = {};
  filteredOrders.filter(o => o.status === "paid").forEach(o => {
    o.items.forEach(i => {
      const p = getProduct(i.productId);
      const cat = p?.category || "other";
      acctByCategory[cat] = (acctByCategory[cat] || 0) + i.total;
    });
  });

  return (
    <div style={{ minHeight: "100vh", background: V.bg, color: V.text, fontFamily: "var(--font-family)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes greenPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(45,106,79,0.4) } 50% { box-shadow: 0 0 0 8px rgba(45,106,79,0) } }
        @keyframes chatPulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.08) } }
        .nb-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        /* === Mobile Responsive === */
        .nb-nav-links { display: flex; align-items: center; gap: 16px; }
        .nb-hamburger { display: none; background: none; border: 1px solid var(--border-primary); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 18px; color: var(--text-primary); align-items: center; justify-content: center; }

        @media (max-width: 768px) {
          .nb-hamburger { display: flex !important; }
          .nb-nav-links { display: none !important; }
          .nb-cash-flow { grid-template-columns: 1fr !important; }
          .nb-pay-grid { grid-template-columns: 1fr !important; }
          .nb-sales-table { min-width: 700px; }
          .nb-crm-table { min-width: 600px; }
          .nb-msg-container { min-height: 400px !important; }
          .nb-msg-thread { flex-basis: 100% !important; min-width: 0 !important; }
          .nb-msg-list { max-width: 100% !important; flex-basis: 100% !important; }
          .nb-delivery-steps { gap: 2px !important; }
          .nb-delivery-label { font-size: 8px !important; }
          .nb-cart-item-info { min-width: 0 !important; }
          .nb-hero-badge { font-size: 11px !important; padding: 4px 8px !important; }
          .nb-admin-tabs { gap: 4px !important; }
          .nb-admin-tabs button { padding: 6px 10px !important; font-size: 12px !important; }
        }

        @media (max-width: 480px) {
          .nb-pkg-grid { grid-template-columns: 1fr !important; }
          .nb-product-grid { grid-template-columns: 1fr !important; }
          .nb-social-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .nb-trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .nb-hero-badges { flex-direction: column; gap: 4px !important; }
          .nb-hero-buttons { flex-direction: column; }
          .nb-hero-buttons button { width: 100%; }
        }

        @media (max-width: 360px) {
          .nb-product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: V.bgSecondary, borderBottom: `1px solid ${V.border}`,
        padding: "0 12px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(12px)", boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={() => setPage("shop")}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧺</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: V.text, letterSpacing: "0.3px" }}>NaijaBasket</div>
            <div style={{ fontSize: 9, color: V.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>Fresh foodstuffs · Aba</div>
          </div>
        </div>
        {/* Mobile: cart + hamburger always visible */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", cursor: "pointer", fontSize: 20 }} onClick={() => setPage("cart")}>
            🛒
            {cartCount > 0 && (
              <div style={{ position: "absolute", top: -8, right: -10, background: "var(--gradient-primary)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</div>
            )}
          </div>
          <button className="nb-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: "none" }}>{mobileMenuOpen ? "✕" : "☰"}</button>
        </div>
        {/* Desktop nav links (inline in nav bar) */}
        <div className="nb-nav-links">
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: `1px solid ${V.border}`, width: 36, height: 36, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: V.text }}>{darkMode ? "☀️" : "🌙"}</button>
          {["shop", "orders"].map(p => (
            <button key={p} onClick={() => { setPage(p); setMobileMenuOpen(false); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: page === p ? V.primary : V.textMuted, fontWeight: page === p ? 600 : 400, textTransform: "capitalize" }}>{p === "orders" ? "My Orders" : "Shop"}</button>
          ))}
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
              {isUserFullyVerified && <div onClick={() => { setShowReferralModal(true); setMobileMenuOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, background: "var(--bg-accent-subtle)", border: `1px solid var(--border-accent)`, borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 13 }}>⭐</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: V.primary }}>{userPoints}</span>
                <span style={{ fontSize: 10, color: V.textMuted }}>pts</span>
              </div>}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{currentUser.name?.charAt(0).toUpperCase()}</div>
              <div style={{ fontSize: 12, lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, color: V.text }}>{currentUser.name?.split(" ")[0]}</div>
                <button onClick={handleUserLogout} style={{ background: "none", border: "none", fontSize: 10, color: V.textMuted, cursor: "pointer", padding: 0 }}>Sign out</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setShowAuthModal(true); setAuthStep("choose"); setMobileMenuOpen(false); }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign Up</button>
          )}
          {adminAuth && <button onClick={() => { setPage("admin-dashboard"); setMobileMenuOpen(false); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: V.textMuted, fontWeight: 500 }}>👤 Admin</button>}
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div style={{ height: 64 }} />

      {/* Mobile menu - OUTSIDE nav to escape sticky stacking context */}
      {mobileMenuOpen && (
        <>
          <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 998 }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{ position: "fixed", top: 64, left: 0, right: 0, background: V.bgSecondary, zIndex: 999, padding: 16, display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${V.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", animation: "slideUp 0.25s ease", maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>
            <button onClick={() => { setDarkMode(!darkMode); setMobileMenuOpen(false); }} style={{ background: "none", border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: V.text, width: "100%", textAlign: "left" }}>{darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
            {["shop", "orders"].map(p => (
              <button key={p} onClick={() => { setPage(p); setMobileMenuOpen(false); }} style={{ background: "none", border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontSize: 15, color: page === p ? V.primary : V.textMuted, fontWeight: page === p ? 600 : 400, textTransform: "capitalize", width: "100%", textAlign: "left" }}>{p === "orders" ? "📦 My Orders" : "🛒 Shop"}</button>
            ))}
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap" as const }}>
                {isUserFullyVerified && <div onClick={() => { setShowReferralModal(true); setMobileMenuOpen(false); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, background: "var(--bg-accent-subtle)", border: `1px solid var(--border-accent)`, borderRadius: 8, padding: "4px 10px" }}>
                  <span style={{ fontSize: 13 }}>⭐</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: V.primary }}>{userPoints}</span>
                  <span style={{ fontSize: 10, color: V.textMuted }}>pts</span>
                </div>}
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{currentUser.name?.charAt(0).toUpperCase()}</div>
                <div style={{ fontSize: 13, lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, color: V.text }}>{currentUser.name?.split(" ")[0]}</div>
                  <button onClick={() => { handleUserLogout(); setMobileMenuOpen(false); }} style={{ background: "none", border: "none", fontSize: 11, color: V.textMuted, cursor: "pointer", padding: 0 }}>Sign out</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setAuthStep("choose"); setMobileMenuOpen(false); }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left", margin: "4px 0" }}>✨ Sign Up</button>
            )}
            {adminAuth && <button onClick={() => { setPage("admin-dashboard"); setMobileMenuOpen(false); }} style={{ background: "none", border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer", fontSize: 15, color: V.textMuted, fontWeight: 500, width: "100%", textAlign: "left" }}>👤 Admin Dashboard</button>}
          </div>
        </>
      )}

      {/* ===== TOASTS ===== */}
      <div style={{ position: "fixed", top: 80, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: "12px 20px", borderRadius: 10, background: t.type === "success" ? "var(--color-success)" : t.type === "error" ? "var(--color-danger)" : "var(--color-secondary)", color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "var(--shadow-lg)", animation: "slideInRight 0.3s ease", display: "flex", alignItems: "center", gap: 8, maxWidth: 350 }}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"} {t.message}
          </div>
        ))}
      </div>

      {/* ===== SHOP PAGE ===== */}
      {page === "shop" && (
        <Shop
          products={products}
          categories={CATEGORIES}
          packages={PACKAGES}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          cart={cart}
          cartCount={cartCount}
          cartTotal={cartSubtotal}
          onAddToCart={addToCart}
          onAddPackage={addPackageToCart}
          onEditPackage={(pkg) => setEditingPackage({ pkg, items: pkg.items.map(i => ({ ...i })) })}
          onNavigate={setPage}
          darkMode={darkMode}
          calcPackagePrice={(pkg) => calcPackagePrice(pkg, products)}
          isPackageAvailable={(pkg) => isPackageAvailable(pkg, products)}
          showToast={showToast}
          flashDeal={flashDeal}
          dealCountdown={dealCountdown}
          getProductRating={getProductRating}
          onReview={(productId) => setReviewModal({ productId, rating: 0, comment: "" })}
          currentUser={currentUser}
        />
      )}

      {/* ===== CART PAGE ===== */}
      {page === "cart" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: V.text }}>🧺 Your Basket</h2>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: V.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🧺</div>
              <p style={{ fontSize: 16, marginBottom: 12 }}>Your basket is empty</p>
              <button onClick={() => setPage("shop")} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Start Shopping →</button>
            </div>
          ) : (
            <>
              {cart.map(c => {
                const p = getProduct(c.productId); if (!p) return null;
                const v = getVariant(p, c.variantId); if (!v) return null;
                return (
                  <div key={`${c.productId}-${c.variantId}`} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 12, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                    <div className="nb-cart-item-info" style={{ flex: 1, minWidth: 140 }}>
                      {c.packageLabel && <div style={{ fontSize: 11, color: V.primary, fontWeight: 600, marginBottom: 4 }}>📦 {c.packageLabel}</div>}
                      <div style={{ fontWeight: 600, color: V.text, marginBottom: 2 }}>{p.img} {p.name}</div>
                      <div style={{ fontSize: 13, color: V.textMuted }}>{v.size} ({v.unit})</div>
                      <div style={{ color: V.primary, fontWeight: 700, marginTop: 4 }}>₦{(v.price * c.quantity).toLocaleString()}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => updateCartQty(c.productId, c.variantId, -1)} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 8, width: 36, height: 36, fontWeight: 700, fontSize: 16, cursor: "pointer", color: V.text, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{c.quantity}</span>
                      <button onClick={() => updateCartQty(c.productId, c.variantId, 1)} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 8, width: 36, height: 36, fontWeight: 700, fontSize: 16, cursor: "pointer", color: V.text, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      <button onClick={() => removeFromCart(c.productId, c.variantId)} style={{ background: "var(--color-danger-bg)", border: "none", borderRadius: 8, width: 36, height: 36, fontSize: 14, cursor: "pointer", color: V.danger, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  </div>
                );
              })}
              {/* Totals */}
              <div style={{ background: "var(--bg-accent-subtle)", border: `1px solid var(--border-accent)`, borderRadius: 12, padding: 16, marginBottom: 20, marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}><span style={{ color: V.textSecondary }}>Subtotal</span><span style={{ fontWeight: 600 }}>₦{cartSubtotal.toLocaleString()}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}><span style={{ color: V.textSecondary }}>Delivery Fee</span><span style={{ fontWeight: 600, color: deliveryFee === 0 ? V.success : V.text }}>{deliveryFee === 0 ? "FREE (Aba)" : `₦${deliveryFee.toLocaleString()}`}</span></div>
                {/* Loyalty Points Redemption */}
                {isUserFullyVerified && userPoints > 0 && (
                  <div style={{ background: V.bgSecondary, borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: `1px solid ${V.borderSubtle}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: V.textSecondary }}>⭐ Use Loyalty Points</span>
                      <span style={{ fontSize: 12, color: V.textMuted }}>{userPoints} pts available</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="range" min={0} max={Math.min(userPoints, cartSubtotal)} value={redeemPoints} onChange={e => setRedeemPoints(Number(e.target.value))} style={{ flex: 1, accentColor: "var(--color-primary)" }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: V.primary, minWidth: 60, textAlign: "right" }}>-₦{pointsDiscount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {pointsDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}><span style={{ color: V.success }}>⭐ Points Discount</span><span style={{ fontWeight: 600, color: V.success }}>-₦{pointsDiscount.toLocaleString()}</span></div>}
                <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, fontSize: 16 }}>Total</span><span style={{ fontWeight: 800, fontSize: 20, color: V.primary }}>₦{(cartTotal - pointsDiscount).toLocaleString()}</span></div>
                {cartSubtotal < MIN_ORDER && <div style={{ marginTop: 8, fontSize: 13, color: V.warning, fontWeight: 500 }}>⚠️ Minimum order: ₦{MIN_ORDER.toLocaleString()}. Add ₦{(MIN_ORDER - cartSubtotal).toLocaleString()} more.</div>}
              </div>
              <div style={{ background: "var(--color-info-bg)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: V.textSecondary, marginBottom: 20 }}>🚚 Within Aba: <strong>FREE delivery</strong>. Outside Aba: ₦2,500.</div>
              {/* Checkout form */}
              <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: V.text }}>Delivery & Payment</h3>
                {[
                  { label: "Full Name", key: "name", placeholder: "e.g. Chukwuemeka Obi" },
                  { label: "Phone Number", key: "phone", placeholder: "e.g. 08012345678" },
                  { label: "Email (optional)", key: "email", placeholder: "e.g. your@email.com" },
                  { label: "Delivery Address", key: "address", placeholder: "e.g. 12 Faulks Road, Aba" },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: V.textMuted, marginBottom: 6, display: "block" }}>{field.label}</label>
                    <input style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 14px", color: V.text, fontSize: 15, outline: "none" }} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} />
                  </div>
                ))}
                <label style={{ fontSize: 13, color: V.textMuted, marginBottom: 8, display: "block" }}>Payment Method</label>
                <div className="nb-pay-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.id} onClick={() => setForm(f => ({ ...f, payment: pm.id }))} style={{ background: form.payment === pm.id ? "var(--bg-accent-muted)" : V.bgCard, border: `2px solid ${form.payment === pm.id ? V.primary : V.border}`, borderRadius: 12, padding: "14px", cursor: "pointer", textAlign: "left" as const }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{pm.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: V.text }}>{pm.label}</div>
                      <div style={{ fontSize: 12, color: V.textMuted }}>{pm.desc}</div>
                    </button>
                  ))}
                </div>
                <button onClick={placeOrder} disabled={processing || cartSubtotal < MIN_ORDER} style={{ background: cartSubtotal < MIN_ORDER ? V.border : "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontWeight: 700, fontSize: 16, cursor: cartSubtotal < MIN_ORDER ? "not-allowed" : "pointer", width: "100%", boxShadow: "var(--shadow-accent)", opacity: processing ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {processing ? "Processing..." : `Place Order — ₦${cartTotal.toLocaleString()}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== ORDER CONFIRMATION ===== */}
      {page === "confirm" && placed && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 20, padding: 32, textAlign: "center", animation: "slideUp 0.5s ease" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: V.primary, marginBottom: 6 }}>Order Placed!</h2>
            <p style={{ color: V.textMuted, marginBottom: 24, fontSize: 14 }}>Order ID: <strong style={{ color: V.text }}>{placed.id}</strong></p>
            <div style={{ textAlign: "left", background: V.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              {placed.items.map((i, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: V.textSecondary }}>{i.name} × {i.quantity}</span>
                  <span style={{ color: V.primary, fontWeight: 600 }}>₦{i.total.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 10, marginTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>Total</span><span style={{ color: V.primary }}>₦{placed.total.toLocaleString()}</span></div>
            </div>
            <div style={{ background: "var(--color-success-bg)", border: `1px solid var(--border-accent)`, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "left" }}>
              <p style={{ fontSize: 14, color: V.textSecondary, lineHeight: 1.6, margin: 0 }}>🧺 <strong>Thank you for shopping with NaijaBasket!</strong><br />Your foodstuffs are being prepared. WhatsApp us at <strong style={{ color: V.primary }}>+234 815 924 2986</strong></p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
              <button onClick={() => downloadReceipt(placed)} style={{ flex: 1, background: "var(--gradient-secondary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer", minWidth: 140 }}>📄 Receipt</button>
              <button onClick={() => { setPage("shop"); setPlaced(null); }} style={{ flex: 1, background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer", minWidth: 100 }}>🛒 Shop More</button>
              <button onClick={() => setPage("orders")} style={{ flex: 1, background: V.bgCard, color: V.text, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer", minWidth: 100 }}>📦 Orders</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MY ORDERS ===== */}
      {page === "orders" && (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>📦 My Orders</h2>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: V.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <p style={{ fontSize: 16, marginBottom: 12 }}>No orders yet</p>
              <button onClick={() => setPage("shop")} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>Place your first order →</button>
            </div>
          ) : orders.map(o => {
            const deliverySteps = ["preparing", "packed", "dispatched", "in_transit", "delivered"];
            const currentStep = deliverySteps.indexOf(o.deliveryStatus);
            return (
              <div key={o.id} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" as const, gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: V.text, fontSize: 15 }}>{o.id}</div>
                    <div style={{ color: V.textMuted, fontSize: 12, marginTop: 2 }}>{new Date(o.date).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                  <span style={{ background: `${o.status === "paid" ? V.success : V.warning}20`, color: o.status === "paid" ? V.success : V.warning, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{o.status}</span>
                </div>
                {o.items.map((i, idx) => (
                  <div key={idx} style={{ fontSize: 13, color: V.textSecondary, marginBottom: 3 }}>{i.name} × {i.quantity} — <span style={{ color: V.primary, fontWeight: 600 }}>₦{i.total.toLocaleString()}</span></div>
                ))}
                <div className="nb-delivery-steps" style={{ marginTop: 14, display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 4 }}>
                  {deliverySteps.map((step, idx) => (
                    <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: idx <= currentStep ? V.primary : V.border, color: idx <= currentStep ? "#fff" : V.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, animation: idx === currentStep ? "greenPulse 2s infinite" : "none" }}>{idx <= currentStep ? "✓" : idx + 1}</div>
                      <div className="nb-delivery-label" style={{ fontSize: 9, color: idx <= currentStep ? V.primary : V.textMuted, marginTop: 3, textAlign: "center", textTransform: "capitalize", wordBreak: "break-word" as const, lineHeight: 1.2 }}>{step.replace("_", " ")}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${V.border}`, paddingTop: 12, marginTop: 12, flexWrap: "wrap" as const, gap: 8 }}>
                  <span style={{ fontWeight: 700, color: V.primary, fontSize: 16 }}>₦{o.total.toLocaleString()}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => downloadReceipt(o)} style={{ background: "var(--bg-accent-subtle)", color: V.primary, border: `1px solid var(--border-accent)`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📄 Receipt</button>
                    <button onClick={() => { o.items.forEach(i => addToCart(i.productId, i.variantId)); setPage("cart"); }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🔄 Re-order</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ADMIN LOGIN ===== */}
      {page === "admin-login" && (
        <div style={{ maxWidth: 400, margin: "60px auto", padding: "0 16px" }}>
          <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 20, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: V.primary, marginBottom: 24 }}>Admin Login</h2>
            {loginError && <div style={{ background: "var(--color-danger-bg)", color: V.danger, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>❌ {loginError}</div>}
            <input style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 14px", color: V.text, fontSize: 15, marginBottom: 12, outline: "none" }} type="email" placeholder="Admin email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
            <input style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 14px", color: V.text, fontSize: 15, marginBottom: 20, outline: "none" }} type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleAdminLogin()} />
            <button onClick={handleAdminLogin} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 16, cursor: "pointer", width: "100%", boxShadow: "var(--shadow-accent)" }}>Login</button>
          </div>
        </div>
      )}

      {/* ===== ADMIN DASHBOARD ===== */}
      {page === "admin-dashboard" && adminAuth && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: V.primary, margin: 0 }}>🧺 NaijaBasket Admin</h2>
              <p style={{ fontSize: 13, color: V.textMuted, margin: "4px 0 0" }}>Sales, Inventory, Accounting, CRM & Support</p>
            </div>
            <button onClick={handleAdminLogout} style={{ background: "var(--color-danger-bg)", color: V.danger, border: `1px solid ${V.danger}`, borderRadius: 10, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🚪 Logout</button>
          </div>

          {/* Admin tabs */}
          <div className="nb-admin-tabs" style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${V.border}`, paddingBottom: 12, overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as any }}>
            {([
              { key: "stats", label: "📊 Sales" },
              { key: "accounting", label: "📈 Accounting" },
              { key: "inventory", label: "📦 Inventory" },
              { key: "crm", label: "👥 CRM" },
              { key: "messages", label: `💬 Messages${totalUnread > 0 ? ` (${totalUnread})` : ""}` },
              { key: "audit", label: "🔍 Audit" },
              { key: "settings", label: "⚙️ Settings" },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setAdminView(tab.key as any)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: adminView === tab.key ? "var(--gradient-primary)" : "transparent", color: adminView === tab.key ? "#fff" : V.primary, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" as const, position: "relative" }}>{tab.label}</button>
            ))}
          </div>

          {/* ===== SALES TAB ===== */}
          {adminView === "stats" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
                {[
                  { label: "Total Revenue", value: `₦${orders.reduce((s, o) => s + o.total, 0).toLocaleString()}`, color: V.primary },
                  { label: "Total Orders", value: orders.length.toString(), color: V.secondary },
                  { label: "Pending", value: orders.filter(o => o.status === "pending").length.toString(), color: V.warning },
                  { label: "Completed", value: orders.filter(o => o.status === "paid").length.toString(), color: V.success },
                ].map((kpi, idx) => (
                  <div key={idx} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: V.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, margin: "8px 0" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: V.primary }}>Recent Orders</h3>
              {orders.length === 0 ? <p style={{ color: V.textMuted, textAlign: "center", padding: "40px 0" }}>No orders yet</p> : (
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
                  <table className="nb-sales-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead><tr>{["Order ID", "Customer", "Amount", "Payment", "Status", "Delivery", "Actions"].map(h => <th key={h} style={{ background: "var(--bg-accent-subtle)", padding: "12px 10px", textAlign: "left", fontWeight: 700, color: V.primary, fontSize: 12, borderBottom: `1px solid ${V.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 13, fontWeight: 600, color: V.primary }}>{o.id}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 13 }}>{o.customer.name}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 13, fontWeight: 700 }}>₦{o.total.toLocaleString()}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 12 }}><span style={{ background: o.paymentMethod === "naira" ? "var(--color-info-bg)" : "var(--color-success-bg)", color: o.paymentMethod === "naira" ? V.accent : V.success, padding: "2px 8px", borderRadius: 4 }}>{o.paymentMethod === "naira" ? "Paystack" : "Crypto"}</span></td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 12 }}><span style={{ background: o.status === "paid" ? "var(--color-success-bg)" : "var(--color-warning-bg)", color: o.status === "paid" ? V.success : V.warning, padding: "2px 8px", borderRadius: 4, fontWeight: 600, textTransform: "capitalize" }}>{o.status}</span></td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 12 }}>
                            <select value={o.deliveryStatus} onChange={e => { setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, deliveryStatus: e.target.value } : ord)); showToast(`Order ${o.id} → ${e.target.value.replace("_", " ")}`, "info"); }} style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: V.text, cursor: "pointer" }}>
                              {["preparing", "packed", "dispatched", "in_transit", "delivered"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}` }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              {o.status === "pending" && <button onClick={() => { setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: "paid" } : ord)); showToast(`Payment confirmed for ${o.id}`, "success"); }} style={{ background: V.success, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓ Confirm</button>}
                              <button onClick={() => downloadReceipt(o)} style={{ background: "var(--bg-accent-subtle)", color: V.primary, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📄</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ===== ACCOUNTING TAB ===== */}
          {adminView === "accounting" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Period selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
                {(["today", "week", "month", "all"] as const).map(p => (
                  <button key={p} onClick={() => setAcctPeriod(p)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: acctPeriod === p ? "var(--gradient-primary)" : V.bgCard, color: acctPeriod === p ? "#fff" : V.textSecondary, fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{p === "all" ? "All Time" : p === "week" ? "This Week" : p === "month" ? "This Month" : "Today"}</button>
                ))}
              </div>

              {/* P&L Card */}
              <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: V.primary, marginBottom: 16 }}>💰 Profit & Loss Statement</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Revenue (Paid Orders)", value: acctRevenue, color: V.success, bold: false },
                    { label: "Less: Cost of Goods (COGS)", value: -acctCOGS, color: V.textMuted, bold: false },
                    { label: "Gross Profit", value: acctGrossProfit, color: V.primary, bold: true },
                    { label: "Less: Operating Expenses", value: -acctExpenseTotal, color: V.textMuted, bold: false },
                    { label: "Less: Damage Losses", value: -acctDamages, color: V.danger, bold: false },
                    { label: "Net Profit / Loss", value: acctNetProfit, color: acctNetProfit >= 0 ? V.success : V.danger, bold: true },
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.bold ? "10px 0" : "4px 0", borderTop: row.bold ? `1px solid ${V.border}` : "none" }}>
                      <span style={{ fontSize: 14, color: V.textSecondary, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                      <span style={{ fontSize: row.bold ? 20 : 14, fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.value < 0 ? "-" : ""}₦{Math.abs(row.value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Revenue", value: `₦${acctRevenue.toLocaleString()}`, sub: `${filteredOrders.filter(o => o.status === "paid").length} paid orders`, color: V.success },
                  { label: "Total Orders", value: filteredOrders.length.toString(), sub: `Avg: ₦${filteredOrders.length > 0 ? Math.round(acctRevenue / Math.max(filteredOrders.filter(o => o.status === "paid").length, 1)).toLocaleString() : 0}`, color: V.primary },
                  { label: "Gross Margin", value: `${acctMargin}%`, sub: acctMargin >= 30 ? "Healthy" : "Low margin", color: acctMargin >= 30 ? V.success : V.warning },
                  { label: "Outstanding", value: `₦${acctPending.toLocaleString()}`, sub: `${filteredOrders.filter(o => o.status === "pending").length} pending`, color: V.warning },
                ].map((card, idx) => (
                  <div key={idx} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: V.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: card.color, margin: "6px 0" }}>{card.value}</div>
                    <div style={{ fontSize: 11, color: V.textMuted }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cash Flow */}
              <div className="nb-cash-flow" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "var(--color-success-bg)", borderRadius: 14, padding: 18, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: V.success, fontWeight: 600, textTransform: "uppercase" }}>Money In</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: V.success, margin: "6px 0" }}>₦{acctRevenue.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: V.textMuted }}>Paystack: ₦{filteredOrders.filter(o => o.status === "paid" && o.paymentMethod === "naira").reduce((s, o) => s + o.total, 0).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: V.textMuted }}>Crypto: ₦{filteredOrders.filter(o => o.status === "paid" && o.paymentMethod === "crypto").reduce((s, o) => s + o.total, 0).toLocaleString()}</div>
                </div>
                <div style={{ background: "var(--color-danger-bg)", borderRadius: 14, padding: 18, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: V.danger, fontWeight: 600, textTransform: "uppercase" }}>Money Out</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: V.danger, margin: "6px 0" }}>₦{(acctCOGS + acctExpenseTotal + acctDamages).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: V.textMuted }}>COGS: ₦{acctCOGS.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: V.textMuted }}>Expenses: ₦{acctExpenseTotal.toLocaleString()}</div>
                </div>
                <div style={{ background: `${acctNetProfit >= 0 ? V.success : V.danger}10`, border: `1px solid ${acctNetProfit >= 0 ? V.success : V.danger}30`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: acctNetProfit >= 0 ? V.success : V.danger, fontWeight: 600, textTransform: "uppercase" }}>Net Cash Flow</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: acctNetProfit >= 0 ? V.success : V.danger, margin: "6px 0" }}>{acctNetProfit >= 0 ? "+" : "-"}₦{Math.abs(acctNetProfit).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: V.textMuted }}>{acctNetProfit >= 0 ? "📈 Profitable" : "📉 Loss"}</div>
                </div>
              </div>

              {/* Revenue by Category */}
              <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: V.primary, marginBottom: 14 }}>📊 Revenue by Category</h4>
                {Object.entries(acctByCategory).sort((a, b) => b[1] - a[1]).length === 0 ? (
                  <p style={{ color: V.textMuted, fontSize: 13, textAlign: "center" }}>No paid orders in this period</p>
                ) : Object.entries(acctByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                  const maxVal = Math.max(...Object.values(acctByCategory));
                  const catName = CATEGORIES.find(c => c.id === cat)?.name || cat;
                  const catIcon = CATEGORIES.find(c => c.id === cat)?.icon || "📦";
                  return (
                    <div key={cat} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: V.textSecondary }}>{catIcon} {catName}</span>
                        <span style={{ fontWeight: 700, color: V.primary }}>₦{val.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, background: V.bgSecondary, borderRadius: 4 }}>
                        <div style={{ height: "100%", background: "var(--gradient-primary)", borderRadius: 4, width: `${(val / maxVal) * 100}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accounts Receivable */}
              {filteredOrders.filter(o => o.status === "pending").length > 0 && (
                <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: V.warning, marginBottom: 14 }}>⏳ Accounts Receivable ({filteredOrders.filter(o => o.status === "pending").length} pending)</h4>
                  {filteredOrders.filter(o => o.status === "pending").map(o => (
                    <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 13 }}>
                      <div><span style={{ fontWeight: 600, color: V.primary }}>{o.id}</span><span style={{ color: V.textMuted, marginLeft: 8 }}>{o.customer.name}</span></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700 }}>₦{o.total.toLocaleString()}</span>
                        <button onClick={() => { setOrders(prev => prev.map(ord => ord.id === o.id ? { ...ord, status: "paid" } : ord)); showToast(`Payment confirmed for ${o.id}`, "success"); }} style={{ background: V.success, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓ Mark Paid</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expense Tracker */}
              <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: V.primary, marginBottom: 14 }}>📋 Record Expense</h4>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 12 }}>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 12px", color: V.text, fontSize: 13, flex: "1 1 120px" }}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 12px", color: V.text, fontSize: 13, flex: "2 1 180px", outline: "none" }} />
                  <input placeholder="Amount (₦)" type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 12px", color: V.text, fontSize: 13, flex: "1 1 100px", outline: "none" }} />
                  <button onClick={addExpense} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add</button>
                </div>
                {expenses.length > 0 && (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {expenses.slice(0, 15).map(e => (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${V.borderSubtle}`, fontSize: 13 }}>
                        <div><span style={{ color: V.textMuted }}>{new Date(e.date).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}</span><span style={{ marginLeft: 8, fontWeight: 500 }}>{e.category}</span><span style={{ marginLeft: 8, color: V.textMuted }}>{e.description}</span></div>
                        <span style={{ fontWeight: 700, color: V.danger }}>-₦{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== INVENTORY TAB ===== */}
          {adminView === "inventory" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" as const, gap: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: V.primary, margin: 0 }}>📦 Product & Inventory Management</h3>
                <button onClick={() => { setShowAddProduct(true); setNewProduct({ name: "", category: "grains", desc: "", variants: [{ size: "", unit: "", price: "", stock: "" }] }); }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add New Product</button>
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <div style={{ background: V.bgCard, border: `2px solid ${V.primary}`, borderRadius: 16, padding: 24, marginBottom: 20, animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: V.primary, margin: 0 }}>🆕 Add New Product</h4>
                    <button onClick={() => setShowAddProduct(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: V.textMuted }}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 12 }}>
                    <div style={{ flex: "2 1 200px" }}>
                      <label style={{ fontSize: 12, color: V.textMuted, display: "block", marginBottom: 4 }}>Product Name</label>
                      <input value={newProduct.name} onChange={e => setNewProduct(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Fresh Catfish" style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "10px 12px", color: V.text, fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ flex: "1 1 140px" }}>
                      <label style={{ fontSize: 12, color: V.textMuted, display: "block", marginBottom: 4 }}>Category</label>
                      <select value={newProduct.category} onChange={e => setNewProduct(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "10px 12px", color: V.text, fontSize: 14 }}>
                        {CATEGORIES.filter(c => !["soup-packs", "stew-packs", "home-packs", "all"].includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: "0 0 60px", textAlign: "center" }}>
                      <label style={{ fontSize: 12, color: V.textMuted, display: "block", marginBottom: 4 }}>Icon</label>
                      <div style={{ fontSize: 36, lineHeight: "44px" }}>{newProduct.name ? autoIcon(newProduct.name, newProduct.category) : "📦"}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: V.textMuted, display: "block", marginBottom: 4 }}>Description</label>
                    <input value={newProduct.desc} onChange={e => setNewProduct(f => ({ ...f, desc: e.target.value }))} placeholder="Short description" style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "10px 12px", color: V.text, fontSize: 14, outline: "none" }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: V.textMuted, display: "block", marginBottom: 8 }}>Variants (sizes & pricing)</label>
                    {newProduct.variants.map((v, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                        <input value={v.size} onChange={e => { const vs = [...newProduct.variants]; vs[idx] = { ...vs[idx], size: e.target.value }; setNewProduct(f => ({ ...f, variants: vs })); }} placeholder="Size (e.g. 1 kg)" style={{ flex: "1 1 100px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 10px", color: V.text, fontSize: 13, outline: "none" }} />
                        <input value={v.unit} onChange={e => { const vs = [...newProduct.variants]; vs[idx] = { ...vs[idx], unit: e.target.value }; setNewProduct(f => ({ ...f, variants: vs })); }} placeholder="Unit (e.g. 1kg)" style={{ flex: "1 1 80px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 10px", color: V.text, fontSize: 13, outline: "none" }} />
                        <input value={v.price} onChange={e => { const vs = [...newProduct.variants]; vs[idx] = { ...vs[idx], price: e.target.value }; setNewProduct(f => ({ ...f, variants: vs })); }} placeholder="Price (₦)" type="number" style={{ flex: "1 1 80px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 10px", color: V.text, fontSize: 13, outline: "none" }} />
                        <input value={v.stock} onChange={e => { const vs = [...newProduct.variants]; vs[idx] = { ...vs[idx], stock: e.target.value }; setNewProduct(f => ({ ...f, variants: vs })); }} placeholder="Stock" type="number" style={{ flex: "1 1 60px", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "8px 10px", color: V.text, fontSize: 13, outline: "none" }} />
                        {newProduct.variants.length > 1 && <button onClick={() => { const vs = newProduct.variants.filter((_, i) => i !== idx); setNewProduct(f => ({ ...f, variants: vs })); }} style={{ background: "var(--color-danger-bg)", color: V.danger, border: "none", borderRadius: 6, width: 28, height: 28, fontSize: 12, cursor: "pointer" }}>✕</button>}
                      </div>
                    ))}
                    <button onClick={() => setNewProduct(f => ({ ...f, variants: [...f.variants, { size: "", unit: "", price: "", stock: "" }] }))} style={{ background: "var(--bg-accent-subtle)", color: V.primary, border: `1px dashed ${V.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Add Variant</button>
                  </div>
                  <button onClick={() => {
                    if (!newProduct.name.trim()) { showToast("Product name is required", "error"); return; }
                    if (!newProduct.desc.trim()) { showToast("Description is required", "error"); return; }
                    const validVariants = newProduct.variants.filter(v => v.size && v.price && Number(v.price) > 0);
                    if (validVariants.length === 0) { showToast("Add at least one variant with size and price", "error"); return; }
                    const maxId = Math.max(...products.map(p => p.id), 0);
                    const newId = maxId + 1;
                    const icon = autoIcon(newProduct.name, newProduct.category);
                    const product: Product = {
                      id: newId,
                      name: newProduct.name.trim(),
                      category: newProduct.category,
                      desc: newProduct.desc.trim(),
                      img: icon,
                      variants: validVariants.map((v, i) => ({
                        id: `${newId}-${i}`,
                        size: v.size,
                        unit: v.unit || v.size,
                        price: Number(v.price),
                        stock: Number(v.stock) || 0,
                      })),
                      inStock: true,
                    };
                    setProducts(prev => [...prev, product]);
                    setShowAddProduct(false);
                    showToast(`${icon} ${product.name} added to catalog!`, "success");
                  }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
                    {newProduct.name ? `Add ${autoIcon(newProduct.name, newProduct.category)} ${newProduct.name}` : "Add Product"}
                  </button>
                </div>
              )}

              {/* Product Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {products.map(p => {
                  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                  const lowStock = p.variants.some(v => v.stock <= 10);
                  const isEditing = editingProductId === p.id;
                  return (
                    <div key={p.id} style={{ background: V.bgCard, border: `1px solid ${!p.inStock ? V.danger : lowStock ? V.warning : V.border}`, borderRadius: 14, padding: 16, opacity: p.inStock ? 1 : 0.65, transition: "all 0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{p.img} {p.name}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {!p.inStock && <span style={{ fontSize: 10, background: "var(--color-danger-bg)", color: V.danger, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>OUT OF STOCK</span>}
                          {p.inStock && lowStock && <span style={{ fontSize: 10, background: "var(--color-warning-bg)", color: V.warning, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>LOW</span>}
                          <button onClick={() => {
                            setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, inStock: !pr.inStock } : pr));
                            showToast(`${p.name} marked ${p.inStock ? "out of stock" : "available"}`, "info");
                          }} style={{ background: p.inStock ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: p.inStock ? V.success : V.danger, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            {p.inStock ? "✓ In Stock" : "✕ Unavailable"}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: V.textMuted, marginBottom: 10 }}>{p.desc}</div>
                      
                      {/* Variants with price editing */}
                      {p.variants.map(v => (
                        <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${V.borderSubtle}` }}>
                          <span style={{ color: v.stock <= 10 ? V.warning : V.textSecondary, flex: "1 1 auto" }}>{v.size} <span style={{ color: V.textMuted }}>({v.unit})</span></span>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: V.textMuted }}>₦</span>
                              <input type="number" defaultValue={v.price} onBlur={e => {
                                const newPrice = Number(e.target.value);
                                if (newPrice > 0) {
                                  setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, variants: pr.variants.map(vr => vr.id === v.id ? { ...vr, price: newPrice } : vr) } : pr));
                                }
                              }} style={{ width: 70, background: V.bg, border: `1px solid ${V.primary}`, borderRadius: 4, padding: "2px 6px", color: V.text, fontSize: 12, textAlign: "right", outline: "none" }} />
                              <span style={{ fontSize: 11, color: V.textMuted }}>stk:</span>
                              <input type="number" defaultValue={v.stock} onBlur={e => {
                                const newStock = Number(e.target.value);
                                if (newStock >= 0) {
                                  setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, variants: pr.variants.map(vr => vr.id === v.id ? { ...vr, stock: newStock } : vr) } : pr));
                                }
                              }} style={{ width: 50, background: V.bg, border: `1px solid ${V.primary}`, borderRadius: 4, padding: "2px 6px", color: V.text, fontSize: 12, textAlign: "right", outline: "none" }} />
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 12 }}>
                              <span style={{ fontWeight: 700, color: V.primary }}>₦{v.price.toLocaleString()}</span>
                              <span style={{ fontWeight: 600, color: v.stock <= 10 ? V.warning : V.textMuted }}>{v.stock} stk</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${V.borderSubtle}` }}>
                        <span style={{ fontSize: 12, color: V.textMuted }}>Total: {totalStock} units</span>
                        <button onClick={() => setEditingProductId(isEditing ? null : p.id)} style={{ background: isEditing ? V.success : "var(--bg-accent-subtle)", color: isEditing ? "#fff" : V.primary, border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          {isEditing ? "✓ Done" : "✏️ Edit Prices"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== CRM TAB ===== */}
          {adminView === "crm" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: V.primary, marginBottom: 16 }}>👥 Customer Management</h3>
              {(() => {
                const stats: Record<string, { name: string; phone: string; address: string; purchases: number; totalSpent: number; lastOrder: string }> = {};
                orders.forEach(o => { const key = o.customer.phone; if (!stats[key]) stats[key] = { name: o.customer.name, phone: o.customer.phone, address: o.customer.address, purchases: 0, totalSpent: 0, lastOrder: "" }; stats[key].purchases += 1; stats[key].totalSpent += o.total; stats[key].lastOrder = o.date; });
                const list = Object.values(stats).sort((a, b) => b.totalSpent - a.totalSpent);
                return list.length === 0 ? <p style={{ color: V.textMuted, textAlign: "center", padding: "40px 0" }}>No customers yet</p> : (
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
                    <table className="nb-crm-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead><tr>{["Name", "Phone", "Orders", "Total Spent", "Last Order"].map(h => <th key={h} style={{ background: "var(--bg-accent-subtle)", padding: "12px 10px", textAlign: "left", fontWeight: 700, color: V.primary, fontSize: 12 }}>{h}</th>)}</tr></thead>
                      <tbody>{list.map((c, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, color: V.textMuted, fontSize: 13 }}>{c.phone}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontWeight: 700, color: V.success }}>{c.purchases}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, fontWeight: 700, color: V.primary }}>₦{c.totalSpent.toLocaleString()}</td>
                          <td style={{ padding: "12px 10px", borderBottom: `1px solid ${V.borderSubtle}`, color: V.textMuted, fontSize: 12 }}>{new Date(c.lastOrder).toLocaleDateString()}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===== MESSAGES TAB ===== */}
          {adminView === "messages" && (
            <div className="nb-msg-container" style={{ display: "flex", gap: 16, minHeight: 500, flexWrap: "wrap" as const }}>
              {/* Conversation list */}
              <div className="nb-msg-list" style={{ flex: "1 1 260px", maxWidth: 320 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: V.primary, marginBottom: 12 }}>💬 Conversations</h3>
                {conversations.length === 0 ? <p style={{ color: V.textMuted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>No messages yet</p> :
                  conversations.map(c => (
                    <div key={c.id} onClick={() => setActiveConvoId(c.id)} style={{ background: activeConvoId === c.id ? "var(--bg-accent-subtle)" : V.bgCard, border: `1px solid ${activeConvoId === c.id ? V.primary : V.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: V.text }}>{c.customerName}</span>
                        {c.unreadCount > 0 && <span style={{ background: V.danger, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{c.unreadCount}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: V.textMuted, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.messages[c.messages.length - 1]?.text || "..."}</div>
                      <div style={{ fontSize: 10, color: V.textMuted, marginTop: 4 }}>{new Date(c.lastActivity).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ))
                }
              </div>
              {/* Chat thread */}
              <div className="nb-msg-thread" style={{ flex: "2 1 300px", background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {!activeConvoId ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: V.textMuted, fontSize: 14 }}>Select a conversation</div>
                ) : (() => {
                  const convo = conversations.find(c => c.id === activeConvoId);
                  if (!convo) return null;
                  return (
                    <>
                      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><span style={{ fontWeight: 700, fontSize: 15 }}>{convo.customerName}</span><span style={{ color: V.textMuted, fontSize: 12, marginLeft: 8 }}>{convo.customerPhone}</span></div>
                        <button onClick={() => setConversations(prev => prev.map(c => c.id === activeConvoId ? { ...c, status: "resolved" } : c))} style={{ background: "var(--color-success-bg)", color: V.success, border: `1px solid ${V.success}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✓ Resolve</button>
                      </div>
                      <div style={{ flex: 1, padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                        {convo.messages.map(msg => (
                          <div key={msg.id} style={{ alignSelf: msg.sender === "admin" ? "flex-start" : "flex-end", maxWidth: "75%" }}>
                            <div style={{ background: msg.sender === "admin" ? V.bgSecondary : "var(--gradient-primary)", color: msg.sender === "admin" ? V.text : "#fff", borderRadius: 12, padding: "10px 14px", fontSize: 13 }}>{msg.text}</div>
                            <div style={{ fontSize: 10, color: V.textMuted, marginTop: 2, textAlign: msg.sender === "admin" ? "left" : "right" }}>{new Date(msg.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "12px 18px", borderTop: `1px solid ${V.border}`, display: "flex", gap: 8 }}>
                        <input id="admin-reply-input" placeholder="Type a reply..." style={{ flex: 1, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 8, padding: "10px 14px", color: V.text, fontSize: 13, outline: "none" }} onKeyDown={e => { if (e.key === "Enter") { const input = e.target as HTMLInputElement; sendAdminReply(activeConvoId!, input.value); input.value = ""; } }} />
                        <button onClick={() => { const input = document.getElementById("admin-reply-input") as HTMLInputElement; if (input?.value) { sendAdminReply(activeConvoId!, input.value); input.value = ""; } }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Send</button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ===== AUDIT TAB ===== */}
          {adminView === "audit" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: V.primary, marginBottom: 16 }}>🔍 Audit Trail</h3>
              <div style={{ background: "var(--bg-accent-subtle)", border: `1px solid var(--border-accent)`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: V.primary, marginBottom: 12 }}>📅 Today's Reconciliation</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                  {(() => {
                    const today = new Date().toDateString();
                    const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today);
                    const totalSales = todayOrders.reduce((s, o) => s + o.total, 0);
                    const totalPaid = todayOrders.filter(o => o.status === "paid").reduce((s, o) => s + o.total, 0);
                    const totalPending = todayOrders.filter(o => o.status === "pending").reduce((s, o) => s + o.total, 0);
                    const discrepancy = totalSales - totalPaid - totalPending;
                    return [
                      { label: "Orders Today", value: todayOrders.length.toString(), color: V.text },
                      { label: "Total Sales", value: `₦${totalSales.toLocaleString()}`, color: V.primary },
                      { label: "Confirmed Paid", value: `₦${totalPaid.toLocaleString()}`, color: V.success },
                      { label: "Pending", value: `₦${totalPending.toLocaleString()}`, color: V.warning },
                      { label: "Discrepancy", value: discrepancy === 0 ? "✅ Balanced" : `₦${Math.abs(discrepancy).toLocaleString()}`, color: discrepancy === 0 ? V.success : V.danger },
                    ].map((item, idx) => (
                      <div key={idx} style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: V.textMuted, textTransform: "uppercase" }}>{item.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.value}</div></div>
                    ));
                  })()}
                </div>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: V.primary, marginBottom: 12 }}>📋 Recent Activity</h4>
              {orders.slice(0, 20).map(o => (
                <div key={o.id} style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <div><span style={{ fontWeight: 600, color: V.primary }}>{o.id}</span><span style={{ color: V.textMuted, marginLeft: 8 }}>{o.customer.name}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontWeight: 700, color: V.primary }}>₦{o.total.toLocaleString()}</span><span style={{ fontSize: 11, color: V.textMuted }}>{new Date(o.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span></div>
                </div>
              ))}
            </div>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {adminView === "settings" && (
            <div style={{ maxWidth: 480 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: V.primary, marginBottom: 20 }}>⚙️ Admin Settings</h3>
              <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: V.text, marginBottom: 16 }}>🔑 Change Password</h4>
                {pwMsg && <div style={{ background: pwMsg.type === "success" ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: pwMsg.type === "success" ? V.success : V.danger, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14, fontWeight: 500 }}>{pwMsg.type === "success" ? "✅" : "❌"} {pwMsg.text}</div>}
                <input style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 14px", color: V.text, fontSize: 14, marginBottom: 10, outline: "none" }} type="password" placeholder="Current password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
                <input style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 14px", color: V.text, fontSize: 14, marginBottom: 10, outline: "none" }} type="password" placeholder="New password (min 6 chars)" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
                <input style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "12px 14px", color: V.text, fontSize: 14, marginBottom: 16, outline: "none" }} type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleChangePassword()} />
                <button onClick={handleChangePassword} disabled={pwLoading} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: pwLoading ? "wait" : "pointer", opacity: pwLoading ? 0.7 : 1 }}>{pwLoading ? "Changing..." : "Update Password"}</button>
              </div>
              <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: V.text, marginBottom: 12 }}>👤 Account Info</h4>
                <div style={{ fontSize: 13, color: V.textMuted, lineHeight: 2 }}>
                  <div><strong style={{ color: V.text }}>Role:</strong> Super Admin (Owner)</div>
                  <div><strong style={{ color: V.text }}>Email:</strong> {loginForm.email || "admin"}</div>
                  <div><strong style={{ color: V.text }}>Platform:</strong> NaijaBasket v1.0</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={{ textAlign: "center", color: V.textMuted, fontSize: 12, padding: "32px 16px", borderTop: `1px solid ${V.border}`, marginTop: 40, background: V.bgSecondary }}>
        <div style={{ marginBottom: 8 }}><strong style={{ color: V.primary }}>🧺 NaijaBasket</strong> — Your trusted foodstuff market, online.</div>
        <div>Based in Aba, Abia State · Delivers Nationwide · © {new Date().getFullYear()}</div>
        <div style={{ marginTop: 8, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" as const }}>
          <a href="tel:+2348034567890" style={{ color: V.primary, textDecoration: "none" }}>📱 +234 803 456 7890</a>
          <a href="https://wa.me/2348159242986" target="_blank" rel="noopener noreferrer" style={{ color: V.primary, textDecoration: "none" }}>💬 WhatsApp</a>
        </div>
      </footer>

      {/* ===== PACKAGE EDITOR MODAL ===== */}
      {editingPackage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, animation: "fadeIn 0.3s ease" }}>
          <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 20, maxWidth: 520, width: "92vw", maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "slideUp 0.4s ease" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: V.primary, margin: 0 }}>{editingPackage.pkg.icon} Customize: {editingPackage.pkg.name}</h3>
                <p style={{ fontSize: 12, color: V.textMuted, margin: "4px 0 0" }}>Adjust quantities, swap variants, or remove optional items</p>
              </div>
              <button onClick={() => setEditingPackage(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: V.textMuted }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {editingPackage.items.map((item, idx) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                const variant = product.variants.find(v => v.id === item.variantId);
                if (!variant) return null;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${V.borderSubtle}` }}>
                    <span style={{ fontSize: 20 }}>{product.img}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: V.text }}>{product.name} {item.required && <span style={{ fontSize: 10 }}>🔒</span>}</div>
                      <select value={item.variantId} onChange={e => {
                        const newItems = [...editingPackage.items];
                        newItems[idx] = { ...newItems[idx], variantId: e.target.value };
                        setEditingPackage({ ...editingPackage, items: newItems });
                      }} style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: V.text, marginTop: 4, cursor: "pointer" }}>
                        {product.variants.map(v => <option key={v.id} value={v.id}>{v.size} ({v.unit}) — ₦{v.price.toLocaleString()}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => { const newItems = [...editingPackage.items]; if (newItems[idx].quantity > 1) { newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity - 1 }; setEditingPackage({ ...editingPackage, items: newItems }); } }} style={{ background: V.bgSecondary, border: `1px solid ${V.border}`, borderRadius: 6, width: 28, height: 28, fontSize: 14, cursor: "pointer", color: V.text, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center", fontSize: 14 }}>{item.quantity}</span>
                      <button onClick={() => { const newItems = [...editingPackage.items]; newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + 1 }; setEditingPackage({ ...editingPackage, items: newItems }); }} style={{ background: V.bgSecondary, border: `1px solid ${V.border}`, borderRadius: 6, width: 28, height: 28, fontSize: 14, cursor: "pointer", color: V.text, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: V.primary, minWidth: 70, textAlign: "right" }}>₦{(variant.price * item.quantity).toLocaleString()}</span>
                    {!item.required && <button onClick={() => { const newItems = editingPackage.items.filter((_, i) => i !== idx); setEditingPackage({ ...editingPackage, items: newItems }); }} style={{ background: "var(--color-danger-bg)", border: "none", borderRadius: 6, width: 28, height: 28, fontSize: 12, cursor: "pointer", color: V.danger, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
                  </div>
                );
              })}
            </div>
            {/* Footer with total */}
            {(() => {
              const customPrice = calcPackagePrice({ ...editingPackage.pkg, items: editingPackage.items }, products);
              return (
                <div style={{ padding: "16px 24px", borderTop: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: V.textMuted }}>Custom Total</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: V.primary }}>₦{customPrice.discounted.toLocaleString()}</div>
                    {customPrice.savings > 0 && <div style={{ fontSize: 11, color: V.success, fontWeight: 600 }}>You save ₦{customPrice.savings.toLocaleString()}</div>}
                  </div>
                  <button onClick={() => addPackageToCart(editingPackage.pkg, editingPackage.items)} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "var(--shadow-accent)" }}>🧺 Add to Basket</button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {paymentScreen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, animation: "fadeIn 0.3s ease" }}>
          <div style={{ background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 20, padding: 28, maxWidth: 500, width: "90vw", maxHeight: "90vh", overflow: "auto", animation: "slideUp 0.4s ease", textAlign: "center" as const }}>
            {paymentScreen.type === "naira" ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: V.primary, marginBottom: 6 }}>Complete Payment</h3>
                <p style={{ color: V.textMuted, marginBottom: 20, fontSize: 14 }}>Redirecting to Paystack</p>
                <div style={{ background: "var(--bg-accent-subtle)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: V.textMuted, marginBottom: 4 }}>Total</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: V.primary }}>₦{paymentScreen.order.total.toLocaleString()}</div>
                </div>
                <button onClick={() => { if (paymentScreen.authUrl) window.location.href = paymentScreen.authUrl; }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", width: "100%", marginBottom: 10, boxShadow: "var(--shadow-accent)" }}>Proceed to Paystack 🔐</button>
                <button onClick={() => setPaymentScreen(null)} style={{ background: "transparent", color: V.textMuted, border: `1px solid ${V.border}`, borderRadius: 12, padding: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%" }}>Cancel</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: V.primary, marginBottom: 6 }}>Pay with Crypto</h3>
                <p style={{ color: V.textMuted, marginBottom: 20, fontSize: 14 }}>Send USDT, BNB, or ETH to the address below</p>
                <div style={{ background: timer > 300 ? "var(--color-success-bg)" : timer > 60 ? "var(--color-warning-bg)" : "var(--color-danger-bg)", borderRadius: 10, padding: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: V.textMuted }}>⏱️ Payment Deadline</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: timer > 300 ? V.success : timer > 60 ? V.warning : V.danger }}>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</div>
                </div>
                <div style={{ background: "var(--bg-accent-subtle)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: V.textMuted, marginBottom: 4 }}>Amount</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: V.primary }}>₦{paymentScreen.order.total.toLocaleString()}</div>
                </div>
                <div style={{ background: V.bg, border: `2px solid var(--border-accent)`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: V.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Merchant Wallet</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: V.primary, wordBreak: "break-all" as const, marginBottom: 12 }}>{paymentScreen.merchantAddress}</div>
                  <button onClick={() => { navigator.clipboard.writeText(paymentScreen.merchantAddress); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: copied ? "var(--color-success-bg)" : V.bgCard, color: copied ? V.success : V.primary, border: `1px solid ${copied ? V.success : V.border}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>{copied ? "✓ Copied!" : "📋 Copy Address"}</button>
                </div>
                <div style={{ marginBottom: 16, textAlign: "left" as const }}>
                  <label style={{ fontSize: 12, color: V.textMuted, marginBottom: 6, display: "block" }}>Transaction Hash</label>
                  <input id="txHashInput" style={{ width: "100%", background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "10px 12px", color: V.text, fontSize: 13, fontFamily: "monospace", outline: "none" }} placeholder="0x..." />
                </div>
                <button onClick={() => { const txHash = (document.getElementById("txHashInput") as HTMLInputElement)?.value; handlePaymentConfirmed(txHash || undefined); }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 16, cursor: "pointer", width: "100%", marginBottom: 10, boxShadow: "var(--shadow-accent)" }}>I've Sent Payment ✓</button>
                <button onClick={() => setPaymentScreen(null)} style={{ background: "transparent", color: V.textMuted, border: `1px solid ${V.border}`, borderRadius: 12, padding: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== FLOATING CHAT WIDGET ===== */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} style={{ position: "fixed", bottom: cartCount > 0 ? 80 : 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "var(--gradient-primary)", color: "#fff", border: "none", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 20px rgba(45,106,79,0.4)", zIndex: 99, animation: "chatPulse 3s ease-in-out infinite", display: "flex", alignItems: "center", justifyContent: "center" }}>
          💬
        </button>
      )}

      {chatOpen && (
        <div style={{ position: "fixed", bottom: cartCount > 0 ? 80 : 24, right: 24, width: 360, maxWidth: "calc(100vw - 32px)", height: 480, maxHeight: "calc(100vh - 120px)", background: V.bgCard, border: `1px solid ${V.border}`, borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.3)", zIndex: 99, display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease" }}>
          {/* Chat header */}
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${V.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "20px 20px 0 0", background: "var(--bg-accent-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🧺</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: V.text }}>NaijaBasket Support</div>
                <div style={{ fontSize: 11, color: V.success }}>● Online</div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: V.textMuted }}>✕</button>
          </div>

          {/* Chat tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${V.border}` }}>
            {(["chat", "whatsapp"] as const).map(tab => (
              <button key={tab} onClick={() => setChatTab(tab)} style={{ flex: 1, padding: "10px", border: "none", background: chatTab === tab ? V.bgCard : V.bgSecondary, fontWeight: 600, fontSize: 13, cursor: "pointer", color: chatTab === tab ? V.primary : V.textMuted, borderBottom: chatTab === tab ? `2px solid ${V.primary}` : "none" }}>
                {tab === "chat" ? "💬 Chat" : "📱 WhatsApp"}
              </button>
            ))}
          </div>

          {chatTab === "chat" ? (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  const convo = conversations.find(c => c.status === "active" && c.customerName === (form.name || "Guest"));
                  const msgs = convo?.messages || [{ id: "welcome", conversationId: "", sender: "admin" as const, text: "Hi! 👋 Welcome to NaijaBasket. How can we help you today?", timestamp: new Date().toISOString(), read: true }];
                  return msgs.map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.sender === "admin" ? "flex-start" : "flex-end", maxWidth: "80%" }}>
                      <div style={{ background: msg.sender === "admin" ? V.bgSecondary : "var(--gradient-primary)", color: msg.sender === "admin" ? V.text : "#fff", borderRadius: 14, padding: "10px 14px", fontSize: 13, lineHeight: 1.5 }}>{msg.text}</div>
                      <div style={{ fontSize: 10, color: V.textMuted, marginTop: 2, textAlign: msg.sender === "admin" ? "left" : "right" }}>{new Date(msg.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ));
                })()}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${V.border}`, display: "flex", gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { sendChatMessage(chatInput); } }} placeholder="Type a message..." style={{ flex: 1, background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10, padding: "10px 14px", color: V.text, fontSize: 13, outline: "none" }} />
                <button onClick={() => sendChatMessage(chatInput)} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>→</button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16, textAlign: "center" }}>
              <div style={{ fontSize: 48 }}>📱</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: V.text, margin: 0 }}>Chat on WhatsApp</h4>
              <p style={{ fontSize: 13, color: V.textMuted, lineHeight: 1.5, margin: 0 }}>Get quick support from our team. We respond within 30 minutes during business hours.</p>
              <div style={{ fontSize: 15, fontWeight: 600, color: V.primary }}>+234 803 456 7890</div>
              <a href="https://wa.me/2348159242986?text=Hi%20NaijaBasket!%20I%20need%20help%20with%20my%20order" target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", textDecoration: "none", display: "inline-block" }}>Open WhatsApp →</a>
              <div style={{ fontSize: 11, color: V.textMuted }}>Mon–Sat: 7am – 9pm</div>
            </div>
          )}
        </div>
      )}

      {/* ===== AUTH / SIGNUP MODAL ===== */}
      {showAuthModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: V.bgCard, borderRadius: 16, boxShadow: "var(--shadow-lg)", width: "90%", maxWidth: 420, padding: 32, position: "relative", border: `1px solid ${V.border}` }}>
            {/* Close button */}
            <button onClick={() => { resetAuthModal(); setPendingCartAction(null); }} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: V.textMuted }}>✕</button>

            {/* Step: Choose signup method */}
            {authStep === "choose" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧺</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: V.text, marginBottom: 4 }}>Welcome to NaijaBasket</h2>
                <p style={{ fontSize: 13, color: V.textMuted, marginBottom: 24, lineHeight: 1.5 }}>Sign up to start adding items to your basket. Your email and phone number will be verified with OTP.</p>
                
                <button onClick={handleGoogleLogin} disabled={authLoading} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: `1px solid ${V.border}`, background: V.bgSecondary, color: V.text, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, opacity: authLoading ? 0.6 : 1 }}>
                  <span style={{ fontSize: 20 }}>G</span> Continue with Gmail
                </button>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: V.border }} />
                  <span style={{ fontSize: 12, color: V.textMuted }}>or</span>
                  <div style={{ flex: 1, height: 1, background: V.border }} />
                </div>
                
                <button onClick={() => setAuthStep("signup")} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", background: "var(--gradient-primary)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  Sign up with Email & Phone
                </button>
                {authError && <p style={{ color: V.danger, fontSize: 13, marginTop: 12 }}>{authError}</p>}
              </div>
            )}

            {/* Step: Signup form */}
            {authStep === "signup" && (
              <div>
                <button onClick={() => setAuthStep("choose")} style={{ background: "none", border: "none", fontSize: 13, color: V.primary, cursor: "pointer", marginBottom: 12, padding: 0 }}>← Back</button>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: V.text, marginBottom: 4 }}>Create Account</h2>
                <p style={{ fontSize: 13, color: V.textMuted, marginBottom: 20 }}>We'll send OTP codes to verify both your email and phone.</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: V.textSecondary, marginBottom: 4, display: "block" }}>Full Name</label>
                    <input type="text" value={signupForm.name} onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))} placeholder="Enter your name" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${V.border}`, background: V.bg, color: V.text, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: V.textSecondary, marginBottom: 4, display: "block" }}>Email Address</label>
                    <input type="email" value={signupForm.email} onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${V.border}`, background: V.bg, color: V.text, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: V.textSecondary, marginBottom: 4, display: "block" }}>Phone Number</label>
                    <input type="tel" value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} placeholder="+234 8XX XXX XXXX" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${V.border}`, background: V.bg, color: V.text, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                </div>
                
                <button onClick={handleSignup} disabled={authLoading || !signupForm.name || !signupForm.email || !signupForm.phone} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", background: "var(--gradient-primary)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16, opacity: (authLoading || !signupForm.name || !signupForm.email || !signupForm.phone) ? 0.6 : 1 }}>
                  {authLoading ? "Creating account..." : "Create Account & Verify →"}
                </button>
                {authError && <p style={{ color: V.danger, fontSize: 13, marginTop: 12 }}>{authError}</p>}
              </div>
            )}

            {/* Step: Email OTP verification */}
            {authStep === "otp-email" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: V.text, marginBottom: 4 }}>Verify Your Email</h2>
                <p style={{ fontSize: 13, color: V.textMuted, marginBottom: 20 }}>Enter the 6-digit OTP sent to <strong>{otpTarget}</strong></p>
                {devOtp && <div style={{ background: V.bgSecondary, border: `1px dashed ${V.warning}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: V.warning }}>🛠️ Dev OTP: <strong>{devOtp}</strong></div>}
                
                <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} style={{ width: 180, padding: "14px 20px", borderRadius: 12, border: `2px solid ${V.primary}`, background: V.bg, color: V.text, fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: "center" }} />
                
                <button onClick={verifyOtp} disabled={authLoading || otpInput.length !== 6} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", background: "var(--gradient-primary)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16, opacity: (authLoading || otpInput.length !== 6) ? 0.6 : 1 }}>
                  {authLoading ? "Verifying..." : "Verify Email →"}
                </button>
                <button onClick={() => sendOtp("email", otpTarget)} style={{ background: "none", border: "none", fontSize: 13, color: V.primary, cursor: "pointer", marginTop: 12 }}>Resend OTP</button>
                {authError && <p style={{ color: V.danger, fontSize: 13, marginTop: 12 }}>{authError}</p>}
                
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: V.primary }} />
                  <div style={{ width: 24, height: 2, background: V.border }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: V.border }} />
                </div>
                <p style={{ fontSize: 11, color: V.textMuted, marginTop: 4 }}>Step 1 of 2: Email verification</p>
              </div>
            )}

            {/* Step: Phone OTP verification */}
            {authStep === "otp-phone" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: V.text, marginBottom: 4 }}>Verify Your Phone</h2>
                <p style={{ fontSize: 13, color: V.textMuted, marginBottom: 20 }}>Enter the 6-digit OTP sent to <strong>{otpTarget}</strong></p>
                {devOtp && <div style={{ background: V.bgSecondary, border: `1px dashed ${V.warning}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: V.warning }}>🛠️ Dev OTP: <strong>{devOtp}</strong></div>}
                
                <input type="text" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} style={{ width: 180, padding: "14px 20px", borderRadius: 12, border: `2px solid ${V.primary}`, background: V.bg, color: V.text, fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: "center" }} />
                
                <button onClick={verifyOtp} disabled={authLoading || otpInput.length !== 6} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", background: "var(--gradient-primary)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16, opacity: (authLoading || otpInput.length !== 6) ? 0.6 : 1 }}>
                  {authLoading ? "Verifying..." : "Verify Phone ✓"}
                </button>
                <button onClick={() => sendOtp("phone", otpTarget)} style={{ background: "none", border: "none", fontSize: 13, color: V.primary, cursor: "pointer", marginTop: 12 }}>Resend OTP</button>
                {authError && <p style={{ color: V.danger, fontSize: 13, marginTop: 12 }}>{authError}</p>}
                
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: V.success }} />
                  <div style={{ width: 24, height: 2, background: V.primary }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: V.primary }} />
                </div>
                <p style={{ fontSize: 11, color: V.textMuted, marginTop: 4 }}>Step 2 of 2: Phone verification</p>
              </div>
            )}

            {/* Step: Add phone (Google login users) */}
            {authStep === "add-phone" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: V.text, marginBottom: 4 }}>Add Your Phone Number</h2>
                <p style={{ fontSize: 13, color: V.textMuted, marginBottom: 20 }}>We need your phone number for delivery coordination and order updates.</p>
                
                <input type="tel" value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} placeholder="+234 8XX XXX XXXX" style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${V.border}`, background: V.bg, color: V.text, fontSize: 15, textAlign: "center", boxSizing: "border-box" }} />
                
                <button onClick={handleAddPhoneAndVerify} disabled={authLoading || !signupForm.phone} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", background: "var(--gradient-primary)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16, opacity: (authLoading || !signupForm.phone) ? 0.6 : 1 }}>
                  {authLoading ? "Sending OTP..." : "Verify Phone Number →"}
                </button>
                {authError && <p style={{ color: V.danger, fontSize: 13, marginTop: 12 }}>{authError}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== REVIEW MODAL ===== */}
      {reviewModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: V.bgCard, borderRadius: 16, boxShadow: "var(--shadow-lg)", width: "90%", maxWidth: 400, padding: 32, position: "relative", border: `1px solid ${V.border}` }}>
            <button onClick={() => setReviewModal(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: V.textMuted }}>✕</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>{getProduct(reviewModal.productId)?.img}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: V.text, margin: "0 0 4px" }}>{getProduct(reviewModal.productId)?.name}</h3>
              <p style={{ fontSize: 13, color: V.textMuted, marginBottom: 20 }}>Rate this product</p>
              
              {/* Star selector */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} onClick={() => setReviewModal(prev => prev ? { ...prev, rating: star } : null)}
                    style={{ fontSize: 32, cursor: "pointer", color: star <= reviewModal.rating ? "#F5A623" : V.border, transition: "transform 0.1s", transform: star <= reviewModal.rating ? "scale(1.1)" : "scale(1)" }}>★</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: V.textMuted, marginBottom: 12 }}>
                {reviewModal.rating === 0 ? "Tap a star" : ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewModal.rating]}
              </div>
              
              <textarea value={reviewModal.comment} onChange={e => setReviewModal(prev => prev ? { ...prev, comment: e.target.value } : null)}
                placeholder="Share your experience (optional)..." rows={3}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${V.border}`, background: V.bg, color: V.text, fontSize: 14, resize: "none", boxSizing: "border-box" }} />
              
              <button onClick={submitReview} disabled={reviewModal.rating === 0} style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", background: "var(--gradient-primary)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 12, opacity: reviewModal.rating === 0 ? 0.6 : 1 }}>
                Submit Review ⭐
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REFERRAL & LOYALTY MODAL ===== */}
      {showReferralModal && currentUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: V.bgCard, borderRadius: 16, boxShadow: "var(--shadow-lg)", width: "90%", maxWidth: 420, padding: 32, position: "relative", border: `1px solid ${V.border}` }}>
            <button onClick={() => setShowReferralModal(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: V.textMuted }}>✕</button>

            {/* Points summary */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: V.primary, margin: "0 0 4px" }}>{userPoints} Points</h2>
              <p style={{ fontSize: 13, color: V.textMuted, margin: 0 }}>Worth ₦{(userPoints * POINTS_VALUE).toLocaleString()} in discounts</p>
            </div>

            {/* How it works */}
            <div style={{ background: V.bgSecondary, borderRadius: 12, padding: "16px", marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: V.text, margin: "0 0 10px" }}>How Loyalty Points Work</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "🛒", text: "Earn 1 point per ₦100 spent" },
                  { icon: "💰", text: "1 point = ₦1 discount at checkout" },
                  { icon: "🎁", text: "Get 500 bonus points with a referral" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: V.textSecondary }}>
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Referral section */}
            <div style={{ borderTop: `1px solid ${V.border}`, paddingTop: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: V.text, margin: "0 0 8px" }}>🤝 Your Referral Code</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${V.border}`, background: V.bg, fontSize: 15, fontWeight: 700, color: V.primary, letterSpacing: "1px" }}>{currentUser.referralCode}</div>
                <button onClick={() => { navigator.clipboard.writeText(currentUser.referralCode); showToast("Referral code copied!", "success"); }} style={{ background: "var(--gradient-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Copy</button>
              </div>
              <p style={{ fontSize: 12, color: V.textMuted, margin: "0 0 16px" }}>Share this code — both you and your friend get 500 bonus points!</p>
              
              {/* Apply referral code */}
              {!currentUser.referredBy && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: V.text, margin: "0 0 8px" }}>🎫 Have a Referral Code?</h4>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" value={referralInput} onChange={e => setReferralInput(e.target.value.toUpperCase())} placeholder="NB-XXXX-XXXX" style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${V.border}`, background: V.bg, color: V.text, fontSize: 14, textTransform: "uppercase" }} />
                    <button onClick={() => applyReferralCode(referralInput)} disabled={!referralInput} style={{ background: V.accent, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: referralInput ? 1 : 0.5 }}>Apply</button>
                  </div>
                </>
              )}
              {currentUser.referredBy && (
                <div style={{ background: "var(--color-success-bg)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: V.success, fontWeight: 600 }}>✅ Referred by: {currentUser.referredBy}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
