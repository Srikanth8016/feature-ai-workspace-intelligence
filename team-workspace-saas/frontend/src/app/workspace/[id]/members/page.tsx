"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getCurrentUser } from "@/services/user";
import { getWorkspaces, getWorkspaceMembers, updateWorkspaceMemberRole, removeWorkspaceMember } from "@/services/workspace";
import { inviteUser } from "@/services/invitation";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceRole, setWorkspaceRole] = useState("member");
  const [members, setMembers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    loadAll(token);
  }, [id]);

  const loadAll = async (token: string) => {
    try {
      const [userData, wsData, memberData, notifData] = await Promise.all([
        getCurrentUser(token),
        getWorkspaces(token),
        getWorkspaceMembers(token, Number(id)),
        getNotifications(token),
      ]);
      setUser(userData.logged_in_user);
      setUserEmail(userData.email);
      const ws = wsData.find((w: any) => w.id === Number(id));
      setWorkspace(ws || null);
      setWorkspaceRole(ws?.role || "member");
      setMembers(memberData);
      setNotifications(notifData);
    } catch (err: any) {
      if (err.response?.status === 401) { Cookies.remove("token"); router.push("/login"); }
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const token = Cookies.get("token");
    if (!token) return;
    setIsInviting(true);
    setInviteSuccess(""); setInviteError("");
    try {
      await inviteUser(token, { email: inviteEmail.trim(), role: inviteRole, workspace_id: Number(id) });
      setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || "Failed to send invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await updateWorkspaceMemberRole(token, Number(id), userId, role);
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update role.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Remove this member from the workspace?")) return;
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await removeWorkspaceMember(token, Number(id), userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to remove member.");
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

  const canManage = workspaceRole === "owner" || workspaceRole === "admin";
  const roleColor = (role: string) => {
    if (role === "owner") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (role === "admin") return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Sidebar workspaceId={id} workspaceName={workspace?.name} user={user} notifications={notifications} onNotificationsClick={() => setShowNotifications(true)} />
      {showNotifications && <NotificationsPanel notifications={notifications} onMarkRead={handleMarkRead} onDelete={handleDeleteNotification} onMarkAllRead={handleMarkAllRead} onClose={() => setShowNotifications(false)} />}

      <main className="ml-60 min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-300">Workspaces</Link>
            <span>/</span>
            <Link href={`/workspace/${id}`} className="hover:text-zinc-300">{workspace?.name || "..."}</Link>
            <span>/</span>
            <span className="text-zinc-300">Members</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-8">Team Members</h1>

          {/* Invite Form (admin/owner only) */}
          {canManage && (
            <div className="mb-8 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h2 className="font-bold text-white mb-4 text-sm">Invite a team member</h2>
              {inviteSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{inviteSuccess}</div>
              )}
              {inviteError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{inviteError}</div>
              )}
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="colleague@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="flex-1 px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-3">An invitation email will be sent to the address above.</p>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => {
              const isSelf = member.email === userEmail;
              const canManageMember = canManage && !isSelf && member.role !== "owner";
              return (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 uppercase">
                      {member.username?.[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white text-sm">{member.username}</p>
                        {isSelf && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">You</span>}
                      </div>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageMember ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2 py-1.5 outline-none focus:border-violet-500 transition-all"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors bg-zinc-900 border border-zinc-800 hover:border-red-500/20 hover:bg-red-500/10 rounded-lg"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    ) : (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${roleColor(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
