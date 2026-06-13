import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const productFiles = [
  "1.png",
  "image 8.png",
  "image 9.png",
  "image 11.png",
  "image 12.png",
  "image 15.png",
  "image 16.png",
  "image 17.png",
  "image 18.png",
  "image 24.png",
  "image 26.png",
  "image 27.png",
  "image 28.png",
  "image 29.png",
  "image 30.png"
];

const main = async () => {
  // Seed roles
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
    update: {},
    create: {
      name: "Tranh cắt giấy 3D",
      slug: "tranh-cat-giay-3d"
    }
  });

  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  for (const [index, fileName] of productFiles.entries()) {
    const number = String(index + 1).padStart(2, "0");
    const imageUrl = `assets/images/products/${fileName}`;

    await prisma.product.create({
      data: {
        name: `Sản phẩm ${number}`,
        slug: `san-pham-${number}`,
        description: null,
        price: 0,
        size: null,
        imageUrl,
        isFeatured: index < 6,
        isActive: true,
        categoryId: category.id,
        images: {
          create: {
            url: imageUrl,
            type: "THUMBNAIL",
            sortOrder: 0
          }
        }
      }
    });
  }

  console.log(`Seed: roles + category + ${productFiles.length} products ready.`);
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
