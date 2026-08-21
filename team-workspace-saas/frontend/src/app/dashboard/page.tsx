"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getCurrentUser } from "@/services/user";
import { getWorkspaces, createWorkspace } from "@/services/workspace";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";
import { getPendingInvitations, acceptInvitation } from "@/services/invitation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    loadAll(token);
  }, []);

  const loadAll = async (token: string) => {
    try {
      const [userData, wsData, notifData, inviteData] = await Promise.all([
        getCurrentUser(token),
        getWorkspaces(token),
        getNotifications(token),
        getPendingInvitations(token),
      ]);
      setUser(userData.logged_in_user);
      setWorkspaces(wsData);
      setNotifications(notifData);
      setPendingInvites(inviteData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        Cookies.remove("token");
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    const token = Cookies.get("token");
    if (!token) return;
    setIsCreating(true);
    try {
      await createWorkspace(token, newWorkspaceName.trim());
      setNewWorkspaceName("");
      const wsData = await getWorkspaces(token);
      setWorkspaces(wsData);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptInvite = async (inviteToken: string) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await acceptInvitation(token, inviteToken);
      const [wsData, inviteData] = await Promise.all([
        getWorkspaces(token),
        getPendingInvitations(token),
      ]);
      setWorkspaces(wsData);
      setPendingInvites(inviteData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    await markNotificationAsRead(token, id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleDeleteNotification = async (id: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    await deleteNotification(token, id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    const unreads = notifications.filter((n) => !n.is_read);
    await Promise.all(unreads.map((n) => markNotificationAsRead(token, n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const roleColor = (role: string) => {
    if (role === "owner") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (role === "admin") return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Sidebar
        user={user}
        notifications={notifications}
        onNotificationsClick={() => setShowNotifications(true)}
      />

      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onDelete={handleDeleteNotification}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setShowNotifications(false)}
        />
      )}

      <main className="ml-60 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{user || "..."}</span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">Select a workspace to get started, or create a new one.</p>
          </div>

          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <section className="mb-8 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                Pending Invitations ({pendingInvites.length})
              </h2>
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Join <span className="text-indigo-400">{invite.workspace_name}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Role: <span className="capitalize text-zinc-300">{invite.role}</span></p>
                    </div>
                    <button
                      onClick={() => handleAcceptInvite(invite.token)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Create Workspace */}
          <div className="mb-8 flex gap-3">
            <input
              type="text"
              placeholder="New workspace name..."
              className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all max-w-sm"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
            />
            <button
              onClick={handleCreateWorkspace}
              disabled={isCreating || !newWorkspaceName.trim()}
              className="px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {isCreating ? "Creating..." : "Create Workspace"}
            </button>
          </div>

          {/* Workspaces Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 animate-pulse" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-zinc-800/40 border-dashed">
              <svg className="w-12 h-12 text-zinc-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-zinc-500 font-medium">No workspaces yet</p>
              <p className="text-zinc-600 text-sm mt-1">Create one above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="group p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/[0.03] transition-all duration-300 block"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:from-indigo-500/30 group-hover:to-violet-500/30 transition-all">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">{ws.name}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${roleColor(ws.role)}`}>
                      {ws.role}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    <span>Open workspace</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
