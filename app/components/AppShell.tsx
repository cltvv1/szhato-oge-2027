"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Dumbbell, FilePenLine, House, Leaf } from "lucide-react";
import { useProgress } from "./ProgressProvider";

const links = [
  { href: "/", label: "Главная", icon: House },
  { href: "/theory", label: "Теория", icon: BookOpen },
  { href: "/practice", label: "Практика", icon: Dumbbell },
  { href: "/simulator", label: "Экзамен", icon: FilePenLine },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { completed } = useProgress();
  const percent = Math.round((completed.length / 32) * 100);
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
          <div>Автор программы: Кроневальд Анна Андреевна</div>
        </div>
      </footer>
    </div>
  );
}
