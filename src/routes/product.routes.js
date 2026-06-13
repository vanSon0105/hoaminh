import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = Router();

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  return value === "true" || value === true;
};

const parseProductId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Invalid product id");
    error.statusCode = 400;
    throw error;
  }
  return id;
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, categoryId } = req.query;
    const featured = parseBoolean(req.query.featured);
    const active = parseBoolean(req.query.active);

    const products = await prisma.product.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { slug: { contains: q } },
                { description: { contains: q } },
                { material: { contains: q } },
                { origin: { contains: q } }
              ]
            }
          : {}),
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
        ...(featured === undefined ? {} : { isFeatured: featured }),
        ...(active === undefined ? {} : { isActive: active })
      },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc"
          }
        },
        variants: {
          where: { isActive: true },
          orderBy: {
            sortOrder: "asc"
          }
        }
      },
      orderBy: {
        id: "asc"
      }
    });

    res.json({
      success: true,
      data: products
    });
  })
);

router.get(
  "/:idOrSlug",
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const id = Number(idOrSlug);

    const product = await prisma.product.findFirst({
      where: Number.isInteger(id) ? { id } : { slug: idOrSlug },
      include: {
        category: true,
        images: {
          orderBy: {
            sortOrder: "asc"
          }
        },
        variants: {
          where: { isActive: true },
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: product
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description || null,
        material: req.body.material || null,
        origin: req.body.origin || null,
        note: req.body.note || null,
        imageUrl: req.body.imageUrl || null,
        isFeatured: Boolean(req.body.isFeatured),
        isActive: req.body.isActive ?? true,
        categoryId: req.body.categoryId || null
      }
    });

    res.status(201).json({
      success: true,
      data: product
    });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseProductId(req.params.id);
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        material: req.body.material,
        origin: req.body.origin,
        note: req.body.note,
        imageUrl: req.body.imageUrl,
        isFeatured: req.body.isFeatured,
        isActive: req.body.isActive,
        categoryId: req.body.categoryId
      }
    });

    res.json({
      success: true,
      data: product
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseProductId(req.params.id);
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  })
);

export default router;
