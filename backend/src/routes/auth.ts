import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_for_cedt_project";

// 🔑 1. REGISTER API
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, passwordHash }
    });

    return res
      .status(201)
      .json({ message: "สมัครสมาชิกสำเร็จ 🎉", userId: newUser.id });
  } catch (error) {
    return res.status(500).json({ error: "สมัครสมาชิกไม่สำเร็จ" });
  }
});

// 🔒 2. LOGIN API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "ไม่พบผู้ใช้งานในระบบ" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      message: "เข้าสู่ระบบสำเร็จ 🚀",
      token,
      userId: user.id
    });
  } catch (error) {
    return res.status(500).json({ error: "ระบบล็อกอินขัดข้อง" });
  }
});

export default router;
