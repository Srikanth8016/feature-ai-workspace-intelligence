"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "login_required">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link.");
      return;
    }

    const authToken = Cookies.get("token");
    if (!authToken) {
      // Store token in sessionStorage so we can auto-accept after login
      sessionStorage.setItem("pending_invite_token", token);
      setStatus("login_required");
      return;
    }

    acceptInvite(authToken, token);
  }, [token]);

  const acceptInvite = async (authToken: string, inviteToken: string) => {
    try {
      await api.post(
        `/invitations/accept/${inviteToken}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.detail || "Failed to accept invitation.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {status === "loading" && (
          <>
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm">Accepting your invitation...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You're in!</h2>
            <p className="text-sm text-zinc-400">Successfully joined the workspace. Redirecting to dashboard...</p>
          </>
        )}

        {status === "login_required" && (
          <>
            <h2 className="text-xl font-bold text-white mb-3">Sign in to accept</h2>
            <p className="text-sm text-zinc-400 mb-6">
              You need to be signed in to accept this invitation. Your invite will be processed automatically after login.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/login?redirect=/invite/accept?token=${token}`}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all text-center text-sm"
              >
                Sign In
              </Link>
              <Link
                href={`/register?redirect=/invite/accept?token=${token}`}
                className="w-full py-3 rounded-xl font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all text-center text-sm"
              >
                Create Account
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Invitation Error</h2>
            <p className="text-sm text-zinc-400 mb-6">{message}</p>
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
              Go to Dashboard →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
