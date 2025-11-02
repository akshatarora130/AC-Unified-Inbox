"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Mail,
  User as UserIcon,
  Loader2,
  Shield,
  MessageSquare,
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        title="Unified Inbox"
        subtitle="Dashboard"
        showAdminButton={true}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-24 w-24 rounded-full ring-2 ring-gray-100"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 ring-2 ring-gray-200">
                  <UserIcon className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="mb-1 text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName}!
              </h2>
              <p className="mb-4 text-gray-600">
                Here's your unified inbox dashboard
              </p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{user.email}</span>
                  {user.emailVerified && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <UserIcon className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Full Name:</span>
                  <span className="ml-2">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Shield className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="font-medium">Role:</span>
                  <span className="ml-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === UserRole.ADMIN
                          ? "bg-purple-100 text-purple-700"
                          : user.role === UserRole.EDITOR
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Stats Cards */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-600">
              Total Messages
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalMessages}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {stats.totalMessages === 0
                ? "No messages yet"
                : `${stats.totalMessages} message${stats.totalMessages === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-600">Unread</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalUnread}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {stats.totalUnread === 0
                ? "All caught up!"
                : `${stats.totalUnread} unread message${stats.totalUnread === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
