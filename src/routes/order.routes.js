import { Router } from "express";

import { optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { sendOrderEmail } from "../lib/mailer.js";

const router = Router();

const createOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.floor(100 + Math.random() * 900);
  return `HM${timestamp}${suffix}`;
};

const toPositiveInt = (value, fallback = 1) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const toPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const requireText = (value, message) => {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
};

const normalizePhone = (phone) => String(phone || "").replace(/[\s.-]/g, "");

const requirePhone = (value) => {
  const phone = normalizePhone(value);
  if (!/^0\d{9}$/.test(phone)) {
    const error = new Error("Số điện thoại phải gồm 10 số và bắt đầu bằng 0");
    error.statusCode = 400;
    throw error;
  }

  return phone;
};

const normalizeItems = (items = []) => {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error("Giỏ hàng đang trống");
    error.statusCode = 400;
    throw error;
  }

  return items.map((item, index) => {
    const productName = requireText(item.name || item.productName, `Sản phẩm ${index + 1} thiếu tên`);
    const quantity = toPositiveInt(item.quantity);
    const unitPrice = toPrice(item.price || item.unitPrice);
    const productId = Number(item.productId || item.id);

    return {
      productId: Number.isInteger(productId) && productId > 0 ? productId : null,
      productName,
      productSize: typeof item.size === "string" && item.size.trim() ? item.size.trim() : null,
      engravingText:
        typeof item.engravingText === "string" && item.engravingText.trim()
          ? item.engravingText.trim()
          : null,
      isPersonalized: item.isPersonalized === true || item.personalized === true,
      quantity,
      unitPrice
    };
  });
};

router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const customer = req.body.customer || {};
    const customerName = requireText(customer.name || req.body.name, "Tên khách hàng là bắt buộc");
    const phone = requirePhone(customer.phone || req.body.phone);
    const address = requireText(customer.address || req.body.address, "Địa chỉ là bắt buộc");
    const noteParts = [];
    const customerNote = customer.note || req.body.note;
    const deliveryTime = customer.time || req.body.time;
    if (typeof customerNote === "string" && customerNote.trim()) noteParts.push(customerNote.trim());
    if (typeof deliveryTime === "string" && deliveryTime.trim()) {
      noteParts.push(`Thời gian nhận hàng: ${deliveryTime.trim()}`);
    }

    const items = normalizeItems(req.body.items);
    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
    if (productIds.length) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: { size: true, price: true }
          }
        }
      });
      const existingIds = new Set(products.map((product) => product.id));
      const variantsByProduct = new Map(products.map((product) => [product.id, product.variants]));
      items.forEach((item) => {
        if (item.productId && !existingIds.has(item.productId)) {
          item.productId = null;
          return;
        }

        const variants = variantsByProduct.get(item.productId) || [];
        const variant =
          variants.find((entry) => entry.size === item.productSize) ||
          variants[0];

        if (variant) {
          item.productSize = variant.size;
          item.unitPrice = Number(variant.price);
        }
      });
    }

    const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        code: createOrderCode(),
        userId: req.user?.id || null,
        customerName,
        phone,
        address,
        note: noteParts.join("\n") || null,
        total,
        items: {
          create: items
        }
      },
      include: {
        items: true
      }
    });

    const mail = await sendOrderEmail({ order, items: order.items });

    res.status(201).json({
      success: true,
      message: "Đơn hàng đã được gửi. Họa Minh sẽ liên hệ xác nhận thanh toán.",
      data: {
        order: {
          id: order.id,
          code: order.code,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          mail
        }
      }
    });
  })
);

export default router;
