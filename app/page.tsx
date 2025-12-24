"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-violet-950/20 py-24 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Why Not?
            </h1>
            <p className="mt-4 text-2xl md:text-3xl lg:text-4xl">
              Ideas grow here.
            </p>
            <p className="mt-6 text-lg text-muted md:text-xl">
              No market research. No polish required.
              <br />
              Just sparks of ideas, crazy experiments, unique MVPs -- really, isn't that a better process to create new innovations?
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={user ? "/app" : "/login"} className="btn btn-primary">
                {user ? "Go to Portal" : "Get Started"}
              </Link>
              <Link href="/about" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-3xl" />
      </section>

    </>
  );
}
