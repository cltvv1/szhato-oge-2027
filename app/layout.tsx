import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "./components/ProgressProvider";

export const metadata: Metadata = {
  title: {
    default: "СЖАТО — подготовка к изложению ОГЭ",
    template: "%s · СЖАТО",
  },
  description:
    "Интерактивный курс Анны Кроневальд: теория, 26 упражнений и экзаменационный тренажёр для подготовки девятиклассников к сжатому изложению ОГЭ — 2027.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "СЖАТО — подготовка к изложению ОГЭ",
    description: "Теория, 26 упражнений и экзаменационный тренажёр для 9 класса.",
    images: [{ url: "/og.png", width: 1680, height: 945 }],
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
