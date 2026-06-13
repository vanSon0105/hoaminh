import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.resolve(__dirname, "../../web/assets/images/products");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const productDefaults = {
  material: "khung gỗ, giấy, đèn led",
  origin: "Thạch Hoà, Thạch Thất, Hà Nội",
  note: null
};

const productVariants = [
  { size: "23x23", price: 399000, sortOrder: 0 },
  { size: "30x30", price: 799000, sortOrder: 1 }
];

const featuredImageNames = new Set(["aemeath.jpg", "dan-heng.jpg", "anaxa.jpg"]);

const productFiles = fs
  .readdirSync(productsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" }));

const main = async () => {
  await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "CUSTOMER" }
  });
  await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "ADMIN" }
  });

  const category = await prisma.category.upsert({
    where: { slug: "tranh-cat-giay-3d" },
    update: { name: "Tranh cắt giấy 3D" },
    create: {
      name: "Tranh cắt giấy 3D",
      slug: "tranh-cat-giay-3d"
    }
  });

  for (const [index, fileName] of productFiles.entries()) {
    const number = String(index + 1).padStart(2, "0");
    const imageUrl = `assets/images/products/${fileName}`;
    const fallbackSlug = `san-pham-${number}`;
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ imageUrl }, { slug: fallbackSlug }]
      },
      select: { id: true }
    });

    const productData = {
      description: null,
      ...productDefaults,
      imageUrl,
      isFeatured: featuredImageNames.has(fileName),
      isActive: true,
      categoryId: category.id
    };

    const product = existingProduct
      ? await prisma.product.update({
          where: { id: existingProduct.id },
          data: productData
        })
      : await prisma.product.create({
          data: {
            name: `Sản phẩm ${number}`,
            slug: fallbackSlug,
            ...productData
          }
        });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        type: "THUMBNAIL",
        sortOrder: 0
      }
    });

    for (const variant of productVariants) {
      await prisma.productVariant.upsert({
        where: {
          productId_size: {
            productId: product.id,
            size: variant.size
          }
        },
        update: {
          price: variant.price,
          sortOrder: variant.sortOrder,
          isActive: true
        },
        create: {
          productId: product.id,
          size: variant.size,
          price: variant.price,
          sortOrder: variant.sortOrder,
          isActive: true
        }
      });
    }
  }

  const activeImageUrls = productFiles.map((fileName) => `assets/images/products/${fileName}`);
  await prisma.product.updateMany({
    where: {
      imageUrl: {
        notIn: activeImageUrls
      }
    },
    data: {
      isActive: false
    }
  });

  console.log(`Seed: roles + category + ${productFiles.length} products synced with variants.`);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
