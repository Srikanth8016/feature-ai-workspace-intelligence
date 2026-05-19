"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { getComments, createComment } from "@/services/comment";
import { getTaskActivity } from "@/services/task";

const columns = ["todo", "in_progress", "done"];

const getColumnColor = (col: string) => {
  switch (col) {
    case "todo":
      return "from-indigo-500 to-purple-500 text-indigo-400";
    case "in_progress":
      return "from-cyan-500 to-blue-500 text-cyan-400";
    case "done":
      return "from-emerald-500 to-green-500 text-emerald-400";
    default:
      return "from-zinc-500 to-zinc-600 text-zinc-400";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
  }
};

function TaskCard({ task, onUpload, role, onDelete }: any) {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Activity Feed State
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [activity, setActivity] = useState<any[]>([]);

  const triggerUpload = async () => {
    if (!localFile) return;
    setIsUploading(true);
    try {
      await onUpload(task.id, localFile);
      setLocalFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const loadComments = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await getComments(token, task.id);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadActivity = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await getTaskActivity(token, task.id);
      setActivity(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const token = Cookies.get("token");
    if (!token) return;
    setIsSubmittingComment(true);
    try {
      await createComment(token, task.id, commentText);
      setCommentText("");
      await loadComments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      loadComments();
      loadActivity();
    }
  };

  return (
    <div className="pl-1.5 space-y-3">
      <div className="flex justify-between items-start gap-4">
        <h3 className="font-bold text-zinc-100 group-hover:text-white transition-colors duration-200 text-sm">
          {task.title}
        </h3>
        <div className="flex items-center gap-1.5">
          {(role === "admin" || role === "owner") && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-zinc-500 hover:text-red-400 p-1 rounded-lg transition-colors bg-zinc-950/20 hover:bg-red-500/10 border border-zinc-800/40 hover:border-red-500/20"
              title="Delete Task"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
            {task.priority || "high"}
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 font-light leading-relaxed">
        {task.description || "No description provided."}
      </p>

      {/* Attached Files List */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mt-2.5 space-y-1 animate-in fade-in duration-350">
          <div className="flex flex-wrap gap-1.5">
            {task.attachments.map((att: any) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-700/40 hover:border-indigo-500/40 transition-all text-[9px] text-zinc-300 hover:text-white truncate max-w-[170px]"
                title={att.file_name}
              >
                <svg className="w-3 h-3 text-indigo-400 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate">{att.file_name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* File Upload UI */}
      <div className="mt-3 pt-3 border-t border-zinc-800/40 space-y-2">
        <div className="flex items-center gap-2">
          <label className="flex-1 cursor-pointer flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 transition-all text-[10px] text-zinc-400 hover:text-white">
            <span className="truncate max-w-[120px] font-light">
              {localFile ? localFile.name : "Attach a file..."}
            </span>
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setLocalFile(e.target.files[0]);
                }
              }}
            />
          </label>

          {localFile && (
            <button
              onClick={triggerUpload}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-violet-500/10"
            >
              {isUploading ? (
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Upload"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Comments UI Section */}
      <button
        onClick={toggleComments}
        className="mt-2 py-1.5 w-full rounded-xl text-[9px] font-bold bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1.5 group/btn"
      >
        <svg className="w-3 h-3 text-zinc-500 group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {showComments ? "Hide Comments" : "Comments"}
      </button>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-zinc-800/40 space-y-3 animate-in slide-in-from-top-2 duration-300">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800/60 pb-1.5 gap-4">
            <button
              onClick={() => setActiveTab("comments")}
              className={`text-[10px] font-bold pb-1 transition-all ${
                activeTab === "comments" 
                  ? "text-violet-400 border-b border-violet-500" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`text-[10px] font-bold pb-1 transition-all ${
                activeTab === "history" 
                  ? "text-violet-400 border-b border-violet-500" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              History
            </button>
          </div>

          {activeTab === "comments" ? (
            <>
              {/* Comments List */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-[9px] text-zinc-500 text-center font-light italic py-2">No comments yet. Start the thread!</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-855 text-[10px] text-zinc-300 leading-relaxed flex items-start gap-2 animate-in fade-in duration-200"
                    >
                      <div className="h-5 w-5 rounded-lg bg-zinc-850 border border-zinc-800 text-zinc-400 text-[8px] flex items-center justify-center font-bold flex-shrink-0">
                        U
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-light break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Form Input */}
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-1.5 bg-zinc-950/40 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-white text-[10px] placeholder-zinc-500 rounded-xl transition-all"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-violet-500/10 flex-shrink-0"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            /* History List */
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {activity.length === 0 ? (
                <p className="text-[9px] text-zinc-500 text-center font-light italic py-2">No history recorded yet.</p>
              ) : (
                activity.map((act) => (
                  <div key={act.id} className="flex gap-2 text-[9px] text-zinc-400 border-l border-zinc-800 pl-2.5 py-0.5 animate-in fade-in duration-150">
                    <span className="text-zinc-600 flex-shrink-0">{new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="font-semibold text-zinc-300 truncate max-w-[80px]">{act.username}</span>
                    <span className="text-zinc-500">{act.action}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Due Date & Assignee */}
      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(task.due_date).toLocaleDateString()}
        </span>
        <span>Assignee: {task.assigned_to}</span>
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onDragEnd, onUpload, role, onTaskDelete }: any) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {columns.map((column) => (
          <Droppable droppableId={column} key={column}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-5 rounded-2xl border transition-all duration-200 min-h-[500px] flex flex-col ${
                  snapshot.isDraggingOver
                    ? "bg-zinc-900/60 border-zinc-700/80 shadow-inner shadow-black/40"
                    : "bg-zinc-900/20 border-zinc-800/60"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${getColumnColor(column)}`} />
                    <h2 className="font-bold text-zinc-100 text-sm capitalize tracking-wider font-sans">
                      {column.replace("_", " ")}
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-850 text-zinc-400 border border-zinc-800/40">
                    {tasks.filter((t: any) => t.status === column).length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-4 flex-1">
                  {tasks
                    .filter((task: any) => task.status === column)
                    .map((task: any, index: number) => (
                      <Draggable draggableId={String(task.id)} index={index} key={task.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-5 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                              snapshot.isDragging
                                ? "bg-zinc-900 border-indigo-500/80 shadow-2xl scale-[1.02] rotate-1"
                                : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80"
                            }`}
                          >
                            {/* Accent Side Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${getColumnColor(column)}`} />

                            <TaskCard task={task} onUpload={onUpload} role={role} onDelete={onTaskDelete} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
