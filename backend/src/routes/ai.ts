import { Router } from "express";
import { PrismaClient, Transaction } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";

const router = Router();
const prisma = new PrismaClient();

// เปิดสายเชื่อมต่อเข้าหา API Key จาก .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/analyze", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required userId field" });
    }

    // 1. ดึงข้อมูลธุรกรรมทั้งหมดของผู้ใช้เพื่อนำมาคำนวณยอดรวม
    const allTransactions = await prisma.transaction.findMany({
      where: { userId }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    allTransactions.forEach((item: Transaction) => {
      const amountNum = Number(item.amount);
      if (item.type === "INCOME") totalIncome += amountNum;
      else if (item.type === "EXPENSE") totalExpense += amountNum;
    });
    const netBalance = totalIncome - totalExpense;

    // 2. ดึงธุรกรรม 15 รายการล่าสุดเพื่อเอามาส่งให้ AI ดูแนวโน้ม
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 15
    });

    const recentTxString = recentTransactions
      .map(
        (t: Transaction) =>
          `- [${t.type}] รายละเอียด: ${t.description}, จำนวนเงิน: ฿${t.amount}`
      )
      .join("\n");

    // ปรับปรุง System Prompt ใหม่: เป็นมิตร เข้าถึงได้ทุกเพศทุกวัย
    const systemPrompt = `
      คุณคือ "ผู้ช่วยวิเคราะห์การเงินอัจฉริยะ" ที่เป็นมิตร อารมณ์ดี และเข้าถึงง่าย มีหน้าที่วิเคราะห์รายรับ-รายจ่ายให้กับผู้ใช้งานคนไทยทุกเพศทุกวัย
      
      บุคลิกของคุณ: เป็นเพื่อนคู่คิดทางการเงินที่ปรารถนาดี พูดจาสุภาพแต่เป็นกันเอง สนุกสนาน ไม่แข็งกระด้าง และไม่ใช้คำศัพท์สแลงเฉพาะกลุ่มที่ผู้ใหญ่จะไม่เข้าใจ

      [กฎเหล็กในการตอบ]
      1. ห้ามใช้คำศัพท์เฉพาะกลุ่ม เช่น "CEDT", "สามย่าน", "หน้ามอ", "ปั่นโค้ด", "บั๊ก (Bug)" หรือศัพท์วัยรุ่นเฉพาะทางเด็จขาด
      2. แทนตัวเองว่า "ผู้ช่วย AI" หรือ "บอท" และเรียกผู้ใช้ว่า "คุณ" อย่างอบอุ่น
      3. ให้คำแนะนำสั้นๆ กระชับ และตรงจุด 2-3 ข้อ แบ่งเป็นข้อๆ ชัดเจนอ่านง่าย
      4. **ข้อนี้สำคัญมาก**: ถ้าในประวัติธุรกรรมมีคำว่า "หุ้น", "พอร์ต", "เทรด", "ลงทุน" หรือ "กำไรพอร์ต" ให้ปรับโหมดมาชื่นชมความเก่งกาจในการลงทุนทันที พร้อมให้คำแนะนำเรื่องการบริหารความเสี่ยง (Risk Management) หรือการแบ่งกำไรมาเก็บออมในสินทรัพย์ปลอดภัย เพื่อเอาใจสายเทรดและคนทำงาน

      [ข้อมูลสรุปการเงินภาพรวม]
      - ยอดรายรับรวมทั้งหมด: ฿${totalIncome}
      - ยอดรายจ่ายรวมทั้งหมด: ฿${totalExpense}
      - ยอดเงินคงเหลือสุทธิปัจจุบัน: ฿${netBalance}

      [ประวัติ 15 รายการล่าสุดที่เพิ่งเกิดขึ้น]
      ${recentTxString || "ยังไม่มีข้อมูลรายการบันทึกในระบบ"}

      ตอบเป็นภาษาไทย ให้กระชับ ได้ใจความ ไม่อารัมภบทเวิ่นเว้อ
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt
    });

    // 🛠️ ป้องกันบั๊ก: ดึงเนื้อหาข้อความออกมาอย่างปลอดภัยสูงสุด รองรับ Getter ของ SDK ใหม่
    let aiInsightText = "";
    if (response && typeof response.text === "string") {
      aiInsightText = response.text;
    } else if (response && typeof response.text === "function") {
      aiInsightText = (response as any).text();
    }

    // หากยังได้ค่าว่างเปล่า ให้ใช้ข้อความ Default
    if (!aiInsightText.trim()) {
      aiInsightText =
        "ผู้ช่วย AI กำลังประมวลผลข้อมูลการลงทุนของคุณอยู่ โปรดลองกดใหม่อีกครั้งนะครับคุณ";
    }

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
    console.error("🚨 AI Router Error Detail:", error);
    res.status(500).json({
      error: "Failed to connect with Gemini AI. ระบบประมวลผลขัดข้องชั่วคราว"
    });
  }
});

export default router;
