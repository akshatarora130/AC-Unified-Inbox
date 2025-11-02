"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  MessageSquare,
  Loader2,
  Send,
  Search,
  Phone,
  X,
  Clock,
} from "lucide-react";
import { User, UserRole, Channel } from "@repo/types";
import Header from "@/components/Header";

interface Thread {
  id: string;
  lastActivity: string;
  unreadCount: number;
  contact: {
    id: string;
    phone: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  messages: Array<{
    id: string;
    channel: Channel;
    content: string;
    direction: string;
    status: string;
    createdAt: string;
    scheduledAt?: string | null;
  }>;
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
}

type FilterChannel = Channel | "all";

export default function InboxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState<FilterChannel>("all");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
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
        await fetchThreads();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const getContactName = (contact: Thread["contact"]) => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
    }
    return contact.phone || contact.email || "Unknown";
  };

  const fetchThreads = async () => {
    setIsLoadingThreads(true);
    try {
      const response = await fetch("/api/threads");
      if (response.ok) {
        const { threads: threadsData } = await response.json();
        setThreads(threadsData);
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    let filtered = [...threads];

    if (filterChannel !== "all") {
      filtered = filtered.filter((t) => {
        const lastMessage = t.messages[0];
        return lastMessage?.channel === filterChannel;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const name = getContactName(t.contact).toLowerCase();
        const phone = t.contact.phone?.toLowerCase() || "";
        const email = t.contact.email?.toLowerCase() || "";
        const lastMsg = t.messages[0]?.content.toLowerCase() || "";
        return (
          name.includes(query) ||
          phone.includes(query) ||
          email.includes(query) ||
          lastMsg.includes(query)
        );
      });
    }

    setFilteredThreads(filtered);
  }, [threads, filterChannel, searchQuery]);

  const fetchMessages = async (threadId: string, updateUnreadCount = false) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/messages`);
      if (response.ok) {
        const { messages: messagesData } = await response.json();
        setMessages(messagesData);
        if (updateUnreadCount) {
          setThreads((prevThreads) =>
            prevThreads.map((thread) =>
              thread.id === threadId ? { ...thread, unreadCount: 0 } : thread
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    fetchMessages(thread.id, true);
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !messageContent.trim()) return;

    if (user?.role === UserRole.VIEWER) {
      return;
    }

    const lastMessage = selectedThread.messages[0];
    const channel = lastMessage?.channel || Channel.SMS;
    const to = selectedThread.contact.phone || "";

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
          threadId: selectedThread.id,
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
        await fetchMessages(selectedThread.id);
        await fetchThreads();
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getThreadStatus = (
    thread: Thread
  ): "unread" | "read" | "sent" | "scheduled" => {
    if (thread.unreadCount > 0) return "unread";
    const lastMessage = thread.messages[0];
    if (lastMessage?.status === "SCHEDULED") return "scheduled";
    if (lastMessage?.direction === "OUTBOUND") return "sent";
    return "read";
  };

  const kanbanColumns = [
    {
      id: "unread",
      title: "Unread",
      count: threads.filter((t) => t.unreadCount > 0).length,
    },
    {
      id: "read",
      title: "Read",
      count: threads.filter(
        (t) =>
          t.unreadCount === 0 &&
          t.messages[0]?.direction !== "OUTBOUND" &&
          t.messages[0]?.status !== "SCHEDULED"
      ).length,
    },
    {
      id: "sent",
      title: "Sent",
      count: threads.filter(
        (t) =>
          t.messages[0]?.direction === "OUTBOUND" &&
          t.messages[0]?.status !== "SCHEDULED"
      ).length,
    },
    {
      id: "scheduled",
      title: "Scheduled",
      count: threads.filter((t) => t.messages[0]?.status === "SCHEDULED")
        .length,
    },
  ];

  const getThreadsForColumn = (columnId: string) => {
    let columnThreads = filteredThreads.filter((thread) => {
      const status = getThreadStatus(thread);
      return status === columnId;
    });

    return columnThreads;
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header
        user={user}
        title="Unified Inbox"
        subtitle="Manage conversations"
        showBackButton={true}
        showAdminButton={true}
      />

      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700">
              Channel:
            </label>
            <select
              value={filterChannel}
              onChange={(e) =>
                setFilterChannel(e.target.value as FilterChannel)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value={Channel.SMS}>SMS</option>
              <option value={Channel.WHATSAPP}>WhatsApp</option>
              <option value={Channel.EMAIL}>Email</option>
              <option value={Channel.TWITTER}>Twitter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {isLoadingThreads ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex flex-1 items-start justify-center gap-6 overflow-x-auto px-6 pt-4 pb-4">
            {kanbanColumns.map((column) => {
              const columnThreads = getThreadsForColumn(column.id);
              return (
                <div
                  key={column.id}
                  className="flex h-full max-w-[420px] min-w-[380px] flex-1 flex-col"
                >
                  <div className="mb-2 rounded-t-lg bg-gray-100 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-700">
                          {column.title.toUpperCase()}
                        </h3>
                        <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {columnThreads.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto rounded-b-lg bg-gray-50 px-3 pt-3 pb-4">
                    {columnThreads.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                          <MessageSquare className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          No conversations
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {column.id === "unread"
                            ? "All conversations are read"
                            : column.id === "read"
                              ? "No read conversations"
                              : column.id === "sent"
                                ? "No sent conversations"
                                : column.id === "scheduled"
                                  ? "No scheduled messages"
                                  : "No conversations in this category"}
                        </p>
                      </div>
                    ) : (
                      columnThreads.map((thread) => {
                        const lastMessage = thread.messages[0];
                        const isSelected = selectedThread?.id === thread.id;
                        return (
                          <div
                            key={thread.id}
                            onClick={() => handleThreadSelect(thread)}
                            className={`group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md ${
                              isSelected
                                ? "ring-opacity-20 border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                                : ""
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex min-w-0 flex-1 items-start space-x-3">
                                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                                  <Phone className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex items-center justify-between">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                      {getContactName(thread.contact)}
                                    </p>
                                    {thread.unreadCount > 0 && (
                                      <span className="ml-2 flex-shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                        {thread.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  {lastMessage && (
                                    <>
                                      <div className="mb-2 flex items-center space-x-2">
                                        {getChannelBadge(lastMessage.channel)}
                                        {lastMessage.status === "SCHEDULED" && (
                                          <span className="flex items-center space-x-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                            <Clock className="h-3 w-3" />
                                            <span>Scheduled</span>
                                          </span>
                                        )}
                                      </div>
                                      <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                                        {lastMessage.content}
                                      </p>
                                      {lastMessage.scheduledAt && (
                                        <p className="mb-2 text-xs text-orange-600">
                                          Scheduled:{" "}
                                          {new Date(
                                            lastMessage.scheduledAt
                                          ).toLocaleString()}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">
                                      {new Date(
                                        thread.lastActivity
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedThread && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getContactName(selectedThread.contact)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedThread.contact.phone ||
                      selectedThread.contact.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedThread(null);
                    setMessages([]);
                  }}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-gray-500">
                      No messages yet
                    </p>
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
                              ? "bg-orange-100 text-orange-900"
                              : "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="mb-1 flex items-center space-x-2">
                          {getChannelBadge(message.channel)}
                          {message.status === "SCHEDULED" && (
                            <span className="flex items-center space-x-1 rounded-full bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-800">
                              <Clock className="h-3 w-3" />
                              <span>Scheduled</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            message.direction === "OUTBOUND"
                              ? message.status === "SCHEDULED"
                                ? "text-orange-700"
                                : "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.status === "SCHEDULED" &&
                          (message as any).scheduledAt
                            ? `Scheduled: ${new Date((message as any).scheduledAt).toLocaleString()}`
                            : new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white px-6 py-4">
              {canSendMessages ? (
                <div className="space-y-3">
                  {isScheduled && (
                    <div className="flex items-center space-x-2 rounded-lg bg-orange-50 p-3">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="flex-1 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          setIsScheduled(false);
                          setScheduledDateTime("");
                        }}
                        className="text-sm text-orange-600 hover:text-orange-700"
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
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
                    />
                    <button
                      onClick={() => setIsScheduled(!isScheduled)}
                      className={`rounded-lg px-3 py-2 transition-all ${
                        isScheduled
                          ? "bg-orange-600 text-white hover:bg-orange-700"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      title="Schedule message"
                    >
                      <Clock className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || isSending}
                      className="rounded-lg bg-gray-900 px-6 py-2 text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-center">
                  <p className="text-sm text-gray-600">
                    Viewers can only view messages. Contact an admin to send
                    messages.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
