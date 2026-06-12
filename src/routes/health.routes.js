import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    let database = "ok";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      database = "error";
    }

    res.json({
      success: true,
      status: "ok",
      database,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;
