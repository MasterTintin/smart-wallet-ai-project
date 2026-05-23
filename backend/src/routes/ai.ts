import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai"; // 1. ดึง SDK ตัวแรงของ Google เข้ามาร่วมรบ

const router = Router();
const prisma = new PrismaClient();

// 2. สั่งเปิดสายเชื่อมต่อเข้าหา API Key ที่เราแอบซ่อนไว้ในไฟล์ .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API ให้ AI วิเคราะห์พฤติกรรมการใช้เงิน (Analyze Financial Status)
router.get("/analyze/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 15
    });

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((item) => {
      const amountNum = Number(item.amount);
      if (item.type === "INCOME") totalIncome += amountNum;
      else if (item.type === "EXPENSE") totalExpense += amountNum;
    });
    const netBalance = totalIncome - totalExpense;

    const recentTxString = transactions
      .map(
        (t) =>
          `- [${t.type}] หมวดหมู่: ${t.category}, รายละเอียด: ${t.description}, จำนวนเงิน: ฿${t.amount}`
      )
      .join("\n");

    const systemPrompt = `
      คุณคือที่ปรึกษาทางการเงินส่วนตัวอัจฉริยะที่ชื่อ "Smart Wallet AI" 
      มีบุคลิกเป็นเพื่อนสนิทที่จริงใจ คูลๆ คุยสนุก แฝงความกวนนิดๆ วัยรุ่นชอบ แต่เปี่ยมไปด้วยความรู้ทางการเงิน 
      จงวิเคราะห์ข้อมูลรายรับ-รายจ่ายของผู้ใช้ต่อไปนี้ แล้วให้คำแนะนำสั้นๆ กระชับ และโดนใจ 2-3 ข้อ:

      [ข้อมูลสรุปการเงินผู้ใช้]
      - ยอดรายรับรวมล่าสุด: ฿${totalIncome}
      - ยอดรายจ่ายรวมล่าสุด: ฿${totalExpense}
      - เงินคงเหลือสุทธิ: ฿${netBalance}

      [ประวัติรายการล่าสุด]
      ${recentTxString || "ยังไม่มีข้อมูลรายการบันทึก"}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt
    });

    res.json({
      userId,
      success: true,
      dataCalculated: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: transactions.length
      },
      aiAnalysis: response.text
    });
  } catch (error) {
    console.error("AI Router Error:", error);
    res
      .status(500)
      .json({ error: "Failed to connect with Gemini AI. สมองกลพังชั่วคราว" });
  }
});

export default router;
