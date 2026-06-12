import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  // Seed category
  await prisma.category.upsert({
    where: { slug: "tranh-cat-giay-3d" },
    update: {},
    create: {
      name: "Tranh cat giay 3D",
      slug: "tranh-cat-giay-3d"
    }
  });

  console.log("Seed: roles + category ready. Products left empty.");
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
