"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import KanbanBoard from "@/components/KanbanBoard";
import { getCurrentUser } from "@/services/user";
import { getWorkspaces } from "@/services/workspace";
import { getWorkspaceMembers } from "@/services/workspace";
import { getTasks, createTask, updateTaskStatus, updateTask, deleteTask } from "@/services/task";
import { uploadFile } from "@/services/upload";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";

export default function BoardPage() {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const router = useRouter();

  const [user, setUser] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceRole, setWorkspaceRole] = useState("member");
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Create task form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState<number | "">("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit task modal
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("todo");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) { router.push("/login"); return; }
    loadAll(token);

    // WebSocket for real-time updates
    wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws/workspace/" + id + "?token=" + token);
    wsRef.current.onmessage = () => fetchTasks();
    return () => wsRef.current?.close();
  }, [id, projectId]);

  useEffect(() => {
    if (editingTask) {
      setEditTitle(editingTask.title || "");
      setEditDescription(editingTask.description || "");
      setEditStatus(editingTask.status || "todo");
      setEditPriority(editingTask.priority || "medium");
      setEditDueDate(editingTask.due_date ? new Date(editingTask.due_date).toISOString().split("T")[0] : "");
      setEditAssignedTo(editingTask.assigned_to || "");
    }
  }, [editingTask]);

  const loadAll = async (token: string) => {
    try {
      const [userData, wsData, memberData, taskData, notifData] = await Promise.all([
        getCurrentUser(token),
        getWorkspaces(token),
        getWorkspaceMembers(token, Number(id)),
        getTasks(token, Number(projectId)),
        getNotifications(token),
      ]);
      setUser(userData.logged_in_user);
      setUserEmail(userData.email);
      const ws = wsData.find((w: any) => w.id === Number(id));
      setWorkspace(ws || null);
      setWorkspaceRole(ws?.role || "member");
      setMembers(memberData);
      setTasks(taskData);
      setNotifications(notifData);
    } catch (err: any) {
      if (err.response?.status === 401) { Cookies.remove("token"); router.push("/login"); }
    }
  };

  const fetchTasks = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) return;
    const data = await getTasks(token, Number(projectId));
    setTasks(data);
  }, [projectId]);

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    const token = Cookies.get("token");
    if (!token) return;
    setIsCreating(true);
    try {
      await createTask(token, {
        title: taskTitle.trim(),
        description: taskDescription,
        status: "todo",
        priority: taskPriority,
        due_date: taskDueDate ? new Date(taskDueDate) : new Date(),
        project_id: Number(projectId),
        assigned_to: taskAssignedTo ? Number(taskAssignedTo) : null,
      });
      setTaskTitle(""); setTaskDescription(""); setTaskPriority("medium"); setTaskDueDate(""); setTaskAssignedTo("");
      setShowCreateForm(false);
      fetchTasks();
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const token = Cookies.get("token");
    if (!token) return;
    setIsSaving(true);
    try {
      await updateTask(token, editingTask.id, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        due_date: editDueDate ? new Date(editDueDate) : null,
        assigned_to: editAssignedTo ? Number(editAssignedTo) : null,
      });
      setEditingTask(null);
      fetchTasks();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = useCallback(async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    const token = Cookies.get("token");
    if (!token) return;
    try {
      await deleteTask(token, taskId);
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete task.");
    }
  }, [fetchTasks]);

  const onDragEnd = useCallback(async (result: any) => {
    if (!result.destination) return;
    const taskId = Number(result.draggableId);
    const newStatus = result.destination.droppableId;
    const token = Cookies.get("token");
    if (!token) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateTaskStatus(token, taskId, newStatus);
    } catch {
      fetchTasks();
    }
  }, [fetchTasks]);

  const handleUpload = useCallback(async (taskId: number, file: File) => {
    const token = Cookies.get("token");
    if (!token) return;
    await uploadFile(token, taskId, file);
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskClick = useCallback((task: any) => {
    setEditingTask(task);
  }, []);

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

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  }), [tasks, searchQuery, priorityFilter]);

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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-lg">Edit Task</h2>
              <button onClick={() => setEditingTask(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl transition-all">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Priority</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl transition-all">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Due Date</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Assignee</label>
                  <select value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl transition-all">
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingTask(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-all">Cancel</button>
              <button onClick={handleUpdateTask} disabled={isSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="ml-60 min-h-screen">
        <div className="px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <Link href="/dashboard" className="hover:text-zinc-300">Workspaces</Link>
                <span>/</span>
                <Link href={`/workspace/${id}`} className="hover:text-zinc-300">{workspace?.name || "..."}</Link>
                <span>/</span>
                <span className="text-zinc-300">Board</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add Task
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all w-56"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-xl outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span className="text-xs text-zinc-500">{filteredTasks.length} tasks</span>
          </div>

          {/* Create Task Panel */}
          {showCreateForm && (
            <div className="mb-6 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <h3 className="font-semibold text-white mb-4 text-sm">New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Task title *" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all" />
                <input type="text" placeholder="Description (optional)" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all" />
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-indigo-500 transition-all">
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                  className="px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-indigo-500 transition-all" />
                <select value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value ? Number(e.target.value) : "")}
                  className="px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-indigo-500 transition-all">
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-all">Cancel</button>
                <button onClick={handleCreateTask} disabled={isCreating || !taskTitle.trim()} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50">
                  {isCreating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </div>
          )}

          {/* Kanban Board */}
          <KanbanBoard
            tasks={filteredTasks}
            onDragEnd={onDragEnd}
            onUpload={handleUpload}
            role={workspaceRole}
            onTaskDelete={handleDeleteTask}
            members={members}
            onTaskClick={handleTaskClick}
          />
        </div>
      </main>
    </div>
  );
}
