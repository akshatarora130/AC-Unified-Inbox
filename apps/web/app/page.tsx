"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Mail, MessageSquare, BarChart3, Users, ArrowRight, Check, LayoutDashboard, Loader2, Inbox, User as UserIcon, Shield, CheckCircle2 } from "lucide-react";

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkAuth = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        if (sessionResponse?.data?.user) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white">
              <Mail className="h-10 w-10" />
            </div>
            <h1 className="mb-4 text-6xl font-bold tracking-tight">
              Unified Inbox
            </h1>
            <p className="mb-12 text-xl text-gray-300">
              Centralize all your communications in one powerful platform
            </p>
            {isLoading ? (
              <div className="inline-flex items-center space-x-2 rounded-lg border-2 border-white bg-white/5 px-8 py-4 text-lg font-semibold">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : isLoggedIn ? (
              <Link
                href="/home"
                className="group inline-flex items-center space-x-2 rounded-lg border-2 border-white bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-black hover:text-white"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="group inline-flex items-center space-x-2 rounded-lg border-2 border-white bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-black hover:text-white"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          <div className="mt-24 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Multi-Channel</h3>
              <p className="text-gray-400">
                SMS, WhatsApp, Email, and Twitter all in one unified inbox
              </p>
            </div>

            <div className="rounded-lg border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Analytics</h3>
              <p className="text-gray-400">
                Track performance, response times, and engagement metrics
              </p>
            </div>

            <div className="rounded-lg border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Team Collaboration</h3>
              <p className="text-gray-400">
                Real-time presence, @mentions, and shared notes
              </p>
            </div>
          </div>

          <div className="mt-24">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-3xl font-bold text-white">See It In Action</h2>
              <p className="text-gray-400">
                Explore different views of your unified inbox
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="group rounded-xl border-2 border-white/20 bg-white/5 transition-all hover:border-white/40">
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <div className="flex h-full items-center justify-center">
                    <Inbox className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-500">
                      Inbox Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">Unified Inbox</h3>
                  <p className="text-xs text-gray-400">
                    Kanban-style view with channel badges
                  </p>
                </div>
              </div>

              <div className="group rounded-xl border-2 border-white/20 bg-white/5 transition-all hover:border-white/40">
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <div className="flex h-full items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-500">
                      Analytics Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">Analytics Dashboard</h3>
                  <p className="text-xs text-gray-400">
                    Comprehensive metrics and charts
                  </p>
                </div>
              </div>

              <div className="group rounded-xl border-2 border-white/20 bg-white/5 transition-all hover:border-white/40">
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <div className="flex h-full items-center justify-center">
                    <MessageSquare className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-500">
                      Thread View Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">Thread Detail</h3>
                  <p className="text-xs text-gray-400">
                    Conversation view with composer
                  </p>
                </div>
              </div>

              <div className="group rounded-xl border-2 border-white/20 bg-white/5 transition-all hover:border-white/40">
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <div className="flex h-full items-center justify-center">
                    <UserIcon className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-500">
                      Contact Profile Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">Contact Profile</h3>
                  <p className="text-xs text-gray-400">
                    History timeline and notes
                  </p>
                </div>
              </div>

              <div className="group rounded-xl border-2 border-white/20 bg-white/5 transition-all hover:border-white/40">
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <div className="flex h-full items-center justify-center">
                    <Shield className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-500">
                      Admin Panel Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">Admin Panel</h3>
                  <p className="text-xs text-gray-400">
                    User management and roles
                  </p>
                </div>
              </div>

              <div className="group rounded-xl border-2 border-white/20 bg-white/5 transition-all hover:border-white/40">
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                  <div className="flex h-full items-center justify-center">
                    <CheckCircle2 className="h-16 w-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-500">
                      Features Screenshot
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">All Features</h3>
                  <p className="text-xs text-gray-400">
                    Complete platform overview
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24">
            <div className="rounded-lg border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-center text-3xl font-bold">
                Everything you need
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  "Unified inbox across all channels",
                  "Real-time message synchronization",
                  "Advanced search and filtering",
                  "Message scheduling",
                  "Team collaboration tools",
                  "Comprehensive analytics",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/20 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-400 sm:px-6 lg:px-8">
          <p>Unified Inbox Platform &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
