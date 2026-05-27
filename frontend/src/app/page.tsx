"use client";

import React, { useEffect, useState } from "react";
import {
  Wallet,
  Sparkles,
  PlusCircle,
  RefreshCw,
  LogOut,
  LogIn,
  UserPlus,
  Trash2
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function Dashboard() {
  // สเตทเก็บ Session ความปลอดภัย
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ฟอร์มสำหรับระบบ Auth
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // สเตทระบบแดชบอร์ดการเงิน
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });
  const [aiInsight, setAiInsight] = useState(
    "กำลังรอข้อมูลเพื่อให้ AI วิเคราะห์พฤติกรรมการเงิน..."
  );
  const [loadingAi, setLoadingAi] = useState(false);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("INCOME");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUserId = localStorage.getItem("user_id");
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  // =========================
  // HANDLER: LOGIN / REGISTER
  // =========================
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegisterMode ? "register" : "login";
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();

      if (!res.ok) return alert(data.error || "เกิดข้อผิดพลาด");

      if (isRegisterMode) {
        alert("สมัครสมาชิกสำเร็จ! สลับไปล็อกอินได้เลยเพื่อน 🎉");
        setIsRegisterMode(false);
      } else {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_id", data.userId);
        setToken(data.token);
        setUserId(data.userId);
        alert("ยินดีต้อนรับสู่ Smart Wallet AI 🚀");
      }
    } catch (err) {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUserId(null);
    setTransactions([]);
    setSummary({ totalIncome: 0, totalExpense: 0, balance: 0 });
  };

  // =========================
  // FETCH USER DATA
  // =========================
  const fetchData = async () => {
    if (!userId) return;
    try {
      const summaryRes = await fetch(
        `${API_BASE_URL}/api/transactions/summary?userId=${userId}`
      );
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary({
          totalIncome: summaryData.totalIncome ?? 0,
          totalExpense: summaryData.totalExpense ?? 0,
          balance: summaryData.balance ?? 0
        });
      }

      const txRes = await fetch(
        `${API_BASE_URL}/api/transactions?userId=${userId}`
      );
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : []);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  // =========================
  // ADD TRANSACTION
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !userId)
      return alert("กรอกข้อมูลให้ครบถ้วน");

    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          type,
          description
        })
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        await fetchData();
        alert("เพิ่มรายการสำเร็จ 🎉");
      } else {
        alert("เพิ่มข้อมูลไม่สำเร็จ");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  // =========================
  // AI ANALYSIS
  // =========================
  const askGeminiAI = async () => {
    if (!userId) return;
    setLoadingAi(true);
    setAiInsight("Gemini AI กำลังวิเคราะห์รูปแบบการใช้เงินของคุณ...");

    try {
      // ✅ แก้ไข: เปลี่ยนไปใช้ API_BASE_URL ข้ามคลาวด์สั่งยิงหา AI ยิงวิเคราะห์ข้อมูล
      const res = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.analysis || "ไม่สามารถดึงบทวิเคราะห์ได้");
      } else {
        setAiInsight("AI ไม่สามารถวิเคราะห์ได้ในขณะนี้");
      }
    } catch (error) {
      setAiInsight("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
    } finally {
      setLoadingAi(false);
    }
  };

  // =========================
  // CLEAR ALL TRANSACTIONS
  // =========================
  const handleClearAllTransactions = async () => {
    if (!userId) return;

    const confirmClear = window.confirm(
      "คุณแน่ใจใช่ไหมที่จะลบข้อมูลธุรกรรมทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้!"
    );
    if (!confirmClear) return;

    try {
      // ✅ แก้ไข: เปลี่ยนไปใช้ API_BASE_URL ข้ามคลาวด์สั่งลบข้อมูลทั้งหมด
      const res = await fetch(
        `${API_BASE_URL}/api/transactions?userId=${userId}`,
        {
          method: "DELETE"
        }
      );

      if (res.ok) {
        alert("ลบข้อมูลธุรกรรมทั้งหมดเรียบร้อยแล้ว! 🧹");
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "ลบข้อมูลไม่สำเร็จ");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // ========================================
  // REUSABLE COMPONENT: โค้ด Footer ตัวจริงของ Tintin
  // ========================================
  const TintinFooter = () => (
    <footer className="mt-8 mb-4 text-center text-xs text-zinc-400 font-sans tracking-wide w-full">
      <p className="font-medium text-zinc-500">
        Developed by{" "}
        <span className="font-semibold text-zinc-700">Tintin CEDT #2</span>
      </p>
      <p className="mt-1">
        Contact Developer:{" "}
        <a
          href="mailto:6733031821@student.chula.ac.th"
          className="text-yellow-600 underline underline-offset-2 hover:text-yellow-700 transition-colors"
        >
          6733031821@student.chula.ac.th
        </a>
      </p>
    </footer>
  );

  // ----------------------------------------
  // VIEW: 1. หน้าฟอร์ม LOGIN / REGISTER
  // ----------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FFF9E8] flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-yellow-200 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-yellow-300 p-4 inline-block rounded-2xl shadow-sm mb-2">
              <Wallet size={32} className="text-zinc-800" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Smart Wallet AI
            </h1>
            <p className="text-xs text-zinc-500">
              ระบบคุมกระเป๋าเงินสำหรับนิสิตสไตล์เทค แยกบัญชีปลอดภัย
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="cedt-student@chula.ac.th"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-xl border border-yellow-200 px-4 py-3 text-sm focus:outline-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 block mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-xl border border-yellow-200 px-4 py-3 text-sm focus:outline-yellow-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-zinc-800 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              {isRegisterMode ? <UserPlus size={16} /> : <LogIn size={16} />}
              {isRegisterMode ? "Sign Up สมัครไอดีใหม่" : "Log In เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-yellow-700 hover:underline font-medium"
            >
              {isRegisterMode
                ? "มีบัญชีอยู่แล้ว? เปลี่ยนเป็นเข้าสู่ระบบ"
                : "ยังไม่มีกระเป๋าตังค์? สมัครสมาชิกใหม่ตรงนี้"}
            </button>
          </div>
        </div>

        <TintinFooter />
      </div>
    );
  }

  // ----------------------------------------
  // VIEW: 2. หน้าหลัก DASHBOARD (เมื่อล็อกอินสำเร็จแล้ว)
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-[#FFF9E8] text-zinc-800 p-6 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-100 via-yellow-50 to-white p-8 shadow-sm">
          <div className="absolute right-6 top-6 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-300 p-3 rounded-2xl shadow-sm">
                  <Wallet className="text-zinc-800" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900">
                    Smart Wallet AI
                  </h1>
                  <p className="text-sm text-zinc-600 mt-1">
                    ระบบจัดการการเงินอัจฉริยะฉบับนิสิต CEDT
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-400 transition-all px-5 py-3 rounded-2xl text-sm font-semibold text-zinc-800"
              >
                <RefreshCw size={16} />
                รีเฟรชข้อมูล
              </button>

              <button
                onClick={handleClearAllTransactions}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white transition-all px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm"
              >
                <Trash2 size={16} />
                ลบข้อมูลทั้งหมด
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white transition-all px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm"
              >
                <LogOut size={16} />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-zinc-500">ยอดเงินคงเหลือ</p>
            <h2 className="text-3xl font-bold mt-2">
              ฿ {(summary.balance ?? 0).toLocaleString()}
            </h2>
          </div>
          <div className="bg-white border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-zinc-500">รายรับทั้งหมด</p>
            <h2 className="text-3xl font-bold text-emerald-600 mt-2">
              + ฿ {(summary.totalIncome ?? 0).toLocaleString()}
            </h2>
          </div>
          <div className="bg-white border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-zinc-500">รายจ่ายทั้งหมด</p>
            <h2 className="text-3xl font-bold text-rose-500 mt-2">
              - ฿ {(summary.totalExpense ?? 0).toLocaleString()}
            </h2>
          </div>
        </section>

        {/* AI PANEL */}
        <section className="bg-white border border-yellow-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <Sparkles className="text-yellow-600 animate-pulse" size={22} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-zinc-900">
                  AI Financial Advisor
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  วิเคราะห์และแนะนำแผนการเงินส่วนบุคคลอัตโนมัติด้วย Gemini AI
                </p>
              </div>
            </div>

            <button
              onClick={askGeminiAI}
              disabled={loadingAi}
              className="flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-400 disabled:bg-zinc-100 transition-all px-5 py-3 rounded-2xl text-sm font-bold text-zinc-800"
            >
              {loadingAi ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {loadingAi ? "กำลังวิเคราะห์..." : "วิเคราะห์การเงินด้วย AI ✨"}
            </button>
          </div>
          <div className="mt-5 p-5 rounded-2xl bg-yellow-50/60 border border-yellow-100/70 text-sm text-zinc-700 whitespace-pre-line leading-relaxed">
            {aiInsight}
          </div>
        </section>

        {/* FORM + TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <PlusCircle size={18} />
              <h2 className="font-semibold">เพิ่มรายการธุรกรรม</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-2xl border border-yellow-200 px-4 py-3 bg-white"
              >
                <option value="INCOME">รายรับ</option>
                <option value="EXPENSE">รายจ่าย</option>
              </select>
              <input
                type="number"
                placeholder="จำนวนเงิน"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border border-yellow-200 px-4 py-3"
              />
              <input
                type="text"
                placeholder="รายละเอียด"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-yellow-200 px-4 py-3"
              />
              <button
                type="submit"
                className="w-full bg-yellow-300 hover:bg-yellow-400 py-3 rounded-2xl font-semibold transition-colors"
              >
                เพิ่มข้อมูลเข้าสู่ระบบ
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 bg-white border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <h2 className="font-semibold mb-5">ประวัติธุรกรรมของคุณ</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-yellow-100">
                  <tr>
                    <th className="text-left px-5 py-4">วันที่</th>
                    <th className="text-left px-5 py-4">รายละเอียด</th>
                    <th className="text-left px-5 py-4">ประเภท</th>
                    <th className="text-right px-5 py-4">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-10 text-zinc-400"
                      >
                        ยังไม่มีรายการธุรกรรมของคุณ
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-t hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-5 py-4 text-zinc-500 font-mono text-xs">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })
                            : "-"}
                        </td>

                        <td className="px-5 py-4">{tx.description}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${tx.type === "INCOME" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {tx.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-medium ${tx.type === "INCOME" ? "text-emerald-600" : "text-rose-500"}`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"} ฿{" "}
                          {(tx.amount ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <TintinFooter />
    </div>
  );
}
