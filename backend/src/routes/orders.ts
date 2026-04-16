import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { handleValidationErrors } from "../middleware/security";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import Logger from "../middleware/logger";

const router = Router();

// ============= VALIDATION SCHEMAS =============
const createOrderValidation = [
  body("items").isArray().withMessage("Items must be an array"),
  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("deliveryAddress")
    .trim()
    .notEmpty()
    .withMessage("Delivery address is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Address must be between 5 and 500 characters"),
  body("paymentMethod")
    .isIn(["naira", "btc", "usdt", "bnb", "xrp"])
    .withMessage("Invalid payment method"),
];

// ============= CREATE ORDER =============
router.post(
  "/",
  createOrderValidation,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { items, deliveryAddress, paymentMethod } = req.body;
    const userId = req.user!.id;

    // Validate minimum order requirement (1 crate minimum, no half crates)
    let totalCrates = 0;
    for (const item of items) {
      const productResult = await db.query(
        "SELECT id, price FROM products WHERE id = $1",
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new AppError(404, `Product ${item.productId} not found`);
      }

      totalCrates += item.quantity;
    }

    if (totalCrates < 1) {
      throw new AppError(400, "Minimum order is 1 crate");
    }

    // Create order within transaction
    const order = await db.transaction(async (client) => {
      const orderId = uuidv4();
      let orderTotal = 0;

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (id, user_id, delivery_address, payment_method, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         RETURNING id, user_id, created_at`,
        [orderId, userId, deliveryAddress, paymentMethod]
      );

      // Insert order items
      for (const item of items) {
        const productResult = await client.query(
          "SELECT id, price FROM products WHERE id = $1",
          [item.productId]
        );

        const product = productResult.rows[0];
        const itemTotal = product.price * item.quantity;
        orderTotal += itemTotal;

        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uuidv4(),
            orderId,
            item.productId,
            item.quantity,
            product.price,
            itemTotal,
          ]
        );
      }

      // Update order total
      await client.query(
        "UPDATE orders SET total = $1 WHERE id = $2",
        [orderTotal, orderId]
      );

      return orderResult.rows[0];
    });

    Logger.info("Order created successfully", {
      orderId: order.id,
      userId,
      totalCrates,
    });

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order.id,
        status: "pending",
        createdAt: order.created_at,
        deliveryAddress,
        paymentMethod,
      },
    });
  })
);

// ============= GET USER ORDERS =============
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await db.query(
      `SELECT id, delivery_address, payment_method, status, total, created_at
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      message: "Orders retrieved successfully",
      count: result.rows.length,
      orders: result.rows,
    });
  })
);

// ============= GET ORDER BY ID =============
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // Validate ID format
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new AppError(400, "Invalid order ID");
    }

    const result = await db.query(
      `SELECT id, delivery_address, payment_method, status, total, created_at
       FROM orders 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, "Order not found");
    }

    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.id, oi.product_id, p.name, oi.quantity, oi.unit_price, oi.total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.status(200).json({
      message: "Order retrieved successfully",
      order: {
        ...result.rows[0],
        items: itemsResult.rows,
      },
    });
  })
);

export default router;
