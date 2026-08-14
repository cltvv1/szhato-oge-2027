"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Dumbbell, FilePenLine, Headphones, Leaf } from "lucide-react";
import { useProgress } from "./ProgressProvider";

const links = [
  { href: "/theory", label: "Теория", icon: BookOpen },
  { href: "/practice", label: "Практика", icon: Dumbbell },
  { href: "/audio", label: "Аудио", icon: Headphones },
  { href: "/simulator", label: "Экзамен", icon: FilePenLine },
  { href: "/student", label: "Результаты", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { completed } = useProgress();
  const [coreIds, setCoreIds] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/course-summary", { signal: controller.signal }).then((response) => response.json()).then((data) => setCoreIds(Array.isArray(data.coreIds) ? data.coreIds : [])).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const coreDone = coreIds.filter((id) => completed.includes(id)).length;
  const percent = coreIds.length ? Math.min(100, Math.round((coreDone / coreIds.length) * 100)) : 0;
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="СЖАТО — на главную">
            <span className="brand-mark"><Leaf size={19} /></span>
            СЖАТО.
          </Link>
          <nav className="nav" aria-label="Основная навигация">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={`nav-link ${path === href ? "active" : ""}`}>{label}</Link>
            ))}
          </nav>
          <div className="header-progress" title="Общий прогресс">
            <span className="mini-ring" style={{ "--progress": `${percent}%` } as React.CSSProperties}><span>{percent}%</span></span>
            <span className="desktop-only">Мой прогресс</span>
          </div>
        </div>
      </header>
      {children}
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`mobile-link ${path === href ? "active" : ""}`}><Icon size={18} />{label}</Link>
        ))}
      </nav>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div><strong>СЖАТО.</strong> Интерактивная подготовка к изложению ОГЭ — 2027</div>
          <div>Автор программы: Кроневальд Анна Андреевна · <Link href="/admin">Панель автора</Link></div>
        </div>
      </footer>
    </div>
  );
}
