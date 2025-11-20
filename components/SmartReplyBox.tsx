import React, { useState, useRef } from "react";
import { X, Paperclip, Send, Sparkles, MessageSquare } from "lucide-react";

type Attachment = {
  filename: string;
  mimeType: string;
  data: string; // base64
  size: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SmartReplyBoxProps = {
  onSendReply: (reply: string, tone?: string, attachments?: Attachment[]) => void;
  suggestions?: string[];
  emailContext?: {
    from?: string;
    subject: string;
    body?: string;
  };
};

export default function SmartReplyBox({ onSendReply, suggestions = [], emailContext }: SmartReplyBoxProps) {
  const [reply, setReply] = useState("");
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [customTone, setCustomTone] = useState("");
  const [showCustomTone, setShowCustomTone] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Intent-based composition
  const [showIntentMode, setShowIntentMode] = useState(false);
  const [intent, setIntent] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tones = ["professional", "friendly", "formal", "casual", "custom"];

  async function handleToneCorrection() {
    if (!reply.trim()) return;
    
    setCorrecting(true);
    try {
      const toneToUse = selectedTone === "custom" ? customTone : selectedTone;
      const res = await fetch("/api/tone-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, tone: toneToUse }),
      });

      if (res.ok) {
        const data = await res.json();
        setReply(data.correctedText || reply);
      }
    } catch (err) {
      console.error("Tone correction failed:", err);
    } finally {
      setCorrecting(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          data: base64Data,
          size: file.size,
        });
      }

      setAttachments([...attachments, ...newAttachments]);
    } catch (err) {
      console.error("File upload error:", err);
      alert("Failed to attach files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeAttachment(index: number) {
    setAttachments(attachments.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async function handleIntentSubmit() {
    if (!intent.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/compose-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_intent",
          intent,
          emailContext,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.sufficient) {
          // Intent is clear, draft immediately
          await handleDraftEmail();
        } else {
          // Need clarification, start chat
          setChatHistory([
            {
              role: "assistant",
              content: `${result.reasoning}\n\nLet me ask you a few questions:\n${result.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Intent analysis error:", error);
      alert("Failed to analyze intent. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleChatMessage() {
    if (!currentUserMessage.trim()) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: currentUserMessage,
    };

    setChatHistory([...chatHistory, userMsg]);
    setCurrentUserMessage("");
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/compose-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          userMessage: currentUserMessage,
          chatHistory: [...chatHistory, userMsg],
          emailContext,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: result.message,
        };
        setChatHistory([...chatHistory, userMsg, assistantMsg]);

        // Check if assistant says we have enough info
        if (result.message.toLowerCase().includes("enough information") || 
            result.message.toLowerCase().includes("draft your email")) {
          setTimeout(() => handleDraftEmail(), 1000);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory([
        ...chatHistory,
        userMsg,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleDraftEmail() {
    setIsDrafting(true);
    try {
      const response = await fetch("/api/compose-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draft",
          intent,
          chatHistory,
          emailContext,
          currentDraft: reply,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setReply(result.draft);
        setShowIntentMode(false);
        setChatHistory([]);
        setIntent("");
      }
    } catch (error) {
      console.error("Draft error:", error);
      alert("Failed to draft email. Please try again.");
    } finally {
      setIsDrafting(false);
    }
  }

  function scrollChatToBottom() {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  React.useEffect(() => {
    if (chatHistory.length > 0) {
      scrollChatToBottom();
    }
  }, [chatHistory]);

  return (
    <div className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-300">Smart Reply</div>
        <button
          onClick={() => {
            setShowIntentMode(!showIntentMode);
            if (!showIntentMode) {
              setChatHistory([]);
              setIntent("");
            }
          }}
          className="flex items-center gap-1 px-3 py-1 rounded text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {showIntentMode ? "Manual Mode" : "AI Assistant"}
        </button>
      </div>

      {/* Intent-Based Mode */}
      {showIntentMode && (
        <div className="mb-4 p-4 rounded-lg bg-purple-600/5 border border-purple-500/20">
          <div className="text-xs font-semibold text-purple-300 mb-2">
            Tell me your intent
          </div>
          <div className="text-xs text-gray-400 mb-3">
            Describe what you want to say (e.g., "Accept the meeting for Tuesday", "Ask for more details about the project")
          </div>
          
          {chatHistory.length === 0 ? (
            <div>
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleIntentSubmit();
                  }
                }}
                placeholder="e.g., Decline the meeting politely and suggest Wednesday instead"
                rows={2}
                className="w-full p-2 rounded bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <button
                onClick={handleIntentSubmit}
                disabled={!intent.trim() || isAnalyzing}
                className="mt-2 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Intent
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              {/* Chat Interface */}
              <div className="mb-3 max-h-64 overflow-y-auto space-y-2 p-2 rounded bg-black/20">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600/20 text-blue-100 ml-6"
                        : "bg-purple-600/20 text-purple-100 mr-6"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {isDrafting && (
                  <div className="p-2 rounded text-sm bg-purple-600/20 text-purple-100 mr-6">
                    <div className="text-xs opacity-70 mb-1">AI Assistant</div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      Drafting your email...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {!isDrafting && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentUserMessage}
                    onChange={(e) => setCurrentUserMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleChatMessage();
                      }
                    }}
                    placeholder="Type your answer..."
                    className="flex-1 p-2 rounded bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    disabled={isAnalyzing}
                  />
                  <button
                    onClick={handleChatMessage}
                    disabled={!currentUserMessage.trim() || isAnalyzing}
                    className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setChatHistory([]);
                  setIntent("");
                }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                ← Start over
              </button>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Suggested Replies</div>
          <div className="space-y-2">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => setReply(sugg)}
                className="w-full text-left p-2 rounded text-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone Selector */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2">Tone</div>
        <div className="flex gap-2 flex-wrap">
          {tones.map((tone) => (
            <button
              key={tone}
              onClick={() => {
                setSelectedTone(tone);
                if (tone === "custom") {
                  setShowCustomTone(true);
                } else {
                  setShowCustomTone(false);
                }
              }}
              className={`px-3 py-1 rounded text-xs capitalize transition ${
                selectedTone === tone
                  ? "bg-[#0b3d91] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
        
        {/* Custom Tone Input */}
        {showCustomTone && (
          <div className="mt-2">
            <input
              type="text"
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="Enter your custom tone (e.g., enthusiastic, apologetic, urgent)"
              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-[#0b3d91] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Reply Text Area */}
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Type your reply here..."
        rows={6}
        className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-[#0b3d91] focus:outline-none resize-none"
      />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-gray-500">Attachments ({attachments.length})</div>
          {attachments.map((attachment, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300 truncate">{attachment.filename}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                </div>
              </div>
              <button
                onClick={() => removeAttachment(idx)}
                className="ml-2 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => {
            const toneToUse = selectedTone === "custom" ? customTone : selectedTone;
            onSendReply(reply, toneToUse, attachments);
          }}
          disabled={!reply.trim()}
          className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-[#2b58b8] disabled:opacity-50 text-sm font-medium transition-colors"
        >
          Send Reply
        </button>
        <button
          onClick={handleToneCorrection}
          disabled={!reply.trim() || correcting || (selectedTone === "custom" && !customTone.trim())}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {correcting ? "Correcting..." : "Correct Tone"}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
          title="Attach files (max 5MB each)"
        >
          <Paperclip className="w-4 h-4" />
          {uploading ? "Uploading..." : "Attach"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>
    </div>
  );
}
