import type { Metadata } from "next";
import { Nunito_Sans, Lexend } from "next/font/google";
import "./globals.css";

// Настраиваем основной шрифт для контента и кириллицы
const nunito = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});

// Настраиваем шрифт для логотипа и латиницы
const lexend = Lexend({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Aerobic Space+",
  description: "Система мониторинга и рейтинга",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${nunito.variable} ${lexend.variable}`}>
        {children}
      </body>
    </html>
  );
}
