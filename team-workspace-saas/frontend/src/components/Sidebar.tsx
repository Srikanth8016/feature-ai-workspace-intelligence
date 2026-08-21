"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

interface SidebarProps {
  workspaceId?: string;
  workspaceName?: string;
  user?: string;
  notifications?: any[];
  onNotificationsClick?: () => void;
}

export default function Sidebar({
  workspaceId,
  workspaceName,
  user,
  notifications = [],
  onNotificationsClick,
}: SidebarProps) {
  const pathname = usePathname();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const logout = () => {
    Cookies.remove("token");
    window.location.href = "/login";
  };

  const navItem = (href: string, label: string, icon: React.ReactNode, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
        }`}
      >
        <span className={active ? "text-indigo-400" : "text-zinc-500"}>{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-zinc-950/90 border-r border-zinc-800/80 backdrop-blur-xl flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm">TeamFlow</span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Global */}
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-3 mb-2">Home</p>
        {navItem(
          "/dashboard",
          "Workspaces",
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
          true
        )}

        {/* Workspace-scoped nav */}
        {workspaceId && (
          <>
            <div className="pt-3">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-3 mb-2 truncate">
                {workspaceName || "Workspace"}
              </p>
            </div>
            {navItem(
              `/workspace/${workspaceId}`,
              "Overview",
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
              true
            )}
            {navItem(
              `/workspace/${workspaceId}/analytics`,
              "Analytics",
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            )}
            {navItem(
              `/workspace/${workspaceId}/ai`,
              "AI Hub",
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            {navItem(
              `/workspace/${workspaceId}/members`,
              "Members",
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </>
        )}
      </nav>

      {/* Bottom user section */}
      <div className="p-4 border-t border-zinc-800/60 space-y-2">
        <Link
          href="/billing"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
        >
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Billing & Plan
        </Link>
        <button
          onClick={onNotificationsClick}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
        >
          <span className="flex items-center gap-3">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="h-5 w-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 uppercase">
            {user?.[0] || "U"}
          </div>
          <span className="text-sm text-zinc-300 truncate flex-1 font-medium">{user || "User"}</span>
          <button onClick={logout} title="Log out" className="text-zinc-600 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
