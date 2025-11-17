"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Mail,
  Loader2,
  MessageSquare,
  Inbox,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import { User, UserRole } from "@repo/types";
import Header from "@/components/Header";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalUnread: 0,
  });
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
        await fetchStats();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
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

  return (
    <div className="min-h-screen bg-black">
      <Header
        user={user}
        title="Unified Inbox"
        subtitle="Central hub for all your communications"
        showAdminButton={true}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-xl text-gray-400">
            Your unified command center for all inbox communications
          </p>
        </div>

        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => router.push("/inbox")}
            className="group relative overflow-hidden rounded-xl border-2 border-white bg-white p-6 text-left transition-all hover:bg-black hover:text-white"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg border-2 border-black bg-black p-3 group-hover:border-white group-hover:bg-white">
                <Inbox className="h-6 w-6 text-white group-hover:text-black" />
              </div>
              <ArrowRight className="h-5 w-5 text-black transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Unified Inbox</h3>
            <p className="text-sm">
              {stats.totalUnread > 0
                ? `${stats.totalUnread} unread messages`
                : "All caught up!"}
            </p>
          </button>

          <button
            onClick={() => router.push("/analytics")}
            className="group relative overflow-hidden rounded-xl border-2 border-white bg-white p-6 text-left transition-all hover:bg-black hover:text-white"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg border-2 border-black bg-black p-3 group-hover:border-white group-hover:bg-white">
                <BarChart3 className="h-6 w-6 text-white group-hover:text-black" />
              </div>
              <ArrowRight className="h-5 w-5 text-black transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Analytics</h3>
            <p className="text-sm">
              Track performance & insights
            </p>
          </button>

          <div className="rounded-xl border-2 border-white/20 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg border-2 border-white/20 bg-white/10 p-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Total Messages
            </h3>
            <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
            <p className="mt-2 text-sm text-gray-400">
              Across all channels
            </p>
          </div>

          <div className="rounded-xl border-2 border-white/20 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg border-2 border-white/20 bg-white/10 p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Conversations
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.totalMessages > 0 ? Math.ceil(stats.totalMessages / 2) : 0}
            </p>
            <p className="mt-2 text-sm text-gray-400">Active threads</p>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border-2 border-white/20 bg-white/5 p-8">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-3xl font-bold text-white">
              Powerful Features
            </h2>
            <p className="text-gray-400">
              Everything you need to manage communications effectively
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border-2 border-white/20 bg-white/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white/20 bg-white/10">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Multi-Channel
              </h3>
              <p className="text-sm text-gray-400">
                SMS, WhatsApp, Email, and Twitter all in one place
              </p>
            </div>

            <div className="rounded-lg border-2 border-white/20 bg-white/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white/20 bg-white/10">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Real-Time Analytics
              </h3>
              <p className="text-sm text-gray-400">
                Track performance, response times, and engagement metrics
              </p>
            </div>

            <div className="rounded-lg border-2 border-white/20 bg-white/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-white/20 bg-white/10">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Team Collaboration
              </h3>
              <p className="text-sm text-gray-400">
                Real-time presence, @mentions, and shared notes
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-8">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Ready to get started?
            </h2>
            <p className="mb-6 text-gray-400">
              Access your unified inbox and start managing all communications from one place
            </p>
            <button
              onClick={() => router.push("/inbox")}
              className="rounded-lg border-2 border-white bg-white px-8 py-3 font-semibold text-black shadow-lg transition-all hover:bg-black hover:text-white"
            >
              Open Inbox
              <ArrowRight className="ml-2 inline h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
