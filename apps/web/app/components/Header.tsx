"use client";

import { useRouter } from "next/navigation";
import { LogOut, Mail, Shield, Inbox, BarChart3 } from "lucide-react";
import { User, UserRole } from "@repo/types";

interface HeaderProps {
  user: User;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showAdminButton?: boolean;
  onBack?: () => void;
}

export default function Header({
  user,
  title,
  subtitle,
  showBackButton = false,
  showAdminButton = false,
  onBack,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const { authClient } = await import("@/lib/auth-client");
    try {
      await authClient.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center space-x-4 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/inbox")}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
          </button>
          <button
            onClick={() => router.push("/analytics")}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          {showAdminButton && user.role === UserRole.ADMIN && (
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </button>
          )}
          {showBackButton && (
            <button
              onClick={onBack || (() => router.push("/home"))}
              className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              <span>Back</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
