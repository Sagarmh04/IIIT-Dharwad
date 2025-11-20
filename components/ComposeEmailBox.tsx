"use client";

import { useState } from "react";

type Suggestion = {
  subject: string;
  body: string;
};

type Attachment = {
  filename: string;
  mimeType: string;
  data: string;
  size: number;
};

type ComposeEmailBoxProps = {
  onSendEmail: (subject: string, body: string, to: string, tone?: string, attachments?: Attachment[]) => void;
  composing: boolean;
};

export default function ComposeEmailBox({ onSendEmail, composing }: ComposeEmailBoxProps) {
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [to, setTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [customTone, setCustomTone] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // AI mode state
  const [intent, setIntent] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "ai" | "user"; message: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Contacts and user info
  const [contacts, setContacts] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [contactsFetched, setContactsFetched] = useState(false);

  const tones = [
    { id: "professional", label: "Professional", icon: "💼" },
    { id: "friendly", label: "Friendly", icon: "😊" },
    { id: "formal", label: "Formal", icon: "🎩" },
    { id: "casual", label: "Casual", icon: "👋" },
    { id: "enthusiastic", label: "Enthusiastic", icon: "🎉" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          data: base64,
          size: file.size,
        });
      }
      setAttachments([...attachments, ...newAttachments]);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Extract email from intent by matching contact names
  const extractEmailFromIntent = (intentText: string, contactsList: any[]): string | null => {
    const lowerIntent = intentText.toLowerCase();
    for (const contact of contactsList) {
      const lowerName = contact.name.toLowerCase();
      if (lowerIntent.includes(lowerName)) {
        return contact.email;
      }
    }
    return null;
  };

  // Fetch contacts and user info before generating
  const fetchContactsAndUserInfo = async () => {
    if (contactsFetched && contacts.length > 0) {
      console.log("📇 Contacts already fetched, using cached:", contacts.length);
      return { contacts, userName };
    }
    
    try {
      console.log("📇 Fetching contacts and user info...");
      
      let fetchedContacts = contacts;
      let fetchedUserName = userName;
      
      // Fetch contacts
      const contactsRes = await fetch("/api/contacts");
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        fetchedContacts = contactsData.contacts || [];
        setContacts(fetchedContacts);
        console.log("✅ Contacts fetched:", fetchedContacts.length, fetchedContacts);
      } else {
        console.error("❌ Contacts fetch failed:", contactsRes.status);
      }

      // Fetch user info
      const userRes = await fetch("/api/user");
      if (userRes.ok) {
        const userData = await userRes.json();
        fetchedUserName = userData.name || "";
        setUserName(fetchedUserName);
        console.log("✅ User info fetched:", fetchedUserName);
      } else {
        console.error("❌ User info fetch failed:", userRes.status);
      }

      setContactsFetched(true);
      return { contacts: fetchedContacts, userName: fetchedUserName };
    } catch (error) {
      console.error("❌ Error fetching contacts/user:", error);
      return { contacts: [], userName: "" };
    }
  };

  const handleIntentSubmit = async () => {
    if (!intent.trim()) {
      alert("Please enter your intent for the email");
      return;
    }

    // Fetch contacts before generating and use the returned values
    const { contacts: fetchedContacts, userName: fetchedUserName } = await fetchContactsAndUserInfo();

    console.log("📧 Composing email with context:", {
      intent,
      contactsCount: fetchedContacts.length,
      contacts: fetchedContacts.map(c => ({ name: c.name, email: c.email })),
      userName: fetchedUserName
    });

    setAnalyzing(true);
    setChatMessages([]);

    try {
      const response = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          intent,
          contacts: fetchedContacts,
          userName: fetchedUserName,
        }),
      });

      const data = await response.json();

      if (data.needsMoreInfo) {
        // Store questions for later API call
        setQuestions(data.questions || []);
        setAnswers(new Array(data.questions?.length || 0).fill(""));
        setCurrentQuestionIndex(0);
        
        // Show first question in chat
        const firstQuestion = data.questions?.[0] || "Please provide more details.";
        setChatMessages([
          {
            role: "ai",
            message: firstQuestion,
          },
        ]);
      } else if (data.subject && data.body) {
        setReplySubject(data.subject);
        setReplyBody(data.body);
        
        // Use AI-provided recipient email or fall back to manual detection
        if (!to) {
          if (data.recipientEmail) {
            setTo(data.recipientEmail);
            console.log("✅ AI Contact Resolution Success:", {
              name: data.recipientName,
              email: data.recipientEmail
            });
          } else {
            console.log("⚠️ AI did not resolve contact, trying fallback...");
            const detectedEmail = extractEmailFromIntent(intent, contacts);
            if (detectedEmail) {
              setTo(detectedEmail);
              console.log("✅ Fallback extraction found:", detectedEmail);
            } else {
              console.log("❌ No recipient detected in intent");
            }
          }
        }
        
        setMode("manual");
      }
    } catch (error) {
      console.error("Intent analysis error:", error);
      alert("Failed to analyze intent. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) {
      alert("Please provide an answer");
      return;
    }

    // Store the current answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer.trim();
    setAnswers(newAnswers);

    // Add to chat display
    const newMessages = [...chatMessages, { role: "user" as const, message: currentAnswer }];
    
    // Check if there are more questions
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
      setChatMessages([...newMessages, { role: "ai" as const, message: nextQuestion }]);
      setCurrentAnswer("");
    } else {
      // All questions answered, generate email
      setChatMessages(newMessages);
      setCurrentAnswer("");
      setGenerating(true);

      try {
        // Ensure we have latest contacts
        const { contacts: fetchedContacts, userName: fetchedUserName } = await fetchContactsAndUserInfo();
        
        const response = await fetch("/api/email/generate", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent,
            questions,
            answers: newAnswers,
            contacts: fetchedContacts,
            userName: fetchedUserName,
          }),
        });

        const data = await response.json();

        if (data.subject && data.body) {
          setReplySubject(data.subject);
          setReplyBody(data.body);
          
          // Use AI-provided recipient email or fall back to manual detection
          if (!to) {
            if (data.recipientEmail) {
              setTo(data.recipientEmail);
              console.log("✅ AI Contact Resolution (Multi-turn):", {
                name: data.recipientName,
                email: data.recipientEmail
              });
            } else {
              console.log("⚠️ AI did not resolve contact (multi-turn), trying fallback...");
              // Fallback: check in answers and intent
              let detectedEmail = extractEmailFromIntent(intent, contacts);
              if (!detectedEmail) {
                for (const answer of newAnswers) {
                  const emailFromAnswer = extractEmailFromIntent(answer, contacts);
                  if (emailFromAnswer) {
                    detectedEmail = emailFromAnswer;
                    break;
                  }
                }
              }
              if (detectedEmail) {
                setTo(detectedEmail);
                console.log("✅ Fallback extraction found (multi-turn):", detectedEmail);
              } else {
                console.log("❌ No recipient detected in intent or answers");
              }
            }
          }
          
          setMode("manual");
          setChatMessages([]);
          setQuestions([]);
          setAnswers([]);
          setCurrentQuestionIndex(0);
        }
      } catch (error) {
        console.error("Answer processing error:", error);
        alert("Failed to process answer. Please try again.");
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleToneCorrection = async () => {
    const tone = selectedTone === "custom" ? customTone : selectedTone;
    if (!tone || !replyBody.trim()) {
      alert("Please enter a message and select a tone");
      return;
    }

    try {
      const response = await fetch("/api/tone-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: replyBody,
          tone,
        }),
      });

      const data = await response.json();
      if (data.correctedText) {
        setReplyBody(data.correctedText);
      }
    } catch (error) {
      console.error("Tone correction error:", error);
      alert("Failed to apply tone correction");
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setReplySubject(suggestion.subject);
    setReplyBody(suggestion.body);
  };

  const handleSend = () => {
    const tone = selectedTone === "custom" ? customTone : selectedTone;
    onSendEmail(replySubject, replyBody, to, tone, attachments);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-md transition-colors ${
            mode === "manual"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`px-4 py-2 rounded-md transition-colors ${
            mode === "ai"
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          AI Assist
        </button>
      </div>

      {mode === "ai" ? (
        <div className="space-y-4">
          {/* Intent Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              What do you want to say?
            </label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="E.g., I want to introduce our new product to potential clients..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500 resize-none"
              rows={3}
              disabled={analyzing || generating || chatMessages.length > 0}
            />
          </div>

          {/* Chat Interface */}
          {chatMessages.length > 0 && (
            <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10 max-h-64 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === "ai"
                      ? "bg-purple-600/20 border border-purple-500/30"
                      : "bg-blue-600/20 border border-blue-500/30 ml-8"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 text-gray-400">
                    {msg.role === "ai" ? "AI Assistant" : "You"}
                  </div>
                  <div className="text-sm">{msg.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Answer Input */}
          {chatMessages.length > 0 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !generating && handleAnswerSubmit()}
                placeholder="Your answer..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500"
                disabled={generating}
              />
              <button
                onClick={handleAnswerSubmit}
                disabled={generating || !currentAnswer.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                {generating ? "Generating..." : "Send"}
              </button>
            </div>
          )}

          {/* Generate Button */}
          {chatMessages.length === 0 && (
            <button
              onClick={handleIntentSubmit}
              disabled={analyzing || !intent.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
            >
              {analyzing ? "Analyzing..." : "Generate Email with AI"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* To Field */}
          <div>
            <label className="block text-sm font-medium mb-2">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input
              type="text"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Body Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500 resize-none"
              rows={8}
            />
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTone === tone.id
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  {tone.icon} {tone.label}
                </button>
              ))}
              <button
                onClick={() => setSelectedTone("custom")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTone === "custom"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                ✏️ Custom
              </button>
            </div>
            {selectedTone === "custom" && (
              <input
                type="text"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="Enter custom tone (e.g., persuasive, apologetic)"
                className="w-full mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500"
              />
            )}
            <button
              onClick={handleToneCorrection}
              className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
            >
              Apply Tone
            </button>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium mb-2">Attachments</label>
            <div className="space-y-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium">{att.filename}</div>
                      <div className="text-xs text-gray-400">
                        {(att.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="p-1 hover:bg-red-600/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <label className="block">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles}
                />
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg cursor-pointer transition-colors">
                  {uploadingFiles ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm">Add files (max 5MB each)</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Suggestions</label>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-sm mb-1">{suggestion.subject}</div>
                    <div className="text-xs text-gray-400 line-clamp-2">
                      {suggestion.body}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={composing || !to || !replySubject || !replyBody}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            {composing ? "Sending..." : "Send Email"}
          </button>
        </div>
      )}
    </div>
  );
}
