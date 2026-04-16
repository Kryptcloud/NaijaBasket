import { Router, Request, Response } from "express";
import { db } from "../config/database";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Protect all accounting routes with authentication
import { authMiddleware, adminMiddleware } from "../middleware/auth";
router.use(authMiddleware);

// ============================================================================
// SALES ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/sales
 * Fetch all sales with optional filters
 * Query params: start_date, end_date, product_id, customer_id, payment_status
 */
router.get("/sales", async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, product_id, customer_id, payment_status, limit = "50", offset = "0" } = req.query;

    let query = `
      SELECT 
        s.id, s.customer_id, s.product_id, s.quantity, s.unit_price,
        s.total_amount, s.payment_method, s.payment_status, s.sale_date,
        s.invoice_number, s.notes,
        c.name as customer_name, c.phone as customer_phone,
        p.name as product_name, p.unit
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN products p ON s.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND s.sale_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      query += ` AND s.sale_date <= $${paramIndex}`;
      params.push(`${end_date} 23:59:59`);
      paramIndex++;
    }
    if (product_id) {
      query += ` AND s.product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }
    if (customer_id) {
      query += ` AND s.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }
    if (payment_status) {
      query += ` AND s.payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;
    }

    query += ` ORDER BY s.sale_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sales" });
  }
});

/**
 * GET /api/admin/sales/summary
 * Return: total revenue, total units sold, total transactions, average order value
 */
router.get("/sales/summary", async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, product_id, customer_id, payment_status } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(quantity) as total_units_sold,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value
      FROM sales
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND sale_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      query += ` AND sale_date <= $${paramIndex}`;
      params.push(`${end_date} 23:59:59`);
      paramIndex++;
    }
    if (product_id) {
      query += ` AND product_id = $${paramIndex}`;
      params.push(product_id);
      paramIndex++;
    }
    if (customer_id) {
      query += ` AND customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }
    if (payment_status) {
      query += ` AND payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;
    }

    const result = await db.query(query, params);
    const summary = result.rows[0];

    res.json({
      success: true,
      data: {
        total_transactions: parseInt(summary.total_transactions) || 0,
        total_units_sold: parseInt(summary.total_units_sold) || 0,
        total_revenue: parseFloat(summary.total_revenue) || 0,
        average_order_value: parseFloat(summary.average_order_value) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sales summary" });
  }
});

/**
 * GET /api/admin/sales/daily
 * Return grouped daily totals for chart (last 30 days by default)
 */
router.get("/sales/daily", async (req: Request, res: Response) => {
  try {
    const { days = "30" } = req.query;

    const query = `
      SELECT 
        DATE(sale_date) as date,
        COUNT(*) as transaction_count,
        SUM(quantity) as units_sold,
        SUM(total_amount) as daily_revenue
      FROM sales
      WHERE sale_date >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY DATE(sale_date)
      ORDER BY date ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        date: row.date, // Will format on frontend
        transactions: parseInt(row.transaction_count),
        units: parseInt(row.units_sold),
        revenue: parseFloat(row.daily_revenue),
      })),
    });
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    res.status(500).json({ success: false, error: "Failed to fetch daily sales" });
  }
});

/**
 * POST /api/admin/sales
 * Record a new sale (auto-deduct from inventory)
 */
router.post("/sales", async (req: Request, res: Response) => {
  try {
    const { customer_id, product_id, quantity, unit_price, payment_method, payment_status = "paid", notes } = req.body;

    // Validate required fields
    if (!product_id || !quantity || !unit_price) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Start transaction
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Generate invoice number
      const invoiceNum = `INV-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

      // Insert sale
      const saleResult = await client.query(
        `INSERT INTO sales (customer_id, product_id, quantity, unit_price, payment_method, payment_status, invoice_number, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, total_amount, sale_date`,
        [customer_id || null, product_id, quantity, unit_price, payment_method, payment_status, invoiceNum, notes]
      );

      const sale = saleResult.rows[0];

      // Deduct from inventory
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [quantity, product_id]
      );

      // Log inventory change
      await client.query(
        `INSERT INTO inventory_log (product_id, change_type, quantity_change, reference_id, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [product_id, "sale", -quantity, sale.id, `Sale #${invoiceNum}`]
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        data: {
          id: sale.id,
          invoice_number: invoiceNum,
          total_amount: sale.total_amount,
          sale_date: sale.sale_date,
        },
      });

      // Emit real-time event (Socket.io)
      const io = (req.app as any).io;
      if (io) {
        io.emit("new_sale", {
          id: sale.id,
          customer_id,
          product_id,
          quantity,
          total_amount: sale.total_amount,
          payment_method,
          invoice_number: invoiceNum,
          sale_date: sale.sale_date,
        });
      }
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ success: false, error: "Failed to create sale" });
  }
});

