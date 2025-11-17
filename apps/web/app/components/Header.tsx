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
    <header className="border-b border-white/10 bg-black px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center space-x-4 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-white">
            <Mail className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/inbox")}
            className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
          </button>
          <button
            onClick={() => router.push("/analytics")}
            className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          {showAdminButton && user.role === UserRole.ADMIN && (
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </button>
          )}
          {showBackButton && (
            <button
              onClick={onBack || (() => router.push("/home"))}
              className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              <span>Back</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
