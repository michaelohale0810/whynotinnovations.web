import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { LightbulbIcon } from "@/components/LightbulbIcon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhyNot Innovations",
  description: "Empowering innovation through creative solutions",
};

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LightbulbIcon size={48} />
            <span className="text-lg font-semibold tracking-tight">
              WhyNot<span className="text-accent">Innovations</span>
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm text-muted">
            <span>By invitation only</span>
            <p>
              &copy; {new Date().getFullYear()} WhyNot Innovations. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
