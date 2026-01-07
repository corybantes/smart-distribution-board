"use client";

import PublicHeader from "../layout/general/public-header";
import PublicFooter from "../layout/general/public-footer";
import AboutHero from "../layout/about/about-hero";
import AboutBody from "../layout/about/about-body";
import AboutArchitecture from "../layout/about/about-architecture";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. PUBLIC NAVBAR */}
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* 2. HERO SECTION */}
        <AboutHero />

        {/* 3. DUAL MODE EXPLANATION */}
        <AboutBody />

        {/* 4. TECHNICAL ARCHITECTURE */}
        <AboutArchitecture />
      </main>

      {/* FOOTER */}
      <PublicFooter />
    </div>
  );
}
