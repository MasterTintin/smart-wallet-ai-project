import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ========================================
// 1. CREATE TRANSACTION
// ========================================
router.post("/", async (req, res) => {
  try {
    const { type, amount, description, userId } = req.body;

    // VALIDATION
    if (!type || !amount || !description || !userId) {
      return res.status(400).json({
        error: "Missing required fields (type, amount, description, or userId)"
      });
    }

    // 🔗 สร้างธุรกรรมโดยผูก userId เข้ากับ Relation ในตารางตรงๆ
    const newTransaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category: type === "INCOME" ? "General Income" : "General Expense",
        description,
        userId: userId // โยงเข้าหาเจ้าของไอดีที่ล็อกอินมาจากหน้าบ้าน
      }
    });

    res.status(201).json({
      message: "Transaction created successfully! 💰",
      data: newTransaction
    });
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({
      error: "Failed to create transaction."
    });
  }
});

// ========================================
// 2. GET USER TRANSACTIONS
// ========================================
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query; // รับ userId ผ่าน Query parameters ที่หน้าบ้านส่งมา

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: userId" });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: String(userId)
      },
      orderBy: {
        date: "desc"
      }
    });
    res.json(transactions);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({
      error: "Failed to fetch transactions."
    });
  }
});

// ========================================
// 3. GET SUMMARY (คำนวณยอดเงินเฉพาะบุคคล)
// ========================================
router.get("/summary", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: userId" });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: String(userId)
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((item) => {
      const amountNum = Number(item.amount);
      if (item.type === "INCOME") {
        totalIncome += amountNum;
      }
      if (item.type === "EXPENSE") {
        totalExpense += amountNum;
      }
    });

    const balance = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length
    });
  } catch (error) {
    console.error("SUMMARY ERROR:", error);
    res.status(500).json({
      error: "Failed to calculate summary."
    });
  }
});

// ========================================
// 4. UPDATE TRANSACTION
// ========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, description } = req.body;

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id
      },
      data: {
        type,
        amount: amount ? parseFloat(amount) : undefined,
        description
      }
    });

    res.json({
      message: "Transaction updated successfully ✏️",
      data: updatedTransaction
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "Transaction not found."
      });
    }
    res.status(500).json({
      error: "Failed to update transaction."
    });
  }
});

// ========================================
// 5. DELETE TRANSACTION (ลบแบบระบุเป็นราย ID รายการ)
// ========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.transaction.delete({
      where: {
        id
      }
    });

    res.json({
      message: "Transaction deleted successfully 🗑️"
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        error: "Transaction not found."
      });
    }
    res.status(500).json({
      error: "Failed to delete transaction."
    });
  }
});

// ==========================================================
// 6. CLEAR ALL TRANSACTIONS
// ==========================================================
router.delete("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: userId" });
    }

    await prisma.transaction.deleteMany({
      where: {
        userId: String(userId)
      }
    });

    res.json({
      message: "ลบข้อมูลธุรกรรมทั้งหมดของคุณเรียบร้อยแล้ว! 🔥"
    });
  } catch (error) {
    console.error("CLEAR ALL ERROR:", error);
    res.status(500).json({
      error: "Failed to clear transactions."
    });
  }
});

export default router;
