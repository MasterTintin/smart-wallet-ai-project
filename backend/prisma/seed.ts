import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. สร้าง User จำลอง
  const mockUser = await prisma.user.upsert({
    where: { email: "tangtang@cedt.chula.ac.th" },
    update: {},
    create: {
      id: "mock-user-tangtang",
      email: "tangtang@cedt.chula.ac.th",
      passwordHash: "mock_password_hash_123456"
    }
  });

  // แก้บรรทัด log นี้ให้ดึงค่า email แทนเพื่อไม่ให้ error
  console.log(`👤 Created/Verified Mock User: ${mockUser.email}`);

  // 2. เติมรายการ รายรับ-รายจ่าย จำลอง
  await prisma.transaction.createMany({
    data: [
      {
        userId: mockUser.id,
        type: "INCOME",
        amount: 15000,
        category: "Salary",
        description: "เงินเดือนจากงานพาร์ทไทม์ Full Stack Dev",
        date: new Date("2026-05-01")
      },
      {
        userId: mockUser.id,
        type: "EXPENSE",
        amount: 120,
        category: "Food",
        description: "ข้าวขาหมูสามย่าน",
        date: new Date("2026-05-18")
      },
      {
        userId: mockUser.id,
        type: "EXPENSE",
        amount: 2500,
        category: "Investment",
        description: "ออมเงินในพอร์ตจำลองระบบ EMA200",
        date: new Date("2026-05-19")
      },
      {
        userId: mockUser.id,
        type: "EXPENSE",
        amount: 450,
        category: "Entertainment",
        description: "ซื้อการ์ดสะสมใน Real App สุ่มตัวพิชเชอร์",
        date: new Date("2026-05-20")
      }
    ]
  });

  console.log("💰 Seeded mock transactions successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
