import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowDesk AI — Enterprise Service Management & Operations Optimization",
  description: "Intelligent enterprise ticket categorization and mathematical employee assignment optimization powered by Scikit-Learn and Google OR-Tools CP-SAT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#080c16] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
