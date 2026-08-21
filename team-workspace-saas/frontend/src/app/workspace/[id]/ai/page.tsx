"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getCurrentUser } from "@/services/user";
import { getWorkspaces } from "@/services/workspace";
import { getNotifications, markNotificationAsRead, deleteNotification } from "@/services/notification";
import { getProjects } from "@/services/project";
import { createTask } from "@/services/task";
import {
  generateAITasks, summarizeWorkspaceProgress, generateAISprintPlan,
  sendAIChatMessage, predictWorkspaceRisks, parseMeetingNotes,
} from "@/services/ai";

export default function AIHubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState("");
  const [workspace, setWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // AI Task Generator
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Progress Summarizer
  const [summaryResult, setSummaryResult] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Sprint Planner
  const [sprintPrompt, setSprintPrompt] = useState("");
  const [sprintResult, setSprintResult] = useState("");
  const [sprintLoading, setSprintLoading] = useState(false);

  // Risk Assessor
  const [riskResult, setRiskResult] = useState("");
  const [riskLoading, setRiskLoading] = useState(false);

  // Meeting Parser
  const [meetingPrompt, setMeetingPrompt] = useState("");
  const [meetingResult, setMeetingResult] = useState("");
  const [meetingLoading, setMeetingLoading] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I'm your AI Workspace Assistant. Ask me anything about your tasks or projects." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

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
      setWorkspace(wsData.find((w: any) => w.id === Number(id)) || null);
      setProjects(projectData);
      setNotifications(notifData);
    } catch (err: any) {
      if (err.response?.status === 401) { Cookies.remove("token"); router.push("/login"); }
    }
  };

  const token = () => Cookies.get("token") || "";

  const handleGenerateTasks = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try { const d = await generateAITasks(token(), aiPrompt); setAiResult(d.response); }
    catch { setAiResult("Failed to generate tasks. Try again."); }
    finally { setAiLoading(false); }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try { const d = await summarizeWorkspaceProgress(token(), Number(id)); setSummaryResult(d.response); }
    catch { setSummaryResult("Failed to generate summary."); }
    finally { setSummaryLoading(false); }
  };

  const handleSprint = async () => {
    if (!sprintPrompt.trim()) return;
    setSprintLoading(true);
    try { const d = await generateAISprintPlan(token(), sprintPrompt); setSprintResult(d.response); }
    catch { setSprintResult("Failed to generate sprint plan."); }
    finally { setSprintLoading(false); }
  };

  const handleRisks = async () => {
    setRiskLoading(true);
    try { const d = await predictWorkspaceRisks(token(), Number(id)); setRiskResult(d.response); }
    catch { setRiskResult("Failed to generate risk assessment."); }
    finally { setRiskLoading(false); }
  };

  const handleMeeting = async () => {
    if (!meetingPrompt.trim()) return;
    setMeetingLoading(true);
    try { const d = await parseMeetingNotes(token(), meetingPrompt); setMeetingResult(d.response); }
    catch { setMeetingResult("Failed to parse meeting notes."); }
    finally { setMeetingLoading(false); }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setChatLoading(true);
    try {
      const d = await sendAIChatMessage(token(), msg, Number(id));
      setChatMessages((prev) => [...prev, { sender: "ai", text: d.response }]);
    } catch {
      setChatMessages((prev) => [...prev, { sender: "ai", text: "Sorry, something went wrong." }]);
    } finally { setChatLoading(false); }
  };

  const handleImportTasks = async (text: string) => {
    if (!selectedProject) { alert("Select a project to import tasks into."); return; }
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const toCreate: any[] = [];
    for (const line of lines) {
      const clean = line.replace(/^(?:-?\s*\[\s*[x ]?\s*\]|-|\d+\.)\s*/, "").replace(/\*\*/g, "").trim();
      if (clean.length > 5) {
        toCreate.push({ title: clean, description: "Imported from AI Hub", status: "todo", priority: "medium", due_date: new Date(Date.now() + 7 * 86400000), project_id: Number(selectedProject), assigned_to: null });
      }
    }
    if (!toCreate.length) { alert("No tasks found to import."); return; }
    if (!confirm(`Import ${toCreate.length} tasks?`)) return;
    try {
      await Promise.all(toCreate.map((t) => createTask(token(), t)));
      alert(`Imported ${toCreate.length} tasks successfully!`);
    } catch { alert("Failed to import some tasks."); }
  };

  const handleMarkRead = async (notifId: number) => {
    await markNotificationAsRead(token(), notifId);
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n));
  };
  const handleDeleteNotification = async (notifId: number) => {
    await deleteNotification(token(), notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };
  const handleMarkAllRead = async () => {
    await Promise.all(notifications.filter((n) => !n.is_read).map((n) => markNotificationAsRead(token(), n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const ResultBox = ({ result, label, color, onImport }: any) => result ? (
    <div className="mt-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
      <div className={`flex justify-between items-center pb-2 border-b border-zinc-800 mb-3 text-[10px] font-bold uppercase tracking-wider ${color}`}>
        <span>{label}</span>
        <div className="flex gap-3">
          {onImport && <button onClick={() => onImport(result)} className="hover:underline">Import to Project</button>}
          <button onClick={() => navigator.clipboard.writeText(result)}>Copy</button>
        </div>
      </div>
      {result}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      <Sidebar workspaceId={id} workspaceName={workspace?.name} user={user} notifications={notifications} onNotificationsClick={() => setShowNotifications(true)} />
      {showNotifications && <NotificationsPanel notifications={notifications} onMarkRead={handleMarkRead} onDelete={handleDeleteNotification} onMarkAllRead={handleMarkAllRead} onClose={() => setShowNotifications(false)} />}

      <main className="ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-300">Workspaces</Link>
            <span>/</span>
            <Link href={`/workspace/${id}`} className="hover:text-zinc-300">{workspace?.name || "..."}</Link>
            <span>/</span>
            <span className="text-zinc-300">AI Hub</span>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">AI Hub</h1>
              <p className="text-sm text-zinc-400 mt-1">Accelerate your workflow with AI-powered tools</p>
            </div>
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Import tasks to:</span>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : "")}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl outline-none focus:border-indigo-500 transition-all">
                  <option value="">Select project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Generator */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Task Generator
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Describe a feature — AI generates structured tasks</p>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={3} placeholder="e.g. Build user authentication with JWT..."
                className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all resize-none" />
              <button onClick={handleGenerateTasks} disabled={aiLoading || !aiPrompt.trim()}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50">
                {aiLoading ? "Generating..." : "Generate Tasks"}
              </button>
              <ResultBox result={aiResult} label="Generated Tasks" color="text-indigo-400" onImport={handleImportTasks} />
            </div>

            {/* Sprint Planner */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Sprint Planner
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Generate a week-by-week Agile sprint plan</p>
              <textarea value={sprintPrompt} onChange={(e) => setSprintPrompt(e.target.value)} rows={3} placeholder="e.g. E-commerce platform MVP in 2 weeks..."
                className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-violet-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all resize-none" />
              <button onClick={handleSprint} disabled={sprintLoading || !sprintPrompt.trim()}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50">
                {sprintLoading ? "Planning..." : "Generate Sprint Plan"}
              </button>
              <ResultBox result={sprintResult} label="Sprint Plan" color="text-violet-400" />
            </div>

            {/* Progress Summarizer */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Progress Summarizer
              </h3>
              <p className="text-xs text-zinc-500 mb-4">AI-generated daily summary of workspace activity</p>
              <div className="py-8 text-center text-xs text-zinc-600 italic bg-zinc-950/20 rounded-xl border border-zinc-800/40 border-dashed mb-3">
                Analyzes all active tasks and recent activity logs
              </div>
              <button onClick={handleSummarize} disabled={summaryLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50">
                {summaryLoading ? "Summarizing..." : "Summarize Progress"}
              </button>
              <ResultBox result={summaryResult} label="Progress Summary" color="text-emerald-400" />
            </div>

            {/* Risk Assessor */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Risk Assessor
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Detect bottlenecks, overdue risks, and priority conflicts</p>
              <div className="py-8 text-center text-xs text-zinc-600 italic bg-zinc-950/20 rounded-xl border border-zinc-800/40 border-dashed mb-3">
                Scans task priorities, deadlines, and workload distribution
              </div>
              <button onClick={handleRisks} disabled={riskLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50">
                {riskLoading ? "Assessing..." : "Assess Risks"}
              </button>
              <ResultBox result={riskResult} label="Risk Assessment" color="text-amber-400" />
            </div>

            {/* Meeting Notes Parser */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Meeting Notes Parser
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Extract action items from meeting transcripts</p>
              <textarea value={meetingPrompt} onChange={(e) => setMeetingPrompt(e.target.value)} rows={3} placeholder="Paste your meeting notes or transcript..."
                className="w-full px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-cyan-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all resize-none" />
              <button onClick={handleMeeting} disabled={meetingLoading || !meetingPrompt.trim()}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all disabled:opacity-50">
                {meetingLoading ? "Extracting..." : "Parse Action Items"}
              </button>
              <ResultBox result={meetingResult} label="Action Items" color="text-cyan-400" onImport={handleImportTasks} />
            </div>

            {/* AI Chat */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-pink-400" />
                AI Assistant
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Ask anything about your workspace, tasks, or priorities</p>
              <div className="flex-1 space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400">Thinking...</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2.5 bg-zinc-950/50 border border-zinc-800 focus:border-indigo-500 outline-none text-white text-sm rounded-xl placeholder-zinc-500 transition-all" />
                <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
