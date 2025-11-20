"use client";

import { useState, useEffect } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
};

type ContactsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactsDialog({ isOpen, onClose }: ContactsDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  async function fetchContacts() {
    setLoading(true);
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContact() {
    if (!newName.trim() || !newEmail.trim()) {
      setError("Both name and email are required");
      return;
    }

    // Validate name: minimum 3 characters, no numbers or special characters
    if (newName.trim().length < 3) {
      setError("Name must be at least 3 characters long");
      return;
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(newName.trim())) {
      setError("Name can only contain letters and spaces");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });

      if (response.ok) {
        setNewName("");
        setNewEmail("");
        fetchContacts();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      setError("Failed to add contact");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteContact(email: string) {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-green-600/10 to-blue-600/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Manage Contacts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Contact Form */}
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Add New Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-400">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-400">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-500"
                  disabled={adding}
                  onKeyDown={(e) => e.key === "Enter" && !adding && handleAddContact()}
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-600/10 border border-red-600/20 rounded px-3 py-2">
                  {error}
                </div>
              )}
              <button
                onClick={handleAddContact}
                disabled={adding || !newName.trim() || !newEmail.trim()}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                {adding ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </div>

          {/* Contact List */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300">
              Your Contacts ({contacts.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No contacts yet</p>
                <p className="text-xs mt-1">Add your first contact above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.email}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{contact.name}</div>
                        <div className="text-sm text-gray-400 truncate">{contact.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.email)}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete contact"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            💡 Tip: When composing emails with AI, mention contact names and they'll be automatically resolved to email addresses
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
