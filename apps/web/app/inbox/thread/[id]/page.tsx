"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  MessageSquare,
  Loader2,
  Send,
  Phone,
  X,
  Clock,
  User as UserIcon,
  Plus,
  Edit,
  Trash2,
  Lock,
  Globe,
} from "lucide-react";
import { User, UserRole, Channel, MessageStatus } from "@repo/types";
import Header from "@/components/Header";

interface Thread {
  id: string;
  contactId: string;
  contact: {
    id: string;
    phone: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Message {
  id: string;
  channel: Channel;
  content: string;
  direction: string;
  status: string;
  from: string;
  to: string;
  createdAt: string;
  scheduledAt?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteIsPublic, setNoteIsPublic] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [mentionTextarea, setMentionTextarea] = useState<"add" | string | null>(
    null
  );
  const [activeEditors, setActiveEditors] = useState<Map<string, any[]>>(
    new Map()
  );
  const noteContentEditableRef = useRef<HTMLDivElement>(null);
  const editContentEditableRef = useRef<HTMLDivElement>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || !threadId) return;
    hasInitialized.current = true;

    const checkAuth = async () => {
      try {
        const sessionResponse = await authClient.getSession();

        if (!sessionResponse?.data?.user) {
          router.push("/");
          return;
        }

        const userResponse = await fetch("/api/user");
        if (!userResponse.ok) {
          router.push("/");
          return;
        }

        const { user: userData } = await userResponse.json();

        const userDb: User = {
          id: userData.id,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email,
          image: userData.image,
          emailVerified: userData.emailVerified,
          role: (userData.role as UserRole) || UserRole.VIEWER,
          createdAt: userData.createdAt
            ? new Date(userData.createdAt)
            : undefined,
          updatedAt: userData.updatedAt
            ? new Date(userData.updatedAt)
            : undefined,
        };

        setUser(userDb);
        await fetchThread();
        await fetchMessages();
        await fetchUsers();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [threadId, router]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data.thread);
      }
    } catch (error) {
      console.error("Failed to fetch thread:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/threads/${threadId}/messages`);
      if (response.ok) {
        const { messages: messagesData } = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!thread || !messageContent.trim()) return;

    if (user?.role === UserRole.VIEWER) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const channel = lastMessage?.channel || Channel.SMS;
    const to = thread.contact.phone || "";

    if (!to) return;

    if (isScheduled && !scheduledDateTime) {
      alert("Please select a date and time for scheduling");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          channel,
          content: messageContent,
          to,
          scheduledAt: isScheduled ? scheduledDateTime : null,
        }),
      });

      if (response.ok) {
        setMessageContent("");
        setIsScheduled(false);
        setScheduledDateTime("");
        await fetchMessages();
      } else {
        const errorData = await response.json();
        console.error("Failed to send message:", errorData.error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const canSendMessages =
    user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;

  const getChannelBadge = (channel: Channel) => {
    const badges = {
      [Channel.SMS]: { bg: "bg-blue-100", text: "text-blue-700", label: "SMS" },
      [Channel.WHATSAPP]: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "WhatsApp",
      },
      [Channel.EMAIL]: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Email",
      },
      [Channel.TWITTER]: {
        bg: "bg-sky-100",
        text: "text-sky-700",
        label: "Twitter",
      },
    };

    const badge = badges[channel] || badges[Channel.SMS];
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const getContactName = (contact: Thread["contact"]) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    }
    return contact.phone || contact.email || "Unknown";
  };

  const fetchNotes = async () => {
    if (!thread) return;
    setIsLoadingNotes(true);
    try {
      const response = await fetch(`/api/contacts/${thread.contact.id}/notes`);
      if (response.ok) {
        const { notes: notesData } = await response.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleCreateNote = async () => {
    if (!thread || !noteContent.trim()) return;

    try {
      const response = await fetch(`/api/contacts/${thread.contact.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent,
          isPublic: noteIsPublic,
        }),
      });

      if (response.ok) {
        setNoteContent("");
        setNoteIsPublic(true);
        setShowAddNote(false);
        await fetchNotes();
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleUpdateNote = async (
    noteId: string,
    content: string,
    isPublic: boolean
  ) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isPublic }),
      });

      if (response.ok) {
        setEditingNoteId(null);
        await fetchNotes();
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const { users: usersData } = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const updatePresence = async (noteId: string, isActive: boolean) => {
    try {
      await fetch(`/api/notes/${noteId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
    } catch (error) {
      console.error("Failed to update presence:", error);
    }
  };

  const fetchPresence = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/presence`);
      if (response.ok) {
        const { activeUsers } = await response.json();
        setActiveEditors((prev) => new Map(prev.set(noteId, activeUsers)));
      }
    } catch (error) {
      console.error("Failed to fetch presence:", error);
    }
  };

  const extractPlainText = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const getCursorPosition = (element: HTMLElement): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const handleMentionInput = (html: string, textareaType: "add" | string) => {
    const plainText = extractPlainText(html);
    const element =
      textareaType === "add"
        ? noteContentEditableRef.current
        : editContentEditableRef.current;

    if (!element) return;

    const cursorPos = getCursorPosition(element);
    const textBeforeCursor = plainText.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (
        !textAfterAt.includes(" ") &&
        !textAfterAt.includes("\n") &&
        textAfterAt.length > 0
      ) {
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionPosition({ start: lastAtIndex, end: cursorPos });
        setMentionTextarea(textareaType);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
    setMentionTextarea(null);
  };

  const insertMention = (selectedUser: any, textareaType: "add" | string) => {
    const element =
      textareaType === "add"
        ? noteContentEditableRef.current
        : editContentEditableRef.current;

    if (!element) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textBeforeCursor =
      element.textContent?.substring(0, range.startOffset) || "";
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) return;

    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    const mentionText = `@${selectedUser.firstName} ${selectedUser.lastName} `;

    range.setStart(element.firstChild || element, lastAtIndex);
    range.setEnd(
      element.firstChild || element,
      lastAtIndex + textAfterAt.length + 1
    );

    const mentionSpan = document.createElement("span");
    mentionSpan.className =
      "inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-sm font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset";
    mentionSpan.textContent = mentionText.trim();
    mentionSpan.setAttribute(
      "data-mention",
      `${selectedUser.firstName} ${selectedUser.lastName}`
    );

    range.deleteContents();
    range.insertNode(mentionSpan);

    const space = document.createTextNode(" ");
    range.collapse(false);
    range.insertNode(space);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    if (textareaType === "add") {
      const plainText = extractPlainText(element.innerHTML);
      setNoteContent(plainText);
    } else {
      const plainText = extractPlainText(element.innerHTML);
      setEditContent(plainText);
    }

    setShowMentions(false);
    setMentionTextarea(null);
    setMentionQuery("");
  };

  const renderMentions = (text: string) => {
    const parts: (string | React.ReactElement)[] = [];
    const mentionRegex = /@(\w+\s+\w+)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const mentionedName = match[1];
      const mentionedUser = users.find(
        (u) => `${u.firstName} ${u.lastName}` === mentionedName
      );

      if (mentionedUser) {
        parts.push(
          <span
            key={key++}
            className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-sm font-medium text-white ring-1 ring-blue-500/30 ring-inset"
          >
            @{mentionedName}
          </span>
        );
      } else {
        parts.push(
          <span
            key={key++}
            className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-sm font-medium text-gray-300"
          >
            @{mentionedName}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? (
      <span className="whitespace-pre-wrap">{parts}</span>
    ) : (
      <span className="whitespace-pre-wrap">{text}</span>
    );
  };

  const renderMentionsToHTML = (text: string): string => {
    const mentionRegex = /@(\w+\s+\w+)/g;
    let html = "";
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        html += text.substring(lastIndex, match.index).replace(/\n/g, "<br>");
      }

      const mentionedName = match[1];
      const mentionedUser = users.find(
        (u) => `${u.firstName} ${u.lastName}` === mentionedName
      );

      if (mentionedUser) {
        html += `<span class="inline-flex items-center rounded-md bg-white/20 px-1.5 py-0.5 text-sm font-medium text-white ring-1 ring-blue-500/30 ring-inset" data-mention="${mentionedName}">@${mentionedName}</span> `;
      } else {
        html += `<span class="inline-flex items-center rounded-md bg-white/10 px-1.5 py-0.5 text-sm font-medium text-gray-300">@${mentionedName}</span> `;
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      html += text.substring(lastIndex).replace(/\n/g, "<br>");
    }

    return html || text.replace(/\n/g, "<br>");
  };

  const filteredUsers = users
    .filter(
      (u) =>
        u.id !== user?.id &&
        (u.firstName.toLowerCase().startsWith(mentionQuery) ||
          u.lastName.toLowerCase().startsWith(mentionQuery) ||
          `${u.firstName} ${u.lastName}`
            .toLowerCase()
            .startsWith(mentionQuery) ||
          u.firstName.toLowerCase().includes(mentionQuery) ||
          u.lastName.toLowerCase().includes(mentionQuery) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(mentionQuery))
    )
    .sort((a, b) => {
      const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
      const query = mentionQuery.toLowerCase();

      const aStartsWith = aName.startsWith(query);
      const bStartsWith = bName.startsWith(query);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return aName.localeCompare(bName);
    });

  useEffect(() => {
    if (showContactProfile && thread) {
      fetchNotes();
    }
  }, [showContactProfile, thread]);

  useEffect(() => {
    if (editingNoteId) {
      updatePresence(editingNoteId, true);
      const interval = setInterval(() => {
        updatePresence(editingNoteId, true);
        fetchPresence(editingNoteId);
      }, 5000);

      presenceIntervalRef.current = interval;

      return () => {
        if (editingNoteId) {
          updatePresence(editingNoteId, false);
        }
        clearInterval(interval);
      };
    } else {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    }
  }, [editingNoteId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const mentionDropdown = document.querySelector(
        '[data-mention-dropdown="true"]'
      );

      if (
        showMentions &&
        mentionDropdown &&
        !mentionDropdown.contains(target) &&
        noteContentEditableRef.current &&
        !noteContentEditableRef.current.contains(target) &&
        editContentEditableRef.current &&
        !editContentEditableRef.current.contains(target)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMentions]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user || !thread) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        user={user}
        title="Thread"
        subtitle={getContactName(thread.contact)}
        showBackButton={true}
        showAdminButton={true}
      />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between rounded-lg bg-white/5 px-6 py-4 shadow-sm ring-1 ring-white/20">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {getContactName(thread.contact)}
            </h1>
            <p className="text-sm text-gray-400">
              {thread.contact.phone || thread.contact.email}
            </p>
          </div>
          <button
            onClick={() => setShowContactProfile(true)}
            className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:border-slate-500 hover:bg-white/10"
          >
            <UserIcon className="h-4 w-4" />
            <span>View Profile</span>
          </button>
        </div>

        <div className="rounded-lg bg-white/5 shadow-sm ring-1 ring-white/20">
          <div className="border-b border-white/20 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Messages</h2>
          </div>

          <div className="max-h-[600px] overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-600" />
                  <p className="mt-4 text-sm text-gray-400">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === "OUTBOUND"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2 ${
                        message.direction === "OUTBOUND"
                          ? message.status === "SCHEDULED"
                            ? "bg-white/20 text-white"
                            : "bg-white text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="mb-1 flex items-center space-x-2">
                        {getChannelBadge(message.channel)}
                        {message.status === "SCHEDULED" && (
                          <span className="flex items-center space-x-1 rounded-full border-2 border-white bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                            <Clock className="h-3 w-3" />
                            <span>Scheduled</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <p
                          className={`text-xs ${
                            message.direction === "OUTBOUND"
                              ? message.status === "SCHEDULED"
                                ? "text-gray-300"
                                : "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {message.status === "SCHEDULED" && message.scheduledAt
                            ? `Scheduled: ${new Date(message.scheduledAt).toLocaleString()}`
                            : new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                        {message.user && (
                          <p
                            className={`ml-2 text-xs ${
                              message.direction === "OUTBOUND"
                                ? message.status === "SCHEDULED"
                                  ? "text-white"
                                  : "text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {message.user.firstName} {message.user.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/20 bg-white/5 px-6 py-4">
            {canSendMessages ? (
              <div className="space-y-3">
                {isScheduled && (
                  <div className="flex items-center space-x-2 rounded-lg bg-white/20 p-3">
                    <Clock className="h-4 w-4 text-white" />
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:ring-white/50 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setIsScheduled(false);
                        setScheduledDateTime("");
                      }}
                      className="text-sm text-white hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-gray-400 focus:border-white focus:ring-white/50 focus:outline-none"
                  />
                  <button
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`rounded-lg px-3 py-2 transition-all ${
                      isScheduled
                        ? "border-2 border-white bg-white text-black hover:bg-black hover:text-white"
                        : "border border-white/20 bg-white/10 text-white hover:bg-white/10"
                    }`}
                    title="Schedule message"
                  >
                    <Clock className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || isSending}
                    className="rounded-lg border-2 border-white bg-white px-6 py-2 text-black transition-all hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-white/10 px-4 py-3 text-center">
                <p className="text-sm text-gray-300">
                  Viewers can only view messages. Contact an admin to send
                  messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showContactProfile && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white/5 shadow-xl ring-1 ring-white/20">
            <div className="border-b border-white/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Contact Profile
                </h2>
                <button
                  onClick={() => setShowContactProfile(false)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                <div className="rounded-lg bg-white/5 p-4">
                  <h3 className="mb-2 text-sm font-medium text-white">
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {getContactName(thread.contact)}
                    </p>
                    {thread.contact.phone && (
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {thread.contact.phone}
                      </p>
                    )}
                    {thread.contact.email && (
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {thread.contact.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    History Timeline
                  </h3>
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3 border-l-2 border-white/20 pl-4"
                      >
                        <div className="mt-1 flex h-2 w-2 rounded-full bg-white"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {getChannelBadge(message.channel)}
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-white">
                            {message.content}
                          </p>
                          {message.user && (
                            <p className="mt-1 text-xs text-gray-500">
                              by {message.user.firstName}{" "}
                              {message.user.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Notes
                    </h3>
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="flex items-center space-x-2 rounded-lg border-2 border-white bg-white px-3 py-1.5 text-sm font-medium text-black transition-all hover:bg-black hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Note</span>
                    </button>
                  </div>

                  {showAddNote && (
                    <div className="relative mb-4 rounded-lg border border-white/20 bg-white/5 p-4">
                      <div
                        ref={noteContentEditableRef}
                        contentEditable
                        onInput={(e) => {
                          const html = e.currentTarget.innerHTML;
                          const plainText = extractPlainText(html);
                          setNoteContent(plainText);
                          handleMentionInput(html, "add");
                        }}
                        onKeyDown={(e) => {
                          if (
                            showMentions &&
                            mentionTextarea === "add" &&
                            (e.key === "Enter" ||
                              e.key === "ArrowDown" ||
                              e.key === "ArrowUp")
                          ) {
                            e.preventDefault();
                            if (filteredUsers.length > 0 && e.key === "Enter") {
                              insertMention(filteredUsers[0], "add");
                            }
                          }
                        }}
                        data-placeholder="Write a note... Use @ to mention team members"
                        className="mb-3 min-h-[100px] w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] focus:border-white focus:ring-white/50 focus:outline-none"
                        suppressContentEditableWarning
                      />
                      {showMentions &&
                        mentionTextarea === "add" &&
                        filteredUsers.length > 0 && (
                          <div
                            data-mention-dropdown="true"
                            className="absolute bottom-full left-0 z-50 mb-2 max-h-56 w-full overflow-auto rounded-xl border border-white/20 bg-white shadow-2xl"
                          >
                            {filteredUsers.slice(0, 5).map((u) => (
                              <button
                                key={u.id}
                                onClick={() => insertMention(u, "add")}
                                className="flex w-full items-center space-x-3 px-4 py-3 text-left text-white transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-white/10"
                              >
                                {u.image ? (
                                  <img
                                    src={u.image}
                                    alt={`${u.firstName} ${u.lastName}`}
                                    className="h-10 w-10 rounded-full ring-2 ring-white/20"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white text-black text-sm font-semibold ring-2 ring-white/20">
                                    {(u.firstName?.[0] || "").toUpperCase()}
                                    {(u.lastName?.[0] || "").toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {u.firstName} {u.lastName}
                                  </p>
                                  <p className="truncate text-xs text-gray-500">
                                    {u.email}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <div className="h-2 w-2 rounded-full bg-white"></div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      <div className="mb-3 flex items-center justify-between">
                        <label className="flex items-center space-x-2 text-sm text-white">
                          <input
                            type="checkbox"
                            checked={noteIsPublic}
                            onChange={(e) => setNoteIsPublic(e.target.checked)}
                            className="rounded border-white/20"
                          />
                          <span className="flex items-center space-x-1">
                            {noteIsPublic ? (
                              <>
                                <Globe className="h-4 w-4" />
                                <span>
                                  Public (visible to all team members)
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4" />
                                <span>Private (only visible to you)</span>
                              </>
                            )}
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCreateNote}
                          disabled={!noteContent.trim()}
                          className="rounded-lg border-2 border-white bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => {
                            setShowAddNote(false);
                            setNoteContent("");
                            setNoteIsPublic(true);
                            if (noteContentEditableRef.current) {
                              noteContentEditableRef.current.textContent = "";
                            }
                          }}
                          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoadingNotes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="rounded-lg border border-white/20 p-8 text-center">
                      <p className="text-sm text-gray-500">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => {
                        const isEditing = editingNoteId === note.id;
                        const isOwner = note.userId === user?.id;

                        return (
                          <div
                            key={note.id}
                            className="rounded-lg border border-white/20 bg-white/5 p-4"
                          >
                            {isEditing ? (
                              <div className="relative">
                                {activeEditors.get(note.id) &&
                                  activeEditors.get(note.id)!.length > 0 && (
                                    <div className="mb-2 flex items-center space-x-2 text-xs text-white">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>
                                        {activeEditors
                                          .get(note.id)!
                                          .map((e) => e.userName)
                                          .join(", ")}{" "}
                                        {activeEditors.get(note.id)!.length ===
                                        1
                                          ? "is"
                                          : "are"}{" "}
                                        editing
                                      </span>
                                    </div>
                                  )}
                                <div
                                  ref={editContentEditableRef}
                                  contentEditable
                                  onInput={(e) => {
                                    const html = e.currentTarget.innerHTML;
                                    const plainText = extractPlainText(html);
                                    setEditContent(plainText);
                                    handleMentionInput(html, note.id);
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      showMentions &&
                                      mentionTextarea === note.id &&
                                      (e.key === "Enter" ||
                                        e.key === "ArrowDown" ||
                                        e.key === "ArrowUp")
                                    ) {
                                      e.preventDefault();
                                      if (
                                        filteredUsers.length > 0 &&
                                        e.key === "Enter"
                                      ) {
                                        insertMention(
                                          filteredUsers[0],
                                          note.id
                                        );
                                      }
                                    }
                                  }}
                                  data-placeholder="Edit note... Use @ to mention team members"
                                  className="mb-3 min-h-[100px] w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] focus:border-white focus:ring-white/50 focus:outline-none"
                                  suppressContentEditableWarning
                                  dangerouslySetInnerHTML={{
                                    __html: renderMentionsToHTML(editContent),
                                  }}
                                />
                                {showMentions &&
                                  mentionTextarea === note.id &&
                                  filteredUsers.length > 0 && (
                                    <div
                                      data-mention-dropdown="true"
                                      className="absolute bottom-full left-0 z-50 mb-2 max-h-56 w-full overflow-auto rounded-xl border border-white/20 bg-black shadow-2xl"
                                    >
                                      {filteredUsers.slice(0, 5).map((u) => (
                                        <button
                                          key={u.id}
                                          onClick={() =>
                                            insertMention(u, note.id)
                                          }
                                          className="flex w-full items-center space-x-3 px-4 py-3 text-left text-white transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-white/10"
                                        >
                                          {u.image ? (
                                            <img
                                              src={u.image}
                                              alt={`${u.firstName} ${u.lastName}`}
                                              className="h-10 w-10 rounded-full ring-2 ring-white/20"
                                            />
                                          ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white text-black text-sm font-semibold ring-2 ring-white/20">
                                              {(
                                                u.firstName?.[0] || ""
                                              ).toUpperCase()}
                                              {(
                                                u.lastName?.[0] || ""
                                              ).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-white">
                                              {u.firstName} {u.lastName}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                              {u.email}
                                            </p>
                                          </div>
                                          <div className="flex-shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-white"></div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                <div className="mb-3 flex items-center space-x-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={editIsPublic}
                                    onChange={(e) =>
                                      setEditIsPublic(e.target.checked)
                                    }
                                    className="rounded border-white/20"
                                  />
                                  <span className="flex items-center space-x-1">
                                    {editIsPublic ? (
                                      <>
                                        <Globe className="h-4 w-4" />
                                        <span>Public</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-4 w-4" />
                                        <span>Private</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateNote(
                                        note.id,
                                        editContent,
                                        editIsPublic
                                      )
                                    }
                                    className="rounded-lg border-2 border-white bg-white px-3 py-1.5 text-sm font-medium text-black transition-all hover:bg-black hover:text-white"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(null);
                                    }}
                                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/20"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="mb-2 flex items-start justify-between">
                                  <div className="flex items-center space-x-2">
                                    {note.isPublic ? (
                                      <Globe className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <Lock className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {note.isPublic ? "Public" : "Private"}
                                    </span>
                                  </div>
                                  {isOwner && (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => {
                                          setEditingNoteId(note.id);
                                          setEditContent(note.content);
                                          setEditIsPublic(note.isPublic);
                                          if (editContentEditableRef.current) {
                                            editContentEditableRef.current.innerHTML =
                                              renderMentionsToHTML(
                                                note.content
                                              );
                                          }
                                        }}
                                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteNote(note.id)
                                        }
                                        className="text-gray-400 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="mb-2 text-sm text-white">
                                  {renderMentions(note.content)}
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>
                                    by {note.user.firstName}{" "}
                                    {note.user.lastName}
                                  </span>
                                  <span>
                                    {new Date(
                                      note.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 px-6 py-4">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    if (thread.contact.phone) {
                      window.open(`tel:${thread.contact.phone}`, "_blank");
                    }
                  }}
                  className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:border-white/30 hover:bg-white/20"
                >
                  <Phone className="h-4 w-4" />
                  <span>Dial</span>
                </button>
                <button
                  onClick={() => {
                    setShowContactProfile(false);
                    const input = document.querySelector(
                      'input[placeholder="Type a message..."]'
                    ) as HTMLInputElement;
                    if (input) {
                      input.focus();
                    }
                  }}
                  className="flex items-center space-x-2 rounded-lg border-2 border-white bg-white px-4 py-2 text-sm font-medium text-black shadow-sm transition-all hover:bg-black hover:text-white"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
