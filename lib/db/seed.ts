import { prisma } from "./index";
import bcrypt from "bcryptjs";

const USERS = [
  {
    name: "Morgan Caldbeck",
    email: "caldbeck.morgan@gmail.com",
    password: "SweetwoodMt1!",
    role: "admin",
  },
];

async function seed() {
  console.log("Seeding users...");

  for (const user of USERS) {
    const hash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash: hash, role: user.role, name: user.name },
      create: {
        email: user.email,
        name: user.name,
        passwordHash: hash,
        role: user.role,
      },
    });
    console.log(`  ✓ ${user.name} (${user.email}) [${user.role}]`);
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
