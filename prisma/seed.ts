/**
 * Database Seed Script
 *
 * Creates the default admin test account:
 *   Email: admin@linkweb.local
 *   Password: admin123
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@linkweb.local";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`⚠️  Admin user already exists (${email}). Updating password...`);
    await prisma.user.update({
      where: { email },
      data: { passwordHash, name: "Admin", username: "admin" },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        username: "admin",
        passwordHash,
      },
    });
    console.log(`✅ Created admin user: ${email} / ${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });