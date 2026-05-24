import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transaction.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // ✨ ล็อกเป้าให้เข้ากับหน้าบ้านชัวร์ๆ
    credentials: true
  })
);
app.use(express.json());

// Route ทดสอบเบื้องต้น
app.get("/", (req, res) => {
  res.json({ message: "Smart Wallet AI Backend API is running! 🚀" });
});

// 🎯 2. เปิดเส้นทางท่อส่งข้อมูลให้ครบถ้วน (ห้ามลืม /api/auth เด็ดขาด!)
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);

// API ตัวอย่างดึงข้อมูล Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong fetching users." });
  }
});

// เริ่มต้นเปิด Server
app.listen(PORT, () => {
  console.log(`\n=============================================`);
  console.log(` 🔥 Server is cruising beautifully on port ${PORT} `);
  console.log(`=============================================\n`);
});
