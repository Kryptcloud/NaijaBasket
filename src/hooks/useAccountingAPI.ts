import { useState, useCallback } from "react";

const API_BASE = "http://localhost:3000/api/admin/accounting";

export interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  payment_status: "paid" | "pending" | "overdue";
  sale_date: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  customer_type: string;
  purchase_count: number;
  total_spent: number;
  last_purchase: string;
}

export interface Product {
  id: number;
  name: string;
  unit: string;
  unit_price: number;
  cost_per_unit: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
}

export interface SalesSummary {
  total_transactions: number;
  total_units_sold: number;
  total_revenue: number;
  average_order_value: number;
}

export interface DailyRevenue {
  date: string;
  transactions: number;
  units: number;
  revenue: number;
}

export const useAccountingAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sales endpoints
  const fetchSales = useCallback(
    async (filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      customer_id?: number;
      payment_status?: string;
      limit?: number;
      offset?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);
      if (filters?.product_id) params.append("product_id", String(filters.product_id));
      if (filters?.customer_id) params.append("customer_id", String(filters.customer_id));
      if (filters?.payment_status) params.append("payment_status", filters.payment_status);
      if (filters?.limit) params.append("limit", String(filters.limit));
      if (filters?.offset) params.append("offset", String(filters.offset));

      const data = await makeRequest(`/sales?${params.toString()}`);
      return data.data as Sale[];
    },
    [makeRequest]
  );

  const fetchSalesSummary = useCallback(
    async (filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      customer_id?: number;
      payment_status?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);
      if (filters?.product_id) params.append("product_id", String(filters.product_id));
      if (filters?.customer_id) params.append("customer_id", String(filters.customer_id));
      if (filters?.payment_status) params.append("payment_status", filters.payment_status);

      const data = await makeRequest(`/sales/summary?${params.toString()}`);
      return data.data as SalesSummary;
    },
    [makeRequest]
  );

  const fetchDailySales = useCallback(
    async (days: number = 30) => {
      const data = await makeRequest(`/sales/daily?days=${days}`);
      return data.data as DailyRevenue[];
    },
    [makeRequest]
  );

  const createSale = useCallback(
    async (saleData: {
      customer_id?: number;
      product_id: number;
      quantity: number;
      unit_price: number;
      payment_method?: string;
      payment_status?: string;
      notes?: string;
    }) => {
      const data = await makeRequest("/sales", {
        method: "POST",
        body: JSON.stringify(saleData),
      });
      return data.data;
    },
    [makeRequest]
  );

  // Customer endpoints
  const fetchCustomers = useCallback(
    async (search?: string) => {
      const params = new URLSearchParams();
      if (search) params.append("q", search);

      const data = await makeRequest(`/customers?${params.toString()}`);
      return data.data as Customer[];
    },
    [makeRequest]
  );

  const createCustomer = useCallback(
    async (customerData: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      customer_type?: string;
      notes?: string;
    }) => {
      const data = await makeRequest("/customers", {
        method: "POST",
        body: JSON.stringify(customerData),
      });
      return data.data;
    },
    [makeRequest]
  );

  const updateCustomer = useCallback(
    async (
      id: number,
      customerData: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        customer_type?: string;
        notes?: string;
      }
    ) => {
      const data = await makeRequest(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(customerData),
      });
      return data.data;
    },
    [makeRequest]
  );

  // Product endpoints
  const fetchProducts = useCallback(async () => {
    const data = await makeRequest("/products");
    return data.data as Product[];
  }, [makeRequest]);

  const fetchLowStockProducts = useCallback(async () => {
    const data = await makeRequest("/inventory/low-stock");
    return data.data as Product[];
  }, [makeRequest]);

  const restockProduct = useCallback(
    async (productId: number, quantity: number, note?: string) => {
      const data = await makeRequest(`/products/${productId}/restock`, {
        method: "PUT",
        body: JSON.stringify({ quantity, note }),
      });
      return data.data;
    },
    [makeRequest]
  );

  // Invoice endpoints
  const fetchInvoice = useCallback(
    async (saleId: number) => {
      const data = await makeRequest(`/invoices/${saleId}`);
      return data.data;
    },
    [makeRequest]
  );

  return {
    loading,
    error,
    // Sales
    fetchSales,
    fetchSalesSummary,
    fetchDailySales,
    createSale,
    // Customers
    fetchCustomers,
    createCustomer,
    updateCustomer,
    // Products
    fetchProducts,
    fetchLowStockProducts,
    restockProduct,
    // Invoice
    fetchInvoice,
  };
};
