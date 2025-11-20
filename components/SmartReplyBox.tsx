import React, { useState, useRef } from "react";
import { X, Paperclip, Sparkles, Send, MessageCircle } from "lucide-react";

// Quick Answer Input Component
function QuickAnswerInput({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [answer, setAnswer] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        disabled={!answer.trim()}
        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

type Attachment = {
  filename: string;
  mimeType: string;
  data: string; // base64
  size: number;
};

type Suggestion = {
  subject: string;
  body: string;
};

type SmartReplyBoxProps = {
  onSendReply: (subject: string, body: string, tone?: string, attachments?: Attachment[]) => void;
  suggestions?: Suggestion[];
  emailContext?: {
    messageId: string;
    subject: string;
    from?: string;
    body?: string;
    quickAnalysis?: any;
  };
};

type ChatMessage = {
  type: "question" | "answer" | "system";
  text: string;
  questionIndex?: number;
};

export default function SmartReplyBox({ onSendReply, suggestions = [], emailContext }: SmartReplyBoxProps) {
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [customTone, setCustomTone] = useState("");
  const [showCustomTone, setShowCustomTone] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intent-based generation
  const [intent, setIntent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showIntentMode, setShowIntentMode] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);

  // Contacts and user info
  const [contacts, setContacts] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [contactsFetched, setContactsFetched] = useState(false);

  const tones = ["professional", "friendly", "formal", "casual", "custom"];

  // Fetch contacts and user info before generating
  async function fetchContactsAndUserInfo() {
    if (contactsFetched && contacts.length > 0) {
      console.log("📇 [SmartReply] Contacts already fetched:", contacts.length);
      return { contacts, userName };
    }
    
    try {
      console.log("📇 [SmartReply] Fetching contacts and user info...");
      
      let fetchedContacts = contacts;
      let fetchedUserName = userName;
      
      // Fetch contacts
      const contactsRes = await fetch("/api/contacts");
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        fetchedContacts = contactsData.contacts || [];
        setContacts(fetchedContacts);
        console.log("✅ [SmartReply] Contacts fetched:", fetchedContacts.length, fetchedContacts);
      } else {
        console.error("❌ [SmartReply] Contacts fetch failed:", contactsRes.status);
      }

      // Fetch user info
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const userData = await userRes.json();
        fetchedUserName = userData.name || "";
        setUserName(fetchedUserName);
        console.log("✅ [SmartReply] User info fetched:", fetchedUserName);
      } else {
        console.error("❌ [SmartReply] User info fetch failed:", userRes.status);
      }

      setContactsFetched(true);
      return { contacts: fetchedContacts, userName: fetchedUserName };
    } catch (error) {
      console.error("❌ [SmartReply] Error fetching contacts/user:", error);
      return { contacts: [], userName: "" };
    }
  }

  async function handleToneCorrection() {
    if (!replyBody.trim()) return;
    
    setCorrecting(true);
    try {
      const toneToUse = selectedTone === "custom" ? customTone : selectedTone;
      const res = await fetch("/api/tone-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyBody, tone: toneToUse }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplyBody(data.correctedText || replyBody);
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

  async function handleGenerateFromIntent() {
    if (!intent.trim()) return;

    // Fetch contacts before generating and use returned values
    const { contacts: fetchedContacts, userName: fetchedUserName } = await fetchContactsAndUserInfo();

    setGenerating(true);
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: intent.trim(),
          emailContext,
          contacts: fetchedContacts,
          userName: fetchedUserName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.needsMoreInfo) {
          // Need to ask questions
          setQuestions(data.questions || []);
          setAnswers(new Array(data.questions?.length || 0).fill(""));
          setCurrentQuestionIndex(0);
          setShowChat(true);
          
          // Add system message
          setChatMessages([
            {
              type: "system",
              text: data.explanation || "I need more information to compose your email. Please answer the following questions:",
            },
            {
              type: "question",
              text: data.questions[0],
              questionIndex: 0,
            },
          ]);
        } else {
          // Got email draft directly with subject and body
          setReplySubject(data.subject || "");
          setReplyBody(data.body || "");
          setShowIntentMode(false);
        }
      } else {
        alert("Failed to generate email. Please try again.");
      }
    } catch (err) {
      console.error("Email generation failed:", err);
      alert("Failed to generate email. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleAnswerQuestion(answer: string) {
    if (!answer.trim()) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer.trim();
    setAnswers(newAnswers);

    // Add answer to chat
    const newMessages = [
      ...chatMessages,
      {
        type: "answer" as const,
        text: answer.trim(),
        questionIndex: currentQuestionIndex,
      },
    ];

    // Check if there are more questions
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      newMessages.push({
        type: "question" as const,
        text: questions[nextIndex],
        questionIndex: nextIndex,
      });
      setChatMessages(newMessages);
    } else {
      // All questions answered, generate email
      setChatMessages(newMessages);
      generateEmailFromAnswers(newAnswers);
    }
  }

  async function generateEmailFromAnswers(finalAnswers: string[]) {
    setGenerating(true);
    
    // Ensure we have latest contacts
    const { contacts: fetchedContacts, userName: fetchedUserName } = await fetchContactsAndUserInfo();
    
    try {
      const res = await fetch("/api/email/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: intent.trim(),
          emailContext,
          questions,
          answers: finalAnswers,
          contacts: fetchedContacts,
          userName: fetchedUserName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplySubject(data.subject || "");
        setReplyBody(data.body || "");
        setShowIntentMode(false);
        setShowChat(false);
        
        // Add success message
        setChatMessages([
          ...chatMessages,
          {
            type: "system",
            text: "✓ Email generated! You can now review and edit it below.",
          },
        ]);
      } else {
        alert("Failed to generate email. Please try again.");
      }
    } catch (err) {
      console.error("Email generation failed:", err);
      alert("Failed to generate email. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function resetIntentMode() {
    setIntent("");
    setShowIntentMode(true);
    setShowChat(false);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setChatMessages([]);
    setReplySubject("");
    setReplyBody("");
  }

  return (
    <div className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-300">Smart Reply</div>
        <button
          onClick={() => setShowIntentMode(!showIntentMode)}
          className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          {showIntentMode ? "Manual Mode" : "AI Mode"}
        </button>
      </div>

      {/* Intent-Based Generation */}
      {showIntentMode && (
        <div className="mb-4 p-4 rounded-lg bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-blue-300 mb-1">AI Email Assistant</div>
              <div className="text-xs text-gray-400">
                Tell me what you want to say, and I'll help you compose the perfect reply
              </div>
            </div>
          </div>

          <div className="mb-3">
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="E.g., 'Accept the meeting and suggest Thursday at 2pm' or 'Decline politely due to schedule conflict'"
              rows={3}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
              disabled={generating || showChat}
            />
          </div>

          {!showChat ? (
            <button
              onClick={handleGenerateFromIntent}
              disabled={!intent.trim() || generating}
              className="w-full px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating..." : "Generate Email"}
            </button>
          ) : (
            <button
              onClick={resetIntentMode}
              className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all"
            >
              Start Over
            </button>
          )}
        </div>
      )}

      {/* Chat Interface for Questions */}
      {showChat && (
        <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-purple-400" />
            <div className="text-sm font-medium text-purple-300">Clarifying Questions</div>
          </div>

          <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {msg.type === "system" && (
                  <div className="text-xs text-blue-400 italic p-2 rounded bg-blue-500/10">
                    {msg.text}
                  </div>
                )}
                {msg.type === "question" && (
                  <div className="text-sm text-gray-300 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                    <span className="text-purple-400 font-medium">Q{(msg.questionIndex || 0) + 1}:</span> {msg.text}
                  </div>
                )}
                {msg.type === "answer" && (
                  <div className="text-sm text-gray-200 p-2 rounded bg-green-500/10 border border-green-500/20 ml-4">
                    <span className="text-green-400 font-medium">A:</span> {msg.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {currentQuestionIndex < questions.length && !generating && (
            <QuickAnswerInput onSubmit={handleAnswerQuestion} />
          )}

          {generating && (
            <div className="text-center text-sm text-blue-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              Generating your email...
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {!showIntentMode && suggestions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Suggested Replies</div>
          <div className="space-y-2">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setReplySubject(sugg.subject);
                  setReplyBody(sugg.body);
                }}
                className="w-full text-left p-3 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <div className="text-sm font-medium text-gray-200 mb-1">{sugg.subject}</div>
                <div className="text-xs text-gray-400 line-clamp-2">{sugg.body}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show reset button if email was generated from intent */}
      {!showIntentMode && (replySubject || replyBody) && (
        <div className="mb-3">
          <button
            onClick={resetIntentMode}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Generate a new reply with AI
          </button>
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

      {/* Subject Field */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block">Subject</label>
        <input
          type="text"
          value={replySubject}
          onChange={(e) => setReplySubject(e.target.value)}
          placeholder="Email subject..."
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-[#0b3d91] focus:outline-none"
        />
      </div>

      {/* Body Text Area */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block">Message Body</label>
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Type your message here..."
          rows={8}
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-[#0b3d91] focus:outline-none resize-none"
        />
      </div>

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
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          onClick={() => {
            const toneToUse = selectedTone === "custom" ? customTone : selectedTone;
            onSendReply(replySubject, replyBody, toneToUse, attachments);
          }}
          disabled={!replySubject.trim() || !replyBody.trim()}
          className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-[#2b58b8] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Reply
          {attachments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
              {attachments.length}
            </span>
          )}
        </button>
        <button
          onClick={handleToneCorrection}
          disabled={!replyBody.trim() || correcting || (selectedTone === "custom" && !customTone.trim())}
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
