import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai"; // ดึง SDK ตัวแรงของ Google เข้ามา

const router = Router();
const prisma = new PrismaClient();

// 2. สั่งเปิดสายเชื่อมต่อเข้าหา API Key ที่เราแอบซ่อนไว้ในไฟล์ .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ปรับเปลี่ยนจาก GET เป็น POST เพื่อให้รองรับรูปแบบการเรียกจากหน้าบ้าน (page.tsx)
router.post("/analyze", async (req, res) => {
  try {
    // แกะ userId ออกมาจาก body ตามที่หน้าบ้านส่งมา
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required userId field" });
    }

    // 1. ดึงข้อมูลธุรกรรมทั้งหมดของผู้ใช้เพื่อนำมาคำนวณยอดรวมที่แท้จริง
    const allTransactions = await prisma.transaction.findMany({
      where: { userId }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    allTransactions.forEach((item) => {
      const amountNum = Number(item.amount);
      if (item.type === "INCOME") totalIncome += amountNum;
      else if (item.type === "EXPENSE") totalExpense += amountNum;
    });
    const netBalance = totalIncome - totalExpense;

    // 2. ดึงธุรกรรม 15 รายการล่าสุดเพื่อเอามาส่งให้ AI ดูเป็นแนวโน้มพฤติกรรม
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 15
    });

    const recentTxString = recentTransactions
      .map(
        (t) =>
          `- [${t.type}] รายละเอียด: ${t.description}, จำนวนเงิน: ฿${t.amount}`
      )
      .join("\n");

    // อัปเกรด System Prompt ให้มีความเป็นเพื่อนสนิทและเจาะจง Context นิสิต CEDT
    const systemPrompt = `
      คุณคือ "Smart Wallet AI" ที่ปรึกษาทางการเงินส่วนตัวระดับเทพของนิสิตวิศวกรรมคอมพิวเตอร์และเทคโนโลยีดิจิทัล (CEDT) จุฬาฯ
      บุคลิกของคุณ: เป็นเพื่อนสนิทที่จริงใจ คูลๆ คุยสนุก ใช้คำพูดเป็นกันเอง แฝงความกวนนิดๆ เข้าใจหัวอกคนเรียนสายเทคและโปรแกรมมิ่งเป็นอย่างดี

      จงวิเคราะห์ข้อมูลรายรับ-รายจ่ายต่อไปนี้ แล้วให้คำแนะนำสั้นๆ กระชับ และตรงจุด 2-3 ข้อ 
      (สามารถแซวหรือหยิบยกประเด็นเกี่ยวกับไลฟ์สไตล์นิสิต เช่น การกินชาบู, ร้านอาหารแถวสามย่าน, ค่ากาแฟปั่นโปรเจกต์ดึก, หรือการสปอยล์ตัวเองหลังสอบได้ตามความเหมาะสม แต่อย่าหลุดหลงประเด็นเรื่องการเงิน)

      [ข้อมูลสรุปการเงินภาพรวม]
      - ยอดรายรับรวมทั้งหมด: ฿${totalIncome}
      - ยอดรายจ่ายรวมทั้งหมด: ฿${totalExpense}
      - ยอดเงินคงเหลือสุทธิปัจจุบัน: ฿${netBalance}

      [ประวัติ 15 รายการล่าสุดที่เพิ่งเกิดขึ้น]
      ${recentTxString || "ยังไม่มีข้อมูลรายการบันทึกในระบบ"}

      กฎเหล็ก: ตอบเป็นภาษาไทย ให้กระชับ ได้ใจความ ไม่เวิ่นเว้อ แบ่งเป็นข้อๆ ชัดเจนอ่านง่าย และไม่ต้องพ่นโค้ด Markdown ที่หนาเทอะทะเกินไป
    `;

    // ยิงเรียกใช้โมเดลผ่าน SDK เวอร์ชันล่าสุดอย่างถูกต้อง
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt
    });

    // ป้องกันบั๊ก: ดึงเนื้อหาคำตอบออกมาแบบปลอดภัย 100% รองรับกรณีผลลัพธ์เป็นค่าว่าง
    const aiInsightText =
      response.text ||
      "ตอนนี้สมองล้าไปนิดนึง ไม่มีข้อคิดเห็นทางการเงินในรอบนี้เพื่อน";

    res.json({
      userId,
      success: true,
      dataCalculated: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: allTransactions.length
      },
      analysis: aiInsightText
    });
  } catch (error) {
    // พ่นระบุ Log ให้เห็นบนเซิร์ฟเวอร์หลังบ้าน
    console.error("🚨 AI Router Error Detail:", error);
    res
      .status(500)
      .json({ error: "Failed to connect with Gemini AI. สมองกลพังชั่วคราว" });
  }
});

export default router;
