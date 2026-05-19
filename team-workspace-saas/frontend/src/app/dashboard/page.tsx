"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

import { createWorkspace, getWorkspaces, getWorkspaceMembers, updateWorkspaceMemberRole, removeWorkspaceMember } from "@/services/workspace";
import { getCurrentUser, updateCurrentUser } from "@/services/user";
import { createProject, getProjects } from "@/services/project";
import { createTask, getTasks, updateTaskStatus, deleteTask } from "@/services/task";
import { uploadFile } from "@/services/upload";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";
import { inviteUser, getPendingInvitations, acceptInvitation } from "@/services/invitation";
import { getWorkspaceAnalytics } from "@/services/analytics";
import { generateAITasks, summarizeWorkspaceProgress, generateAISprintPlan } from "@/services/ai";
import KanbanBoard from "@/components/KanbanBoard";

export default function DashboardPage() {
  const [user, setUser] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedWorkspaceRole, setSelectedWorkspaceRole] = useState("member");
  const [name, setName] = useState("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  // Project States
  const [projects, setProjects] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null);

  // Task States
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  // Invitation States
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  // Task Assignee State
  const [taskAssignedTo, setTaskAssignedTo] = useState<number | "">("");

  // Analytics States
  const [analytics, setAnalytics] = useState<any>(null);

  // Search, Filter & View States
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // AI Task Generator States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // AI Task Summarizer States
  const [aiSummaryResult, setAiSummaryResult] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // AI Agile Sprint Planner States
  const [aiSprintPrompt, setAiSprintPrompt] = useState("");
  const [aiSprintResult, setAiSprintResult] = useState("");
  const [aiSprintLoading, setAiSprintLoading] = useState(false);

  const fetchData = async () => {
    const token = Cookies.get("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const userData = await getCurrentUser(token);
      setUser(userData.logged_in_user);
      setUserEmail(userData.email);
      setNewUsername(userData.logged_in_user);
      setNewEmail(userData.email);

      const workspaceData = await getWorkspaces(token);
      setWorkspaces(workspaceData);

      const pendingRes = await getPendingInvitations(token);
      setPendingInvites(pendingRes);
    } catch (err: any) {
      console.error(err);
      // If the token is invalid or expired (401), clear cookies and redirect to login
      if (err.response?.status === 401) {
        Cookies.remove("token");
        window.location.href = "/login";
      }
    }
  };

  const handleUpdateProfile = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const res = await updateCurrentUser(token, newUsername, newEmail);
      setUser(res.logged_in_user);
      setUserEmail(res.email);
      alert("Profile updated successfully!");
      setShowSettingsModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update profile.");
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(token, taskId);
        alert("Task deleted successfully!");
        if (selectedProject) {
          fetchTasks(selectedProject);
        }
        if (selectedWorkspace) {
          fetchAnalyticsData(selectedWorkspace);
        }
      } catch (err: any) {
        alert(err.response?.data?.detail || "Failed to delete task.");
      }
    }
  };

  const fetchNotifications = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Connect to WebSocket tasks endpoint
    const ws = new WebSocket("ws://127.0.0.1:8000/tasks");

    ws.onmessage = () => {
      if (selectedProject) {
        fetchTasks(selectedProject);
      }
      if (selectedWorkspace) {
        fetchAnalyticsData(selectedWorkspace);
      }
    };

    return () => ws.close();
  }, [selectedProject]);

  const handleCreate = async () => {
    const token = Cookies.get("token");
    if (!token) return;

    await createWorkspace(token, name);
    setName("");
    fetchData();
  };

  const handleCreateProject = async () => {
    const token = Cookies.get("token");
    if (!token || !selectedWorkspace) return;

    await createProject(token, projectName, selectedWorkspace);
    setProjectName("");
    fetchProjects(selectedWorkspace);
  };

  const fetchProjects = async (workspaceId: number) => {
    const token = Cookies.get("token");
    if (!token) return;

    const data = await getProjects(token, workspaceId);
    setProjects(data);
    // Clear selected project and tasks when workspace changes
    setSelectedProject(null);
    setTasks([]);
  };

  const fetchWorkspaceMembers = async (workspaceId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await getWorkspaceMembers(token, workspaceId);
      setWorkspaceMembers(data);
    } catch (err) {
      console.error("Failed to fetch workspace members", err);
    }
  };

  const handleUpdateMemberRole = async (userId: number, role: string) => {
    const token = Cookies.get("token");
    if (!token || !selectedWorkspace) return;
    try {
      await updateWorkspaceMemberRole(token, selectedWorkspace, userId, role);
      fetchWorkspaceMembers(selectedWorkspace);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this member from the workspace?")) return;
    const token = Cookies.get("token");
    if (!token || !selectedWorkspace) return;
    try {
      await removeWorkspaceMember(token, selectedWorkspace, userId);
      fetchWorkspaceMembers(selectedWorkspace);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to remove member");
    }
  };

  // Task Functions
  const fetchTasks = async (projectId: number) => {
    const token = Cookies.get("token");
    if (!token) return;

    const data = await getTasks(token, projectId);
    setTasks(data);
  };

  const handleCreateTask = async () => {
    const token = Cookies.get("token");
    if (!token || !selectedProject) return;

    await createTask(token, {
      title: taskTitle,
      description: taskDescription,
      status: "todo",
      priority: "high",
      due_date: new Date(),
      project_id: selectedProject,
      assigned_to: taskAssignedTo ? Number(taskAssignedTo) : null
    });

    setTaskTitle("");
    setTaskDescription("");
    setTaskAssignedTo("");
    fetchTasks(selectedProject);
  };

  const logout = () => {
    Cookies.remove("token");
    window.location.href = "/login";
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const taskId = Number(result.draggableId);
    const newStatus = result.destination.droppableId;
    const token = Cookies.get("token");
    if (!token) return;

    // Optimistically update the task state immediately for an ultra-snappy feedback feel
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    try {
      await updateTaskStatus(token, taskId, newStatus);
    } catch (err) {
      console.error("Failed to update task status on backend", err);
      // Revert/refetch tasks from database if network request failed
      if (selectedProject) {
        fetchTasks(selectedProject);
      }
    }
  };

  const handleUpload = async (taskId: number, file: File) => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      await uploadFile(token, taskId, file);
      alert("File uploaded successfully!");
      if (selectedProject) {
        fetchTasks(selectedProject);
      }
      if (selectedWorkspace) {
        fetchAnalyticsData(selectedWorkspace);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file.");
    }
  };

  const fetchAnalyticsData = async (workspaceId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await getWorkspaceAnalytics(token, workspaceId);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load workspace analytics", err);
    }
  };

  const handleAcceptInvite = async (inviteToken: string) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await acceptInvitation(token, inviteToken);
      alert("Successfully joined workspace!");
      fetchData();
    } catch (err) {
      console.error("Failed to accept invitation", err);
      alert("Failed to accept workspace invitation.");
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await markNotificationAsRead(token, notificationId);
      const updated = await getNotifications(token);
      setNotifications(updated);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await deleteNotification(token, notificationId);
      const updated = await getNotifications(token);
      setNotifications(updated);
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleMarkAllRead = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const unreads = notifications.filter(n => !n.is_read);
      await Promise.all(unreads.map(n => markNotificationAsRead(token, n.id)));
      const updated = await getNotifications(token);
      setNotifications(updated);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleInvite = async () => {
    const token = Cookies.get("token");
    if (!token || !selectedWorkspace) return;
    try {
      const response = await inviteUser(token, {
        email: inviteEmail,
        role: inviteRole,
        workspace_id: selectedWorkspace
      });

      if (response.error) {
        alert(response.error);
      } else {
        alert(`Invitation created successfully!\nInvite Token: ${response.invite_token}`);
        setInviteEmail("");
        fetchWorkspaceMembers(selectedWorkspace);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Invitation failed.");
    }
  };

  const handleAI = async () => {
    const token = Cookies.get("token");
    if (!token || !aiPrompt) return;
    setAiLoading(true);
    try {
      const data = await generateAITasks(token, aiPrompt);
      setAiResult(data.response);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "AI task generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSummarizeWorkspace = async () => {
    const token = Cookies.get("token");
    if (!token || !selectedWorkspace) return;
    setAiSummaryLoading(true);
    try {
      const data = await summarizeWorkspaceProgress(token, selectedWorkspace);
      setAiSummaryResult(data.response);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "AI task summarization failed.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleSprintPlanner = async () => {
    const token = Cookies.get("token");
    if (!token || !aiSprintPrompt) return;
    setAiSprintLoading(true);
    try {
      const data = await generateAISprintPlan(token, aiSprintPrompt);
      setAiSprintResult(data.response);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "AI sprint planning failed.");
    } finally {
      setAiSprintLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    const matchesAssignee = 
      assigneeFilter === "all" || 
      (assigneeFilter === "unassigned" && !task.assigned_to) ||
      (task.assigned_to === Number(assigneeFilter));

    return matchesSearch && matchesPriority && matchesAssignee;
  });
  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-hidden">
      {/* Ambient background glow points */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        
        {/* Navigation Bar */}
        <header className="flex justify-between items-center mb-12 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-sans">
                SaaS Workspaces
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Logged in as <span className="text-indigo-400 font-semibold">{user || "User"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all relative flex items-center justify-center group"
                title="Notifications"
              >
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-3 w-80 p-4 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-3 duration-250 flex flex-col gap-3 min-w-[320px]">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-sans">
                      Notifications Inbox
                    </h3>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 text-center font-light italic py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all flex items-start justify-between gap-2.5 relative group/item ${
                            n.is_read 
                              ? "bg-zinc-950/20 border-zinc-900/60 text-zinc-400" 
                              : "bg-indigo-500/[0.03] border-indigo-500/10 text-zinc-200 shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {/* Unread indicator */}
                            {!n.is_read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-light break-words">{n.message}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Checkmark Mark Read button */}
                            {!n.is_read && (
                              <button
                                onClick={() => handleMarkNotificationAsRead(n.id)}
                                className="p-1 rounded-lg hover:bg-indigo-500/10 text-zinc-500 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/20"
                                title="Mark read"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteNotification(n.id)}
                              className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                              title="Delete"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-850 hover:bg-zinc-850/80 border border-zinc-800/80 text-zinc-300 hover:text-white transition-all flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 text-zinc-400 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-850 hover:bg-zinc-850/80 border border-zinc-800/80 text-zinc-300 hover:text-white transition-all flex items-center gap-2 group"
            >
              <span>Log out</span>
              <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Section: AI Intelligence Hub */}
        <section className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-zinc-900/30 to-violet-950/20 border border-indigo-500/20 backdrop-blur-md shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
          <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none rounded-bl-3xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-sans">
                AI Workspace Intelligence Hub
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-light">Accelerate your agile workflow with smart generators and automatic telemetry summarization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tool 1: AI Task Generator */}
            <div className="p-5 rounded-xl bg-zinc-950/30 border border-zinc-800/80 flex flex-col justify-between min-h-[220px]">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  AI Task Generator
                </h4>
                <p className="text-[10px] text-zinc-500 font-light mb-3">Instantly generate structured subtasks for your backlog</p>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-850 focus:border-indigo-500 outline-none text-white text-[11px] placeholder-zinc-650 rounded-lg transition-all font-light resize-none"
                  rows={3}
                  placeholder="Describe your next feature..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>
              <button
                onClick={handleAI}
                disabled={aiLoading || !aiPrompt}
                className="w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? "Generating..." : "Generate Tasks"}
              </button>
            </div>

            {/* Tool 2: AI Task & Progress Summarizer */}
            <div className="p-5 rounded-xl bg-zinc-950/30 border border-zinc-800/80 flex flex-col justify-between min-h-[220px]">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI Progress Summarizer
                </h4>
                <p className="text-[10px] text-zinc-500 font-light mb-3">Synthesizes active project progress & daily activity streams</p>
                <div className="py-8 px-4 rounded-lg bg-zinc-950/20 border border-zinc-850/50 border-dashed text-center">
                  <p className="text-[10px] text-zinc-500 italic">Click summarize below to compile daily progress report for the current workspace.</p>
                </div>
              </div>
              <button
                onClick={handleSummarizeWorkspace}
                disabled={aiSummaryLoading || !selectedWorkspace}
                className="w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiSummaryLoading ? "Summarizing..." : "Summarize Progress"}
              </button>
            </div>

            {/* Tool 3: AI Agile Sprint Planner */}
            <div className="p-5 rounded-xl bg-zinc-950/30 border border-zinc-800/80 flex flex-col justify-between min-h-[220px]">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  AI Sprint Planner
                </h4>
                <p className="text-[10px] text-zinc-500 font-light mb-3">Generate sprint goal deliverables & targeted week timelines</p>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-850 focus:border-violet-500 outline-none text-white text-[11px] placeholder-zinc-650 rounded-lg transition-all font-light resize-none"
                  rows={3}
                  placeholder="e.g. Build product catalog MVP in 2 weeks..."
                  value={aiSprintPrompt}
                  onChange={(e) => setAiSprintPrompt(e.target.value)}
                />
              </div>
              <button
                onClick={handleSprintPlanner}
                disabled={aiSprintLoading || !aiSprintPrompt}
                className="w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiSprintLoading ? "Planning..." : "Generate Sprint Plan"}
              </button>
            </div>

          </div>

          {/* Results Visualizer Section */}
          {(aiResult || aiSummaryResult || aiSprintResult) && (
            <div className="mt-6 border-t border-zinc-800/80 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Result 1 */}
              {aiResult ? (
                <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-850 text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 border-dashed">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900 mb-2 text-[9px] text-indigo-400 uppercase tracking-widest font-bold font-sans">
                    <span>Task Suggestions</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiResult);
                        alert("Task list copied!");
                      }}
                      className="hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  {aiResult}
                </div>
              ) : <div />}

              {/* Result 2 */}
              {aiSummaryResult ? (
                <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-850 text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 border-dashed">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900 mb-2 text-[9px] text-emerald-400 uppercase tracking-widest font-bold font-sans">
                    <span>Progress Summary</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiSummaryResult);
                        alert("Summary copied!");
                      }}
                      className="hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  {aiSummaryResult}
                </div>
              ) : <div />}

              {/* Result 3 */}
              {aiSprintResult ? (
                <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-850 text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 border-dashed">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900 mb-2 text-[9px] text-violet-400 uppercase tracking-widest font-bold font-sans">
                    <span>Sprint Timeline</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiSprintResult);
                        alert("Sprint plan copied!");
                      }}
                      className="hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  {aiSprintResult}
                </div>
              ) : <div />}

            </div>
          )}
        </section>

        {/* Section: Pending Invitations Inbox */}
        {pendingInvites.length > 0 && (
          <section className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/10 to-violet-900/10 border border-indigo-500/20 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-sans">
                Pending Workspace Invitations ({pendingInvites.length})
              </h2>
            </div>
            
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <div 
                  key={invite.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 gap-4"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100 font-sans">
                      You have been invited to join <span className="text-indigo-400 font-bold">"{invite.workspace_name}"</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Role assigned: <span className="capitalize font-medium text-zinc-300">{invite.role}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleAcceptInvite(invite.token)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Accept Invitation
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Workspaces Grid */}
        <section className="mb-12 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2 font-sans">
                Workspaces
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Select or create a workspace to see active projects
              </p>
            </div>

            {/* Create Workspace Form */}
            <div className="flex w-full md:w-auto gap-2 bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-800/80 backdrop-blur-sm max-w-md">
              <input
                type="text"
                placeholder="Workspace name"
                className="flex-1 md:w-56 px-3 py-2 bg-transparent outline-none text-white text-sm placeholder-zinc-500 rounded-lg focus:bg-zinc-950/20 transition-all font-light"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 flex-shrink-0"
              >
                Create
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaces.length === 0 ? (
              <div className="col-span-full py-12 px-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/40 border-dashed text-center">
                <p className="text-zinc-500 font-medium">No workspaces yet. Use the input above to get started!</p>
              </div>
            ) : (
              workspaces.map((workspace) => {
                const isSelected = selectedWorkspace === workspace.id;
                return (
                  <div
                    key={workspace.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                      isSelected 
                        ? "bg-indigo-600/[0.04] border-indigo-500 shadow-md shadow-indigo-500/5" 
                        : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700/80"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/15 to-transparent pointer-events-none rounded-bl-3xl" />
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors duration-200">
                          {workspace.name}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          Role: <span className="capitalize font-semibold text-indigo-400">{workspace.role || "member"}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedWorkspace(workspace.id);
                          setSelectedWorkspaceRole(workspace.role);
                          fetchProjects(workspace.id);
                          fetchWorkspaceMembers(workspace.id);
                          fetchAnalyticsData(workspace.id);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50"
                        }`}
                      >
                        {isSelected ? "Opened" : "Open Workspace"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section: Workspace Members & Invitations */}
        {selectedWorkspace && (
          <section className="mb-12 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left 2 Columns: Active Workspace Members */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 font-sans">
                    Active Workspace Team
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage collaborators, role promotions, and administrative access
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {workspaceMembers.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">Loading workspace team...</p>
                  ) : (
                    workspaceMembers.map((member) => {
                      const isSelf = member.email === userEmail;
                      const isWorkspaceOwner = selectedWorkspaceRole === "owner";
                      const isWorkspaceAdmin = selectedWorkspaceRole === "admin";
                      // Can manage only if they are Owner or Admin, they are not managing themselves, and they are not managing the Workspace Owner
                      const canManage = (isWorkspaceOwner || isWorkspaceAdmin) && !isSelf && member.role !== "owner";

                      return (
                        <div 
                          key={member.id} 
                          className="flex justify-between items-center bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 hover:border-zinc-800 transition-all gap-4 animate-in fade-in duration-150"
                        >
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5 truncate font-sans">
                              {member.username}
                              {isSelf && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-normal font-sans">You</span>}
                            </h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5 truncate font-light">{member.email}</p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {canManage ? (
                              <>
                                {/* Role Selection */}
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded-lg px-2 py-1 outline-none focus:border-violet-500 transition-all cursor-pointer font-medium"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>

                                {/* Remove Button */}
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors bg-zinc-900 border border-zinc-800 hover:border-red-500/20 hover:bg-red-500/10 rounded-lg"
                                  title="Remove member"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider font-sans ${
                                member.role === "owner" 
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                  : member.role === "admin" 
                                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" 
                                  : "bg-zinc-800/40 text-zinc-400 border border-zinc-800"
                              }`}>
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right 1 Column: Invite Teammates Form */}
              <div className="bg-zinc-950/20 p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200 font-sans">
                      Invite Teammate
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Send a secure invitation join link
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        placeholder="teammate@email.com"
                        className="w-full px-3.5 py-2 bg-zinc-950/40 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-xs placeholder-zinc-500 rounded-xl transition-all font-light"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Workspace Role</label>
                      <select
                        className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-300 text-xs rounded-xl transition-all cursor-pointer"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Send Invitation
                </button>
              </div>

            </div>
          </section>
        )}

        {/* Section: Analytics Widgets */}
        {selectedWorkspace && analytics && (
          <section className="mb-12 animate-in fade-in duration-500">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 font-sans">
              Workspace Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Priority Chart breakdown */}
              <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 font-sans">Task Priority Split</h4>
                  <p className="text-[10px] text-zinc-500 font-light mt-0.5">Task distribution across critical priorities</p>
                </div>

                <div className="space-y-3.5">
                  {/* High Priority */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-red-400 font-medium flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        High Priority
                      </span>
                      <span className="text-zinc-400 font-bold">{analytics.priority_stats?.high || 0} tasks</span>
                    </div>
                    <div className="w-full bg-zinc-950/40 h-2 rounded-full overflow-hidden border border-zinc-850">
                      <div 
                        className="bg-red-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                        style={{ width: `${analytics.total_tasks > 0 ? ((analytics.priority_stats?.high || 0) / analytics.total_tasks * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium Priority */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-amber-400 font-medium flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Medium Priority
                      </span>
                      <span className="text-zinc-400 font-bold">{analytics.priority_stats?.medium || 0} tasks</span>
                    </div>
                    <div className="w-full bg-zinc-950/40 h-2 rounded-full overflow-hidden border border-zinc-850">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                        style={{ width: `${analytics.total_tasks > 0 ? ((analytics.priority_stats?.medium || 0) / analytics.total_tasks * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Low Priority */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-sans">
                      <span className="text-indigo-400 font-medium flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        Low Priority
                      </span>
                      <span className="text-zinc-400 font-bold">{analytics.priority_stats?.low || 0} tasks</span>
                    </div>
                    <div className="w-full bg-zinc-950/40 h-2 rounded-full overflow-hidden border border-zinc-850">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${analytics.total_tasks > 0 ? ((analytics.priority_stats?.low || 0) / analytics.total_tasks * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI stats Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Total Projects */}
                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden flex flex-col justify-between min-h-[110px]">
                  <div>
                    <p className="text-xs text-zinc-500 font-light">Total Projects</p>
                    <h4 className="text-3xl font-bold text-zinc-100 mt-2 font-sans">{analytics.total_projects}</h4>
                  </div>
                  <div className="absolute right-4 bottom-4 h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden flex flex-col justify-between min-h-[110px]">
                  <div>
                    <p className="text-xs text-zinc-500 font-light">Completion Rate</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <h4 className="text-3xl font-bold text-zinc-100 font-sans">{analytics.completion_rate}%</h4>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider font-sans">Done</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-950/40 h-2 rounded-full mt-3 overflow-hidden border border-zinc-850">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${analytics.completion_rate}%` }}
                    />
                  </div>
                </div>

                {/* Active Backlog */}
                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden flex flex-col justify-between min-h-[110px]">
                  <div>
                    <p className="text-xs text-zinc-500 font-light">Active Backlog</p>
                    <h4 className="text-3xl font-bold text-zinc-100 mt-2 font-sans">{analytics.pending_tasks}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-light">Total remaining tasks across workspace</p>
                </div>

                {/* Overdue Tasks */}
                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-sm relative group overflow-hidden flex flex-col justify-between min-h-[110px]">
                  <div>
                    <p className="text-xs text-zinc-500 font-light">Delayed / Overdue</p>
                    <h4 className={`text-3xl font-bold mt-2 font-sans ${analytics.overdue_tasks > 0 ? "text-red-400" : "text-zinc-400"}`}>
                      {analytics.overdue_tasks}
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-light">Tasks past target due dates</p>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Section: Projects Grid */}
        {selectedWorkspace && (
          <section className="pt-8 border-t border-zinc-800/80 animate-in fade-in duration-500 mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  Projects
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Active projects within the selected workspace
                </p>
              </div>

              {/* Create Project Form */}
              <div className="flex w-full md:w-auto gap-2 bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-800/80 backdrop-blur-sm max-w-md">
                <input
                  type="text"
                  placeholder="Project name"
                  className="flex-1 md:w-56 px-3 py-2 bg-transparent outline-none text-white text-sm placeholder-zinc-500 rounded-lg focus:bg-zinc-950/20 transition-all font-light"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-500/10 flex-shrink-0"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.length === 0 ? (
                <div className="col-span-full py-12 px-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/40 border-dashed text-center">
                  <p className="text-zinc-500 font-medium">No projects yet. Create one above!</p>
                </div>
              ) : (
                projects.map((project) => {
                  const isProjectSelected = selectedProject === project.id;
                  return (
                    <div
                      key={project.id}
                      className={`p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                        isProjectSelected 
                          ? "bg-violet-600/[0.04] border-violet-500 shadow-md shadow-violet-500/5" 
                          : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700/80"
                      }`}
                    >
                      <div className="flex flex-col justify-between h-full gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center">
                            <svg className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-100">
                              {project.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              Project ID: {project.id}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedProject(project.id);
                            fetchTasks(project.id);
                          }}
                          className={`mt-2 py-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                            isProjectSelected
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/10"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {isProjectSelected ? "Opened Tasks" : "Tasks"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Section: Tasks Panel */}
        {selectedProject && (
          <section className="pt-8 border-t border-zinc-800/80 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  Task Management
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Kanban items and priorities for the selected project
                </p>
              </div>

              {/* Create Task Form Grid */}
              <div className="w-full md:max-w-md bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800/80 backdrop-blur-md space-y-4">
                <h4 className="text-sm font-semibold text-zinc-300">Quick Add Task</h4>
                
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-white text-sm placeholder-zinc-500 rounded-xl transition-all"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />

                <textarea
                  placeholder="Task description"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-white text-sm placeholder-zinc-500 rounded-xl transition-all"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Assignee</label>
                  <select
                    className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-zinc-300 text-xs rounded-xl transition-all cursor-pointer"
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value === "" ? "" : Number(e.target.value))}
                  >
                    <option value="" className="bg-zinc-900 text-zinc-400">Select Member (Optional)</option>
                    {workspaceMembers.map((member) => (
                      <option key={member.id} value={member.id} className="bg-zinc-900 text-white">
                        {member.username} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateTask}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-500/10"
                >
                  Create Task
                </button>
              </div>
            </div>

            {/* Filter and layout controls bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-sm">
              <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
                
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-zinc-950/40 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-white text-xs placeholder-zinc-500 rounded-xl transition-all font-light"
                  />
                </div>

                {/* Priority filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Priority:</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-zinc-950/40 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer font-medium"
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Assignee filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Assignee:</label>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-zinc-950/40 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 cursor-pointer font-medium max-w-[120px]"
                  >
                    <option value="all">All</option>
                    <option value="unassigned">Unassigned</option>
                    {workspaceMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.username}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* View toggle switcher */}
              <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-zinc-800 w-full md:w-auto gap-0.5 justify-center">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                    viewMode === "kanban"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                  </svg>
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                    viewMode === "list"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Dense List
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
              /* Upgraded list layout view */
              <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 backdrop-blur-md overflow-x-auto animate-in fade-in duration-300">
                <table className="w-full border-collapse text-left text-xs text-zinc-300 min-w-[700px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Task</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Assignee</th>
                      <th className="pb-3">Due Date</th>
                      {(selectedWorkspaceRole === "owner" || selectedWorkspaceRole === "admin") && <th className="pb-3 pr-2 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-zinc-500 italic">No matching tasks found.</td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const assigneeName = workspaceMembers.find(m => m.id === task.assigned_to)?.username || "Unassigned";
                        return (
                          <tr key={task.id} className="border-b border-zinc-900/50 hover:bg-zinc-950/20 transition-all group/row">
                            <td className="py-4 pl-2 pr-4 min-w-[200px]">
                              <p className="font-bold text-zinc-100 group-hover/row:text-violet-400 transition-colors">{task.title}</p>
                              {task.description && <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1 font-light">{task.description}</p>}
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                task.status === "done" 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : task.status === "in_progress" 
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                  : "bg-zinc-800 text-zinc-400"
                              }`}>
                                {task.status === "in_progress" ? "In Progress" : task.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                task.priority === "high" 
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                  : task.priority === "medium" 
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="py-4 font-light text-[11px] text-zinc-400 font-sans">
                              {assigneeName}
                            </td>
                            <td className="py-4 font-light text-[11px] text-zinc-500">
                              {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                            </td>
                            {(selectedWorkspaceRole === "owner" || selectedWorkspaceRole === "admin") && (
                              <td className="py-4 pr-2 text-right">
                                <button
                                  onClick={() => handleTaskDelete(task.id)}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all"
                                  title="Delete task"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Kanban view */
              <KanbanBoard tasks={filteredTasks} onDragEnd={onDragEnd} onUpload={handleUpload} role={selectedWorkspaceRole} onTaskDelete={handleTaskDelete} />
            )}
          </section>
        )}

        {/* Profile Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-100 font-sans">
                  Profile Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Username
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm rounded-xl transition-all"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm rounded-xl transition-all"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition-all border border-zinc-700/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/10"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
