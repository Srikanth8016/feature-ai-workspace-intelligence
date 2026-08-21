"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getCurrentUser } from "@/services/user";
import { getWorkspaces } from "@/services/workspace";
import { getProjects, createProject } from "@/services/project";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState("");
  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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
      const [userData, wsData, projectData, notifData] = await Promise.all([
        getCurrentUser(token),
        getWorkspaces(token),
        getProjects(token, Number(id)),
        getNotifications(token),
      ]);
      setUser(userData.logged_in_user);
      const ws = wsData.find((w: any) => w.id === Number(id));
      setWorkspace(ws || null);
      setProjects(projectData);
      setNotifications(notifData);
    } catch (err: any) {
      if (err.response?.status === 401) { Cookies.remove("token"); router.push("/login"); }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const token = Cookies.get("token");
    if (!token) return;
    setIsCreating(true);
    try {
      await createProject(token, newProjectName.trim(), Number(id));
      setNewProjectName("");
      const data = await getProjects(token, Number(id));
      setProjects(data);
    } finally {
      setIsCreating(false);
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
    const unreads = notifications.filter((n) => !n.is_read);
    await Promise.all(unreads.map((n) => markNotificationAsRead(token, n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Sidebar
        workspaceId={id}
        workspaceName={workspace?.name}
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
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Workspaces</Link>
                <span>/</span>
                <span className="text-zinc-300">{workspace?.name || "..."}</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{workspace?.name || "Loading..."}</h1>
              {workspace?.role && (
                <p className="text-xs text-zinc-500 mt-1">Your role: <span className="capitalize text-indigo-400 font-semibold">{workspace.role}</span></p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/workspace/${id}/analytics`}
                className="px-4 py-2 rounded-xl text-sm text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Analytics
              </Link>
              <Link
                href={`/workspace/${id}/members`}
                className="px-4 py-2 rounded-xl text-sm text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Members
              </Link>
            </div>
          </div>

          {/* Create Project */}
          <div className="mb-8 flex gap-3">
            <input
              type="text"
              placeholder="New project name..."
              className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all max-w-sm"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
            <button
              onClick={handleCreateProject}
              disabled={isCreating || !newProjectName.trim()}
              className="px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {isCreating ? "Creating..." : "New Project"}
            </button>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-zinc-800/40 border-dashed">
              <svg className="w-12 h-12 text-zinc-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-zinc-500 font-medium">No projects yet</p>
              <p className="text-zinc-600 text-sm mt-1">Create your first project above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/workspace/${id}/board/${project.id}`}
                  className="group p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/[0.03] transition-all duration-300 block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                      <svg className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">{project.name}</h3>
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    <span>Open board</span>
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
