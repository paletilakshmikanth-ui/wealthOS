import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WealthOS Infinity • Personal CFO & Wealth Intelligence Platform",
  description: "The Ultimate Personal CFO, Family Office, Wealth Intelligence, and Financial Operating System. Offline-first. AES-256 encrypted. Bloomberg-grade UX.",
  keywords: ["WealthOS", "Personal CFO", "Family Office", "Wealth Management", "FIRE", "Retirement Planning", "Net Worth", "Portfolio Analytics"],
  authors: [{ name: "WealthOS Infinity" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "WealthOS Infinity",
    description: "Personal CFO & Wealth Intelligence Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
