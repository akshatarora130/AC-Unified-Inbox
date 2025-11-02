"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut, Mail, User as UserIcon, Loader2 } from "lucide-react";
import { User } from "@repo/types";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authClient.getSession();

        if (!response?.data?.user) {
          router.push("/");
          return;
        }

        const sessionUser = response.data.user as any;

        // Use firstName and lastName directly from the database
        const userWithNames: User = {
          id: sessionUser.id,
          firstName: sessionUser.firstName || "",
          lastName: sessionUser.lastName || "",
          email: sessionUser.email,
          image: sessionUser.image,
          emailVerified: sessionUser.emailVerified,
          createdAt: sessionUser.createdAt,
          updatedAt: sessionUser.updatedAt,
        };

        setUser(userWithNames);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
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
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Unified Inbox</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

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
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-600">
              Total Messages
            </div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="mt-2 text-sm text-gray-500">No messages yet</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-600">Unread</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="mt-2 text-sm text-gray-500">All caught up!</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-2 text-sm font-medium text-gray-600">
              Connected Accounts
            </div>
            <div className="text-3xl font-bold text-gray-900">1</div>
            <div className="mt-2 text-sm text-gray-500">
              Your primary account
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Mail className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            Your inbox is empty
          </h3>
          <p className="text-gray-600">
            Connect your email accounts to start managing your messages
          </p>
        </div>
      </main>
    </div>
  );
}
