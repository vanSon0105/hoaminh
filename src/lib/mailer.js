import nodemailer from "nodemailer";

import { env } from "../config/env.js";

const hasSmtpConfig = Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "Chưa cập nhật";
  return `${new Intl.NumberFormat("vi-VN").format(number)} VND`;
};

const buildOrderText = ({ order, items }) => {
  const lines = [
    `Đơn hàng mới: ${order.code}`,
    "",
    `Khách hàng: ${order.customerName}`,
    `Số điện thoại: ${order.phone}`,
    `Địa chỉ: ${order.address}`,
    `Ghi chú: ${order.note || "Không có"}`,
    `Tổng tiền: ${formatCurrency(order.total)}`,
    "",
    "Sản phẩm:"
  ];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.productName} x${item.quantity} - ${formatCurrency(item.unitPrice)}`
    );
  });

  return lines.join("\n");
};

const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const buildOrderHtml = ({ order, items }) => {
  const itemRows = items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.productName)}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #241713; line-height: 1.5;">
      <h2>Đơn hàng mới: ${escapeHtml(order.code)}</h2>
      <p><strong>Khách hàng:</strong> ${escapeHtml(order.customerName)}</p>
      <p><strong>Số điện thoại:</strong> ${escapeHtml(order.phone)}</p>
      <p><strong>Địa chỉ:</strong> ${escapeHtml(order.address)}</p>
      <p><strong>Ghi chú:</strong> ${escapeHtml(order.note || "Không có")}</p>
      <p><strong>Tổng tiền:</strong> ${formatCurrency(order.total)}</p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Giá</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
  `;
};

export const sendOrderEmail = async ({ order, items }) => {
  const subject = `[Họa Minh] Đơn hàng mới ${order.code}`;
  const text = buildOrderText({ order, items });
  const html = buildOrderHtml({ order, items });

  if (!hasSmtpConfig) {
    console.log("[mail] SMTP chưa cấu hình, bỏ qua gửi mail admin.");
    console.log({ to: env.adminOrderEmail, subject, text });
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to: env.adminOrderEmail,
    subject,
    text,
    html
  });

  return { skipped: false };
};