// ============================================================================
// CUSTOMERS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/customers
 * List all customers with optional search
 */
router.get("/customers", async (req: Request, res: Response) => {
  try {
    const { q = "", limit = "100", offset = "0" } = req.query;

    let query = `
      SELECT id, name, phone, email, address, customer_type, notes, created_at
      FROM customers
      WHERE is_deleted = FALSE
    `;
    const params: any[] = [];

    if (q) {
      query += ` AND (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${q}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get sales count for each customer
    const customersWithStats = await Promise.all(
      result.rows.map(async (customer: any) => {
        const statsResult = await db.query(
          `SELECT COUNT(*) as purchase_count, SUM(total_amount) as total_spent, MAX(sale_date) as last_purchase
           FROM sales WHERE customer_id = $1`,
          [customer.id]
        );
        const stats = statsResult.rows[0];
        return {
          ...customer,
          purchase_count: parseInt(stats.purchase_count),
          total_spent: parseFloat(stats.total_spent) || 0,
          last_purchase: stats.last_purchase,
        };
      })
    );

    res.json({ success: true, data: customersWithStats });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ success: false, error: "Failed to fetch customers" });
  }
});

/**
 * POST /api/admin/customers
 * Add new customer
 */
router.post("/customers", async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, customer_type = "retail", notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Customer name is required" });
    }

    const result = await db.query(
      `INSERT INTO customers (name, phone, email, address, customer_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, phone, email, address, customer_type, created_at`,
      [name, phone || null, email || null, address || null, customer_type, notes || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ success: false, error: "Failed to create customer" });
  }
});

/**
 * PUT /api/admin/customers/:id
 * Update customer
 */
router.put("/customers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, customer_type, notes } = req.body;

    const result = await db.query(
      `UPDATE customers 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           customer_type = COALESCE($5, customer_type),
           notes = COALESCE($6, notes),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, phone, email, address, customer_type, notes`,
      [name, phone, email, address, customer_type, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ success: false, error: "Failed to update customer" });
  }
});

/**
 * DELETE /api/admin/customers/:id
 * Soft delete customer
 */
router.delete("/customers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE customers SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    res.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, error: "Failed to delete customer" });
  }
});

// ============================================================================
// PRODUCTS / INVENTORY ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/products
 * List all products with current stock
 */
router.get("/products", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, name, unit, unit_price, cost_per_unit, stock_quantity, low_stock_threshold, is_active
       FROM products
       WHERE is_active = TRUE
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        ...row,
        is_low_stock: row.stock_quantity <= row.low_stock_threshold,
      })),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

/**
 * GET /api/admin/inventory/low-stock
 * Products below threshold
 */
router.get("/inventory/low-stock", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, name, unit, stock_quantity, low_stock_threshold
       FROM products
       WHERE is_active = TRUE AND stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ success: false, error: "Failed to fetch low stock items" });
  }
});

/**
 * POST /api/admin/products
 * Add new product
 */
router.post("/products", async (req: Request, res: Response) => {
  try {
    const { name, unit, unit_price, cost_per_unit, low_stock_threshold = 10 } = req.body;

    if (!name || !unit || !unit_price) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const result = await db.query(
      `INSERT INTO products (name, unit, unit_price, cost_per_unit, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, unit, unit_price, cost_per_unit, stock_quantity, low_stock_threshold`,
      [name, unit, unit_price, cost_per_unit, low_stock_threshold]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, error: "Failed to create product" });
  }
});

/**
 * PUT /api/admin/products/:id/restock
 * Add inventory
 */
router.put("/products/:id/restock", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, note = "Manual restock" } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: "Invalid quantity" });
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING id, stock_quantity`,
        [quantity, id]
      );

      if (result.rows.length === 0) {
        throw new Error("Product not found");
      }

      await client.query(
        `INSERT INTO inventory_log (product_id, change_type, quantity_change, note) VALUES ($1, $2, $3, $4)`,
        [id, "restock", quantity, note]
      );

      await client.query("COMMIT");

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error restocking product:", error);
    res.status(500).json({ success: false, error: "Failed to restock product" });
  }
});

// ============================================================================
// INVOICE ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/invoices/:sale_id
 * Return invoice data for a specific sale
 */
router.get("/invoices/:sale_id", async (req: Request, res: Response) => {
  try {
    const { sale_id } = req.params;

    const result = await db.query(
      `SELECT 
        s.id, s.invoice_number, s.sale_date, s.quantity, s.unit_price, s.total_amount,
        s.payment_method, s.payment_status, s.notes,
        c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address,
        p.name as product_name, p.unit
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.id = $1`,
      [sale_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Sale not found" });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ success: false, error: "Failed to fetch invoice" });
  }
});

export default router;
