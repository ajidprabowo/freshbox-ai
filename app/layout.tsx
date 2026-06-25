// app/layout.tsx — Root layout with sidebar + mobile nav

import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "FreshBox AI — Smart Cold Chain Management",
  description:
    "AI-powered modular cold box rental system for reducing food loss and energy waste.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
