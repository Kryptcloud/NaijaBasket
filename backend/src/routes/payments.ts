import { Router, Request, Response } from "express";
import { body } from "express-validator";
import axios from "axios";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { handleValidationErrors, verifyWebhookSignature } from "../middleware/security";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import Logger from "../middleware/logger";

const router = Router();

// ============= PAYSTACK PAYMENT INITIALIZATION =============
router.post(
  "/paystack/initialize",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("email")
      .isEmail()
      .withMessage("Valid email is required"),
    body("amount")
      .isInt({ min: 100 })
      .withMessage("Amount must be at least 100 Naira"),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, email, amount } = req.body;
    const userId = req.user!.id;

    // Verify order belongs to user
    const orderResult = await db.query(
      "SELECT id, status FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, "Order not found");
    }

    if (orderResult.rows[0].status !== "pending") {
      throw new AppError(400, "Order cannot be paid at this stage");
    }

    try {
      // Initialize Paystack transaction
      const paystackResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amount * 100, // Paystack uses kobo
          metadata: {
            orderId,
            userId,
          },
          callback_url: `${process.env.API_URL}/api/payments/paystack/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!paystackResponse.data.status) {
        throw new Error("Paystack initialization failed");
      }

      // Store transaction reference
      await db.query(
        `INSERT INTO transactions (id, order_id, reference, provider, status, created_at)
         VALUES ($1, $2, $3, 'paystack', 'pending', NOW())`,
        [uuidv4(), orderId, paystackResponse.data.data.reference]
      );

      Logger.info("Paystack payment initialized", {
        orderId,
        reference: paystackResponse.data.data.reference,
      });

      res.status(200).json({
        message: "Payment initialized",
        data: {
          authorizationUrl: paystackResponse.data.data.authorization_url,
          accessCode: paystackResponse.data.data.access_code,
          reference: paystackResponse.data.data.reference,
        },
      });
    } catch (error: any) {
      Logger.error("Paystack initialization error", error);
      throw new AppError(500, "Failed to initialize payment");
    }
  })
);

// ============= PAYSTACK WEBHOOK VERIFICATION =============
router.post(
  "/paystack/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    try {
      const isValid = verifyWebhookSignature(
        payload,
        signature,
        process.env.PAYSTACK_WEBHOOK_SECRET || ""
      );

      if (!isValid) {
        Logger.warn("Invalid Paystack webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    } catch (error) {
      Logger.error("Webhook signature verification failed", error);
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;

    if (event === "charge.success") {
      const { reference, metadata } = data;

      // Update transaction status
      await db.query(
        `UPDATE transactions 
         SET status = 'completed', verified_at = NOW()
         WHERE reference = $1`,
        [reference]
      );

      // Update order status
      await db.query(
        `UPDATE orders 
         SET status = 'paid', paid_at = NOW()
         WHERE id = $1`,
        [metadata.orderId]
      );

      Logger.info("Payment verified via Paystack webhook", {
        reference,
        orderId: metadata.orderId,
      });
    }

    res.status(200).json({ message: "Webhook received" });
  })
);

// ============= CRYPTO PAYMENT (Placeholder) =============
router.post(
  "/crypto/initiate",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("walletAddress")
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage("Invalid wallet address"),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, walletAddress } = req.body;
    const userId = req.user!.id;

    // Verify order
    const orderResult = await db.query(
      `SELECT id, total, payment_method FROM orders 
       WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, "Order not found");
    }

    const order = orderResult.rows[0];

    // Create crypto payment request
    const paymentId = uuidv4();
    // Multichain wallet address - works on Ethereum, BSC, Polygon, etc.
    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS;

    if (!merchantAddress) {
      throw new AppError(500, "Merchant wallet not configured");
    }

    await db.query(
      `INSERT INTO transactions (id, order_id, provider, status, metadata, created_at)
       VALUES ($1, $2, $3, 'pending', $4, NOW())`,
      [
        paymentId,
        orderId,
        "crypto",
        JSON.stringify({
          fromAddress: walletAddress,
          toAddress: merchantAddress,
          method: order.payment_method,
          amount: order.total,
          supportedNetworks: ["Ethereum", "BSC", "Polygon", "Arbitrum"],
        }),
      ]
    );

    Logger.info("Crypto payment initiated", {
      orderId,
      paymentId,
      method: order.payment_method,
    });

    res.status(201).json({
      message: "Crypto payment request created",
      data: {
        paymentId,
        merchantAddress,
        amount: order.total,
        currency: order.payment_method.toUpperCase(),
        orderId,
        supportedNetworks: ["Ethereum", "BSC", "Polygon", "Arbitrum"],
      },
    });
  })
);

// ============= GET PAYMENT STATUS =============
router.get(
  "/:orderId/status",
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.id;

    // Verify order belongs to user
    const orderResult = await db.query(
      `SELECT id, status, total, payment_method, paid_at 
       FROM orders 
       WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, "Order not found");
    }

    res.status(200).json({
      message: "Payment status retrieved",
      data: orderResult.rows[0],
    });
  })
);

export default router;
