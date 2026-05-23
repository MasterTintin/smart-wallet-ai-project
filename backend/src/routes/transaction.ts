import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// 1. API บันทึกรายรับ - รายจ่าย
router.post("/", async (req, res) => {
  try {
    const { userId, type, amount, category, description } = req.body;

    if (!userId || !type || !amount || !category) {
      return res.status(400).json({
        error: "Missing required fields: userId, type, amount, or category"
      });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        userId,
        type, // "INCOME" OR "EXPENSE"
        amount: parseFloat(amount),
        category,
        description
      }
    });

    res.status(201).json({
      message: "Transaction recorded successfully! 💰",
      data: newTransaction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record transaction." });
  }
});

// 🔵 2. API ดึงประวัติธุรกรรมทั้งหมดของ User นั้นๆ
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" }
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

// 🟡 3. API แก้ไขข้อมูลธุรกรรม (Update Transaction)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    // สั่ง Prisma ให้เข้าไปอัปเดตข้อมูลตาม ID นั้นๆ
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        description,
        date: date ? new Date(date) : undefined
      }
    });

    res.json({
      message: "Transaction updated beautifully! ✏️",
      data: updatedTransaction
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Transaction not found." });
    }
    res.status(500).json({ error: "Failed to update transaction." });
  }
});

// 4. API ลบข้อมูลธุรกรรม (Delete Transaction)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.transaction.delete({
      where: { id }
    });

    res.json({ message: "Transaction deleted successfully! 🗑️" });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Transaction not found." });
    }
    res.status(500).json({ error: "Failed to delete transaction." });
  }
});

// 📊 5. API สรุปยอดเงินรวมทั้งหมดของ User (Get Financial Summary)
router.get("/:userId/summary", async (req, res) => {
  try {
    const { userId } = req.params;

    // 5.1. ไปดึงธุรกรรมทั้งหมดของ User นี้มาจาก Database
    const transactions = await prisma.transaction.findMany({
      where: { userId }
    });

    // 5.2. ใช้ฟังก์ชันของ JavaScript ในการคำนวณแยกยอดรวม
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((item) => {
      // ดึงค่า amount ออกมาแปลงเป็นตัวเลขเพื่อความชัวร์
      const amountNum = Number(item.amount);

      if (item.type === "INCOME") {
        totalIncome += amountNum;
      } else if (item.type === "EXPENSE") {
        totalExpense += amountNum;
      }
    });

    // 5.3. คำนวณหายอดเงินคงเหลือสุทธิ
    const netBalance = totalIncome - totalExpense;

    // 5.4. ส่งก้อนสรุปตัวเลขกลับไปให้ผู้ใช้
    res.json({
      userId,
      totalIncome,
      totalExpense,
      netBalance,
      transactionCount: transactions.length // บอกจำนวนรายการแถมไปด้วย
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to calculate financial summary." });
  }
});
export default router;
