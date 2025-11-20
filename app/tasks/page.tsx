"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  priority: "high" | "medium" | "low";
  category: string;
  completed: boolean;
  createdAt: string;
  emailId?: string;
  emailSubject?: string;
  source: string;
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // Add shimmer animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed: !completed }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffMs < 0) return { text: "Overdue", urgent: true };
    if (diffDays === 0) return { text: `${diffHours}h remaining`, urgent: true };
    if (diffDays === 1) return { text: "Tomorrow", urgent: true };
    if (diffDays <= 7) return { text: `${diffDays} days`, urgent: false };
    return { text: `${diffDays} days`, urgent: false };
  };

  const getPriorityColor = (priority: string) => {
    // Not used anymore - priority badges now use consistent styling
    return "";
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by: incomplete first, then by priority, then by deadline
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Professional Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center gap-4">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2 ring-2 ring-purple-500/30">
                <Image 
                  src="/logo.png" 
                  alt="Insight Mail Logo" 
                  width={44} 
                  height={44}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                    Insight Mail
                  </h1>
                  <span className="text-purple-500">•</span>
                  <h2 className="text-lg font-medium text-purple-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks
                  </h2>
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  Tasks will auto-escalate if not completed within deadline
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-linear-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 flex items-center gap-2 border border-purple-500/30 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Inbox
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="mb-8 p-6 bg-linear-to-br from-purple-950/40 to-pink-950/30 rounded-xl border border-purple-700/30 shadow-xl shadow-purple-900/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-300">Progress</span>
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {tasks.filter(t => t.completed).length} of {tasks.length} completed
              </span>
            </div>
            <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 rounded-full transition-all duration-500 shadow-lg shadow-purple-500/50"
                style={{ 
                  width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl p-5 transition-all duration-300 ${
              filter === "all"
                ? "bg-linear-to-br from-purple-900/70 to-purple-800/60 border border-purple-700/50 shadow-lg shadow-purple-900/30"
                : "bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-300">All Tasks</span>
              <svg className={`w-5 h-5 ${filter === "all" ? "text-white" : "text-purple-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className={`text-3xl font-bold ${filter === "all" ? "text-white" : "text-gray-200"}`}>
              {tasks.length}
            </div>
          </button>

          <button
            onClick={() => setFilter("active")}
            className={`rounded-xl p-5 transition-all duration-300 ${
              filter === "active"
                ? "bg-gradient-to-br from-blue-600 to-cyan-600 border border-blue-500/50 shadow-xl shadow-blue-500/30"
                : "bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-300">Active</span>
              <svg className={`w-5 h-5 ${filter === "active" ? "text-white" : "text-blue-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`text-3xl font-bold ${filter === "active" ? "text-white" : "text-gray-200"}`}>
              {tasks.filter(t => !t.completed).length}
            </div>
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`rounded-xl p-5 transition-all duration-300 ${
              filter === "completed"
                ? "bg-gradient-to-br from-green-600 to-emerald-600 border border-green-500/50 shadow-xl shadow-green-500/30"
                : "bg-slate-800/50 border border-slate-700 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-300">Completed</span>
              <svg className={`w-5 h-5 ${filter === "completed" ? "text-white" : "text-green-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`text-3xl font-bold ${filter === "completed" ? "text-white" : "text-gray-200"}`}>
              {tasks.filter(t => t.completed).length}
            </div>
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-purple-300 mt-4 animate-pulse">Loading tasks...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
            <p className="text-gray-400 mb-1">
              {filter === "all" && "Your task list is empty"}
              {filter === "active" && "No active tasks"}
              {filter === "completed" && "No completed tasks yet"}
            </p>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Tasks will be automatically extracted from your emails when we detect deadlines, payments, or action items
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTasks.map((task, index) => {
              const timeRemaining = getTimeRemaining(task.deadline);
              
              return (
                <div
                  key={task.id}
                  className={`group relative p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                    task.completed
                      ? "bg-slate-900/40 border-slate-800/50 opacity-60 hover:opacity-80"
                      : "bg-linear-to-br from-slate-900/60 to-[#0a0a0f]/80 border-purple-700/30 hover:border-purple-600/50 hover:shadow-xl hover:shadow-purple-900/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className="mt-1 shrink-0"
                    >
                      {task.completed ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-purple-400/50 hover:border-purple-400 hover:bg-purple-500/10 transition-all" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`text-lg font-semibold transition-colors ${task.completed ? "line-through text-gray-400" : "text-white group-hover:text-purple-300"}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Priority Badge */}
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${
                            task.priority === "high" ? "text-red-200 bg-gradient-to-r from-red-600 to-red-500 border border-red-400/50" :
                            task.priority === "medium" ? "text-yellow-200 bg-gradient-to-r from-yellow-600 to-orange-500 border border-yellow-400/50" :
                            "text-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/50"
                          }`}>
                            {task.priority}
                          </span>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete task"
                          >
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className={`text-sm mb-3 ${task.completed ? "text-gray-500" : "text-gray-300"}`}>
                        {task.description}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {timeRemaining && (
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium border shadow-sm ${
                            timeRemaining.urgent 
                              ? "text-red-200 bg-gradient-to-r from-red-600 to-pink-600 border-red-400/50 animate-pulse" 
                              : "text-blue-200 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 border-blue-400/50"
                          }`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeRemaining.text}
                          </span>
                        )}
                        
                        {task.category && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-purple-200 bg-gradient-to-r from-purple-600/80 to-pink-600/80 border border-purple-400/50 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {task.category}
                          </span>
                        )}

                        {task.emailSubject && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-indigo-200 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/50 truncate max-w-sm shadow-sm">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            From: {task.emailSubject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
