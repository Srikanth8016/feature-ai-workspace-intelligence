"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getCurrentUser } from "@/services/user";
import { getWorkspaces } from "@/services/workspace";
import { getWorkspaceAnalytics } from "@/services/analytics";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState("");
  const [workspace, setWorkspace] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    loadAll(token);
  }, [id]);

  const loadAll = async (token: string) => {
    try {
      const [userData, wsData, analyticsData, notifData] = await Promise.all([
        getCurrentUser(token),
        getWorkspaces(token),
        getWorkspaceAnalytics(token, Number(id)),
        getNotifications(token),
      ]);
      setUser(userData.logged_in_user);
      setWorkspace(wsData.find((w: any) => w.id === Number(id)) || null);
      setAnalytics(analyticsData);
      setNotifications(notifData);
    } catch (err: any) {
      if (err.response?.status === 401) { Cookies.remove("token"); router.push("/login"); }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (notifId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    await markNotificationAsRead(token, notifId);
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n));
  };
  const handleDeleteNotification = async (notifId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    await deleteNotification(token, notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };
  const handleMarkAllRead = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    await Promise.all(notifications.filter((n) => !n.is_read).map((n) => markNotificationAsRead(token, n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const statCard = (label: string, value: any, color: string, icon: React.ReactNode) => (
    <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-400 font-medium">{label}</span>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">{isLoading ? "—" : value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Sidebar workspaceId={id} workspaceName={workspace?.name} user={user} notifications={notifications} onNotificationsClick={() => setShowNotifications(true)} />
      {showNotifications && <NotificationsPanel notifications={notifications} onMarkRead={handleMarkRead} onDelete={handleDeleteNotification} onMarkAllRead={handleMarkAllRead} onClose={() => setShowNotifications(false)} />}

      <main className="ml-60 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-300">Workspaces</Link>
            <span>/</span>
            <Link href={`/workspace/${id}`} className="hover:text-zinc-300">{workspace?.name || "..."}</Link>
            <span>/</span>
            <span className="text-zinc-300">Analytics</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-8">Analytics</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {statCard("Total Projects", analytics?.total_projects ?? 0, "bg-indigo-500/10",
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            )}
            {statCard("Total Tasks", analytics?.total_tasks ?? 0, "bg-violet-500/10",
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            )}
            {statCard("Completed", analytics?.completed_tasks ?? 0, "bg-emerald-500/10",
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {statCard("Pending", analytics?.pending_tasks ?? 0, "bg-amber-500/10",
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {statCard("Overdue", analytics?.overdue_tasks ?? 0, "bg-red-500/10",
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            {statCard("Completion Rate", `${analytics?.completion_rate ?? 0}%`, "bg-cyan-500/10",
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            )}
          </div>

          {/* Priority Breakdown */}
          {analytics && (
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h2 className="font-bold text-white mb-5">Priority Breakdown</h2>
              <div className="space-y-4">
                {[
                  { label: "High", value: analytics.priority_stats?.high ?? 0, color: "bg-red-500", total: analytics.total_tasks },
                  { label: "Medium", value: analytics.priority_stats?.medium ?? 0, color: "bg-amber-500", total: analytics.total_tasks },
                  { label: "Low", value: analytics.priority_stats?.low ?? 0, color: "bg-emerald-500", total: analytics.total_tasks },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                      <span className="text-zinc-500">{item.value} tasks</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
