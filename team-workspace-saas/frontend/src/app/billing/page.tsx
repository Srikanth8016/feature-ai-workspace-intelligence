"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/services/user";
import { getSubscription, createCheckoutSession, createPortalSession } from "@/services/billing";
import { getNotifications } from "@/services/notification";

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState("");
  const [subscription, setSubscription] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const justSucceeded = searchParams.get("success") === "true";
  const justCanceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    loadAll(token);
  }, []);

  const loadAll = async (token: string) => {
    try {
      const [userData, subData, notifData] = await Promise.all([
        getCurrentUser(token),
        getSubscription(token),
        getNotifications(token),
      ]);
      setUser(userData.logged_in_user);
      setSubscription(subData);
      setNotifications(notifData);
    } catch (err: any) {
      if (err.response?.status === 401) { Cookies.remove("token"); router.push("/login"); }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    setActionLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession(token);
      window.location.href = checkout_url;
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start checkout.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    setActionLoading(true);
    try {
      const { portal_url } = await createPortalSession(token);
      window.location.href = portal_url;
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to open billing portal.");
    } finally {
      setActionLoading(false);
    }
  };

  const isPro = subscription?.plan === "pro";
  const isActive = subscription?.subscription_status === "active";

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Sidebar user={user} notifications={notifications} />

      <main className="ml-60 min-h-screen">
        <div className="max-w-2xl mx-auto px-8 py-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white">Billing & Plan</h1>
            <p className="text-zinc-400 mt-1 text-sm">Manage your subscription and usage limits.</p>
          </div>

          {/* Success / Cancel Banners */}
          {justSucceeded && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>You're now on <strong>Pro</strong>! All AI features are unlocked. Welcome aboard 🚀</span>
            </div>
          )}
          {justCanceled && (
            <div className="mb-6 p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-sm">
              Checkout was canceled. You're still on the {isPro ? "Pro" : "Free"} plan.
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Current Plan Card */}
              <div className={`p-6 rounded-2xl border mb-6 ${isPro && isActive ? "bg-indigo-950/20 border-indigo-500/30" : "bg-zinc-900/40 border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                      Current Plan
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${
                        isPro && isActive
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {isPro && isActive ? "Pro" : "Free"}
                      </span>
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      {isPro && isActive
                        ? "Full access to all features including AI"
                        : "Limited to 1 workspace, 3 projects, no AI"}
                    </p>
                  </div>
                  {isPro && isActive && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">$12</p>
                      <p className="text-xs text-zinc-500">per month</p>
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800/60">
                  {[
                    { label: "Workspaces", value: isPro ? "Unlimited" : "1" },
                    { label: "Projects", value: isPro ? "Unlimited" : "3 / workspace" },
                    { label: "AI Features", value: isPro ? "✓ Included" : "✗ Not included" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 rounded-xl bg-zinc-950/30">
                      <p className="text-xs text-zinc-500 mb-1">{label}</p>
                      <p className={`text-sm font-semibold ${isPro ? "text-indigo-300" : "text-zinc-300"}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {isPro && isActive ? (
                <div className="space-y-3">
                  <button
                    onClick={handleManage}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {actionLoading ? "Opening portal..." : "Manage Subscription (cancel, invoices, card)"}
                  </button>
                  <p className="text-xs text-zinc-600 text-center">
                    You'll be redirected to Stripe's secure billing portal.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Upgrade card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-violet-950/20 border border-indigo-500/30">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Upgrade to Pro — $12/month
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4">
                      Unlock unlimited workspaces, unlimited projects, and all 6 AI features.
                    </p>
                    <ul className="space-y-2 mb-5">
                      {["AI Task Generator", "AI Sprint Planner", "AI Risk Assessor", "AI Chat Assistant", "Unlimited workspaces & projects"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                          <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleUpgrade}
                      disabled={actionLoading}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {actionLoading ? "Redirecting to Stripe..." : "Upgrade to Pro →"}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 text-center">
                    Secure checkout powered by Stripe. Cancel anytime.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 pt-6 border-t border-zinc-800/60 flex gap-4">
                <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">← Back to Dashboard</Link>
                <Link href="/pricing" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View pricing details →</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <BillingContent />
    </Suspense>
  );
}
