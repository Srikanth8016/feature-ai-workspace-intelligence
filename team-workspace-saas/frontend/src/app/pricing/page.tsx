"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "@/services/billing";
import { useState } from "react";

const FREE_FEATURES = [
  "1 workspace",
  "Up to 3 projects",
  "Kanban board with drag & drop",
  "Task comments & file attachments",
  "Real-time collaboration (WebSocket)",
  "Workspace invitations",
  "Basic analytics",
];

const PRO_FEATURES = [
  "Unlimited workspaces",
  "Unlimited projects",
  "Everything in Free",
  "AI Task Generator",
  "AI Sprint Planner",
  "AI Progress Summarizer",
  "AI Risk Assessor",
  "AI Meeting Notes Parser",
  "AI Chat Assistant",
  "Priority support",
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/register");
      return;
    }
    setIsLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession(token);
      window.location.href = checkout_url;
    } catch (err: any) {
      if (err.response?.data?.detail?.includes("Already on Pro")) {
        router.push("/billing");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <header className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="font-bold text-white">TeamFlow</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">Get Started Free</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Start free. Upgrade when your team needs AI superpowers.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Free Plan */}
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Free</h2>
              <p className="text-zinc-500 text-sm">Perfect for individuals getting started</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-zinc-500 text-sm ml-2">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all text-center border border-zinc-700"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-violet-950/30 border border-indigo-500/40 flex flex-col relative overflow-hidden shadow-xl shadow-indigo-500/10">
            {/* Popular badge */}
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
                Most Popular
              </span>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none" />

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
              <p className="text-zinc-400 text-sm">For teams that move fast with AI</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-white">$12</span>
              <span className="text-zinc-400 text-sm ml-2">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-200">
                  <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isLoading ? "Redirecting to Stripe..." : "Upgrade to Pro →"}
            </button>
          </div>

        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing portal and you keep Pro access until the end of the billing period." },
              { q: "Is there a free trial for Pro?", a: "The Free plan gives you full access to core features. Upgrade to Pro when you're ready for AI." },
              { q: "What payment methods are accepted?", a: "All major credit and debit cards via Stripe. Your payment details are never stored on our servers." },
              { q: "Can I switch back to Free?", a: "Yes. Cancel your subscription and your account reverts to the Free plan limits at the next billing cycle." },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <p className="font-semibold text-white text-sm mb-2">{q}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
