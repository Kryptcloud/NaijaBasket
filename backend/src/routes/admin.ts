import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/security";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import Logger from "../middleware/logger";

const router = Router();

// Apply admin check to all routes
router.use(adminMiddleware);

// ============= PRODUCT MANAGEMENT =============

// Create product
router.post(
  "/products",
  [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("price")
      .isInt({ min: 100 })
      .withMessage("Price must be at least 100 Naira"),
    body("size").isIn(["small", "medium"]).withMessage("Invalid size"),
    body("eggsPerCrate")
      .isInt({ min: 1 })
      .withMessage("Eggs per crate must be at least 1"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be non-negative"),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, price, size, eggsPerCrate, stock } = req.body;

    const productId = uuidv4();
    const result = await db.query(
      `INSERT INTO products (id, name, description, price, size, eggs_per_crate, stock, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING *`,
      [productId, name, description, price, size, eggsPerCrate, stock]
    );

    Logger.info("Product created", {
      productId,
      name,
      adminId: req.user!.id,
    });

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  })
);

// Update product
router.put(
  "/products/:id",
  [
    body("name").optional().trim().notEmpty(),
    body("price").optional().isInt({ min: 100 }),
    body("stock").optional().isInt({ min: 0 }),
    body("isActive").optional().isBoolean(),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates).map(
      (key, i) =>
        `${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = $${i + 1}`
    );
    const values = Object.values(updates);

    if (fields.length === 0) {
      throw new AppError(400, "No fields to update");
    }

    const result = await db.query(
      `UPDATE products 
       SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, "Product not found");
    }

    Logger.info("Product updated", {
      productId: id,
      adminId: req.user!.id,
      changes: Object.keys(updates),
    });

    res.status(200).json({
      message: "Product updated successfully",
      product: result.rows[0],
    });
  })
);

// Delete product (soft delete)
router.delete(
  "/products/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await db.query(
      "UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, "Product not found");
    }

    Logger.info("Product deleted (soft)", {
      productId: id,
      adminId: req.user!.id,
    });

    res.status(200).json({
      message: "Product deleted successfully",
    });
  })
);

// ============= ORDER MANAGEMENT =============

// Get all orders
router.get(
  "/orders",
  asyncHandler(async (req: Request, res: Response) => {
    const { status, limit = 50, offset = 0 } = req.query;

    let query =
      "SELECT id, user_id, delivery_address, status, total, created_at FROM orders";
    const params: any[] = [];

    if (status) {
      query += " WHERE status = $1";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1);
    query += " OFFSET $" + (params.length + 2);

    params.push(limit);
    params.push(offset);

    const result = await db.query(query, params);

    res.status(200).json({
      message: "Orders retrieved",
      count: result.rows.length,
      orders: result.rows,
    });
  })
);

// Update order status
router.patch(
  "/orders/:id/status",
  [
    body("status")
      .isIn(["pending", "paid", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid status"),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, "Order not found");
    }

    Logger.info("Order status updated", {
      orderId: id,
      newStatus: status,
      adminId: req.user!.id,
    });

    res.status(200).json({
      message: "Order status updated",
      order: result.rows[0],
    });
  })
);

// ============= ANALYTICS =============

// Get dashboard stats
router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const totalOrdersResult = await db.query(
      "SELECT COUNT(*) as count FROM orders"
    );
    const totalRevenueResult = await db.query(
      "SELECT SUM(total) as total FROM orders WHERE status = 'paid'"
    );
    const totalUsersResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'customer'"
    );
    const pendingOrdersResult = await db.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );

    res.status(200).json({
      message: "Admin stats retrieved",
      stats: {
        totalOrders: parseInt(totalOrdersResult.rows[0].count) || 0,
        totalRevenue: parseFloat(totalRevenueResult.rows[0].total) || 0,
        totalCustomers: parseInt(totalUsersResult.rows[0].count) || 0,
        pendingOrders: parseInt(pendingOrdersResult.rows[0].count) || 0,
      },
    });
  })
);

export default router;
