import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Placement Interview Analyzer - Practice Smarter, Improve Faster",
  description: "AI-powered placement interview practice and assessment platform for college students. Get dimension-wise scoring, personalized feedback, and placement readiness indicators.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
