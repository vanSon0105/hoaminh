import { Router } from "express";

import healthRoutes from "./health.routes.js";
import productRoutes from "./product.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    name: "Hoa Minh API",
    version: "1.0.0"
  });
});

router.use("/health", healthRoutes);
router.use("/products", productRoutes);
router.use("/auth", authRoutes);

export default router;
