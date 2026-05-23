"use client";

import React, { useEffect, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Banknote,
  Coins
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function Dashboard() {
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
  const [isMounted, setIsMounted] = useState(false);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState("INCOME");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const summaryRes = await fetch(
        "http://localhost:5000/api/transactions/summary"
      );

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();

        setSummary({
          totalIncome: summaryData?.totalIncome ?? 0,
          totalExpense: summaryData?.totalExpense ?? 0,
          balance: summaryData?.balance ?? 0
        });
      }

      const txRes = await fetch("http://localhost:5000/api/transactions");

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const askGeminiAI = async () => {
    setLoadingAi(true);

    setAiInsight("Gemini AI กำลังวิเคราะห์รูปแบบการใช้เงินของคุณ...");

    try {
      const res = await fetch("http://localhost:5000/api/ai/analyze", {
        method: "POST"
      });

      if (res.ok) {
        const data = await res.json();

        setAiInsight(data.analysis || "ไม่สามารถดึงบทวิเคราะห์ได้ในขณะนี้");
      }
    } catch (err) {
      setAiInsight("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }

    try {
      const res = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          description
        })
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF9E8] text-zinc-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-100 via-yellow-50 to-white p-8 shadow-sm">
          {/* Background Graphics */}
          <div className="absolute right-6 top-6 opacity-10">
            <Wallet size={120} />
          </div>

          <div className="absolute right-28 bottom-2 opacity-10">
            <Coins size={80} />
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
                    ระบบจัดการการเงินอัจฉริยะด้วย AI
                  </p>
                </div>
              </div>

              {/* CEDT Badge */}
              <div className="relative overflow-hidden inline-flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-100/80 px-4 py-3 shadow-sm">
                <div className="absolute inset-0 opacity-5 flex items-center justify-end pr-4">
                  <Banknote size={70} />
                </div>

                <div className="relative z-10 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />

                <p className="relative z-10 text-sm font-medium text-yellow-900">
                  ระบบบริหารเงินอัจฉริยะฉบับนิสิต CEDT
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-400 transition-all duration-200 px-5 py-3 rounded-2xl text-sm font-semibold text-zinc-800 shadow-sm hover:shadow-md active:scale-95 w-fit"
            >
              <RefreshCw size={16} />
              รีเฟรชข้อมูล
            </button>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Balance */}
          <div className="bg-white/80 backdrop-blur-sm border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">ยอดเงินคงเหลือ</p>

                <h2 className="text-3xl font-bold text-zinc-900 mt-2">
                  ฿ {(summary.balance ?? 0).toLocaleString()}
                </h2>
              </div>

              <div className="bg-yellow-200 p-4 rounded-2xl">
                <Wallet size={22} className="text-zinc-800" />
              </div>
            </div>
          </div>

          {/* Income */}
          <div className="bg-white/80 backdrop-blur-sm border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">รายรับทั้งหมด</p>

                <h2 className="text-3xl font-bold text-emerald-600 mt-2">
                  + ฿ {(summary.totalIncome ?? 0).toLocaleString()}
                </h2>
              </div>

              <div className="bg-emerald-100 p-4 rounded-2xl">
                <ArrowUpRight size={22} className="text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Expense */}
          <div className="bg-white/80 backdrop-blur-sm border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">รายจ่ายทั้งหมด</p>

                <h2 className="text-3xl font-bold text-rose-500 mt-2">
                  - ฿ {(summary.totalExpense ?? 0).toLocaleString()}
                </h2>
              </div>

              <div className="bg-rose-100 p-4 rounded-2xl">
                <ArrowDownLeft size={22} className="text-rose-500" />
              </div>
            </div>
          </div>
        </section>

        {/* AI SECTION */}
        <section className="bg-white/80 border border-yellow-100 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-yellow-100">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-200 p-3 rounded-2xl">
                <Sparkles size={20} className="text-zinc-800" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  AI Financial Advisor
                </h2>

                <p className="text-sm text-zinc-500 mt-1">
                  วิเคราะห์และแนะนำแผนการเงินอัตโนมัติด้วย Gemini AI
                </p>
              </div>
            </div>

            <button
              onClick={askGeminiAI}
              disabled={loadingAi}
              className="bg-yellow-300 hover:bg-yellow-400 transition-all duration-200 px-5 py-3 rounded-2xl text-sm font-semibold text-zinc-800 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 w-fit"
            >
              {loadingAi ? "กำลังวิเคราะห์..." : "วิเคราะห์การเงินด้วย AI ✨"}
            </button>
          </div>

          <div className="mt-5 bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
            <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {aiInsight}
            </p>
          </div>
        </section>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORM */}
          <section className="bg-white/80 border border-yellow-100 rounded-3xl p-6 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-yellow-200 p-2 rounded-xl">
                <PlusCircle size={18} />
              </div>

              <h2 className="font-semibold text-zinc-900">
                เพิ่มรายการธุรกรรม
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-600 mb-2">
                  ประเภท
                </label>

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-2xl border border-yellow-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="INCOME">รายรับ</option>

                  <option value="EXPENSE">รายจ่าย</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-600 mb-2">
                  จำนวนเงิน
                </label>

                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-yellow-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-600 mb-2">
                  รายละเอียด
                </label>

                <input
                  type="text"
                  placeholder="เช่น ค่าอาหาร / เงินเดือน"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-yellow-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-300 hover:bg-yellow-400 transition-all duration-200 py-3 rounded-2xl text-sm font-semibold text-zinc-800 shadow-sm hover:shadow-md active:scale-95"
              >
                เพิ่มข้อมูลเข้าสู่ระบบ
              </button>
            </form>
          </section>

          {/* TRANSACTIONS */}
          <section className="lg:col-span-2 bg-white/80 border border-yellow-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-yellow-200 p-2 rounded-xl">
                <TrendingUp size={18} />
              </div>

              <h2 className="font-semibold text-zinc-900">
                ประวัติธุรกรรมล่าสุด
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-yellow-100">
              <table className="w-full text-sm">
                <thead className="bg-yellow-100 text-zinc-700">
                  <tr>
                    <th className="text-left px-5 py-4 font-semibold">
                      รายละเอียด
                    </th>

                    <th className="text-left px-5 py-4 font-semibold">
                      ประเภท
                    </th>

                    <th className="text-right px-5 py-4 font-semibold">
                      จำนวนเงิน
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-10 text-zinc-400"
                      >
                        ยังไม่มีรายการธุรกรรม
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-t border-yellow-50 hover:bg-yellow-50/60 transition"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-800">
                          {tx.description}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              tx.type === "INCOME"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            {tx.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                          </span>
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-semibold ${
                            tx.type === "INCOME"
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"} ฿{" "}
                          {tx.amount.toLocaleString()}
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
    </div>
  );
}
