import type { Metadata } from "next";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { AdminDashboard } from "./AdminDashboard";

export const metadata: Metadata = { title: "Панель автора", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="brand"><span className="brand-mark"><Leaf size={19} /></span>СЖАТО.</Link>
        <span>Управление аудиоупражнениями</span>
      </header>
      <AdminDashboard />
    </main>
  );
}

