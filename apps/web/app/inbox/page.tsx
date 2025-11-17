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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState<FilterChannel>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
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

  const getChannelBadge = (channel: Channel) => {
    const badges = {
      [Channel.SMS]: { bg: "bg-white/20", text: "text-white", label: "SMS" },
      [Channel.WHATSAPP]: {
        bg: "bg-white/20",
        text: "text-white",
        label: "WhatsApp",
      },
      [Channel.EMAIL]: {
        bg: "bg-white/20",
        text: "text-white",
        label: "Email",
      },
      [Channel.TWITTER]: {
        bg: "bg-white/20",
        text: "text-white",
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
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
    <div className="flex h-screen flex-col bg-black">
      <Header
        user={user}
        title="Unified Inbox"
        subtitle="Manage conversations"
        showBackButton={true}
        showAdminButton={true}
      />

      <div className="border-b border-white/20 bg-white/5 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pr-4 pl-10 text-sm text-white placeholder:text-gray-400 focus:border-white focus:ring-white/50 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-300">
              Channel:
            </label>
            <select
              value={filterChannel}
              onChange={(e) =>
                setFilterChannel(e.target.value as FilterChannel)
              }
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white focus:ring-white/50 focus:outline-none"
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
            <Loader2 className="h-8 w-8 animate-spin text-white" />
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
                  <div className="mb-2 rounded-t-lg bg-white/5 px-4 py-3 ring-1 ring-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">
                          {column.title.toUpperCase()}
                        </h3>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
                          {columnThreads.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto rounded-b-lg bg-white/5/50 px-3 pt-3 pb-4">
                    {columnThreads.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                          <MessageSquare className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">
                          No conversations
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
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
                        return (
                          <div
                            key={thread.id}
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(
                                `/inbox/thread/${thread.id}`,
                                "_blank"
                              );
                            }}
                            className="group cursor-pointer rounded-lg border border-white/20 bg-white/5 p-4 shadow-sm transition-all hover:border-white/30 hover:bg-white/10"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex min-w-0 flex-1 items-start space-x-3">
                                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-white">
                                  <Phone className="h-4 w-4 text-black" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex items-center justify-between">
                                    <p className="truncate text-sm font-semibold text-white">
                                      {getContactName(thread.contact)}
                                    </p>
                                    {thread.unreadCount > 0 && (
                                      <span className="ml-2 flex-shrink-0 rounded-full border-2 border-white bg-white px-2 py-0.5 text-xs font-semibold text-black">
                                        {thread.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  {lastMessage && (
                                    <>
                                      <div className="mb-2 flex items-center space-x-2">
                                        {getChannelBadge(lastMessage.channel)}
                                        {lastMessage.status === "SCHEDULED" && (
                                          <span className="flex items-center space-x-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                                            <Clock className="h-3 w-3" />
                                            <span>Scheduled</span>
                                          </span>
                                        )}
                                      </div>
                                      <p className="mb-2 line-clamp-2 text-sm text-gray-300">
                                        {lastMessage.content}
                                      </p>
                                      {lastMessage.scheduledAt && (
                                        <p className="mb-2 text-xs text-white">
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
    </div>
  );
}
