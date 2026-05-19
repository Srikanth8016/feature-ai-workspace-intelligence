"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-wide font-sans">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-zinc-200 text-black transition-all shadow-md shadow-white/10"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto w-full px-6 pt-16 pb-20 relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-8 animate-in fade-in duration-500">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>Real-time collaborative SaaS platform is now live!</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight font-sans">
          Collaborate and manage projects at the{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            speed of light
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-xl font-light leading-relaxed">
          An elegant, hyper-reactive workspace platform featuring dynamic Kanban boards, live discussions, secure file sharing, and robust role-based access.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group"
          >
            <span>Start Free Trial</span>
            <svg className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center justify-center"
          >
            Explore Features
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <section id="features" className="mt-28 w-full border-t border-zinc-900 pt-20">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center mb-16 font-sans">
            Powering Productive Teams
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors text-base font-sans">
                Real-Time Kanban
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-2 leading-relaxed">
                Drag, drop, and complete tasks. All operations sync in milliseconds across active team member screens globally via WebSockets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors text-base font-sans">
                Task Comments Feed
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-2 leading-relaxed">
                Start contextual discussions directly inside task cards. Keep communication in one place with fully-featured chat timelines.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors text-base font-sans">
                Asset Sharing
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-2 leading-relaxed">
                Attach images, documents, and reference files to task cards. Instant download badges appear live for collaborators.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/20 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© 2026 Antigravity Workspace. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/login" className="hover:text-white transition-colors">Support Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
