import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  await prisma.category.upsert({
    where: { slug: "tranh-cat-giay-3d" },
    update: {},
    create: {
      name: "Tranh cat giay 3D",
      slug: "tranh-cat-giay-3d"
    }
  });

  console.log("Seed: category ready. Products left empty for later import.");
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
