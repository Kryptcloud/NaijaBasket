import { Router, Request, Response } from "express";
import { db } from "../config/database";
import { optionalAuthMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// ============= GET ALL PRODUCTS =============
router.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await db.query(
      `SELECT id, name, description, price, size, eggs_per_crate, 
              image_url, is_active, created_at
       FROM products 
       WHERE is_active = true 
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      message: "Products retrieved successfully",
      count: result.rows.length,
      products: result.rows,
    });
  })
);

// ============= GET PRODUCT BY ID =============
router.get(
  "/:id",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate ID format (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    const result = await db.query(
      `SELECT id, name, description, price, size, eggs_per_crate, 
              image_url, is_active, stock, created_at
       FROM products 
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product retrieved successfully",
      product: result.rows[0],
    });
  })
);

export default router;
