import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  const category = await prisma.category.upsert({
    where: { slug: "tranh-cat-giay-3d" },
    update: {},
    create: {
      name: "Tranh cat giay 3D",
      slug: "tranh-cat-giay-3d"
    }
  });

  await prisma.product.upsert({
    where: { slug: "stay-cool" },
    update: {},
    create: {
      name: "Stay Cool",
      slug: "stay-cool",
      description: "San pham mau dung cho UI demo.",
      price: "420000",
      size: "35x35",
      imageUrl: "/assets/images/products/image 8.png",
      isFeatured: true,
      categoryId: category.id
    }
  });

  await prisma.product.upsert({
    where: { slug: "buttercream" },
    update: {},
    create: {
      name: "Buttercream",
      slug: "buttercream",
      description: "Thong tin chi tiet se duoc cap nhat khi co backend day du.",
      price: "350000",
      size: "35x35",
      imageUrl: "/assets/images/products/image 24.png",
      isFeatured: true,
      categoryId: category.id
    }
  });
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
