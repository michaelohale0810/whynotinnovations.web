"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { UserBadge } from "./UserBadge";
import { useAuth } from "./AuthProvider";
import { LightbulbIcon } from "./LightbulbIcon";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
];

export function Header() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const participantPortalHref = user ? "/app" : "/login";

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.uid) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        setIsAdmin(adminDoc.exists());
      } catch (error) {
        setIsAdmin(false);
      }
    };

    if (user) {
      checkAdmin();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LightbulbIcon size={48} />
          <span className="text-lg font-semibold tracking-tight">
            WhyNot<span className="text-accent">Innovations</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-border hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={participantPortalHref}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-border hover:text-foreground"
            >
              Participant Portal
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              >
                Admin
              </Link>
            )}
          </nav>

          <UserBadge />

          {/* Mobile menu button */}
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
