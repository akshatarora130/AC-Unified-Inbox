"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Loader2,
  BarChart3,
  Download,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { User, UserRole } from "@repo/types";
import Header from "@/components/Header";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalMessages: number;
    totalConversations: number;
    averageResponseTime: number;
    successRate: number;
    inboundCount: number;
    outboundCount: number;
  };
  charts: {
    volumeOverTime: Array<{ date: string; count: number }>;
    channelDistribution: Array<{ channel: string; count: number }>;
    channelDistributionWithDirection: Array<{
      channel: string;
      direction: string;
      count: number;
    }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    responseTimeOverTime: Array<{ date: string; averageResponseTime: number }>;
    responsesByUser: Array<{
      userId: string;
      userName: string;
      email: string;
      count: number;
    }>;
    messagesByUser: Array<{
      userId: string;
      userName: string;
      email: string;
      count: number;
    }>;
    hourlyActivity: Array<{ hour: number; count: number }>;
  };
}

const CHANNEL_COLORS: Record<string, string> = {
  SMS: "#3B82F6",
  WHATSAPP: "#10B981",
  EMAIL: "#8B5CF6",
  TWITTER: "#06B6D4",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  SCHEDULED: "#F97316",
  SENT: "#3B82F6",
  DELIVERED: "#10B981",
  READ: "#059669",
  FAILED: "#EF4444",
};

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [isLoadingData, setIsLoadingData] = useState(false);
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
        await fetchAnalytics();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [timeRange, user]);

  const fetchAnalytics = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const exportToCSV = () => {
    if (!analyticsData) return;

    const csvRows: string[] = [];

    csvRows.push("Analytics Export");
    csvRows.push(`Time Range: ${timeRange} days`);
    csvRows.push("");

    csvRows.push("Overview Metrics");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Messages,${analyticsData.overview.totalMessages}`);
    csvRows.push(
      `Total Conversations,${analyticsData.overview.totalConversations}`
    );
    csvRows.push(
      `Average Response Time (minutes),${analyticsData.overview.averageResponseTime}`
    );
    csvRows.push(`Success Rate (%),${analyticsData.overview.successRate}`);
    csvRows.push(`Inbound Messages,${analyticsData.overview.inboundCount}`);
    csvRows.push(`Outbound Messages,${analyticsData.overview.outboundCount}`);
    csvRows.push("");

    csvRows.push("Channel Distribution");
    csvRows.push("Channel,Count");
    analyticsData.charts.channelDistribution.forEach((item) => {
      csvRows.push(`${item.channel},${item.count}`);
    });
    csvRows.push("");

    csvRows.push("Status Breakdown");
    csvRows.push("Status,Count");
    analyticsData.charts.statusBreakdown.forEach((item) => {
      csvRows.push(`${item.status},${item.count}`);
    });
    csvRows.push("");

    csvRows.push("Responses by User");
    csvRows.push("User Name,Email,Response Count");
    analyticsData.charts.responsesByUser.forEach((item) => {
      csvRows.push(`"${item.userName}","${item.email}",${item.count}`);
    });
    csvRows.push("");

    csvRows.push("Messages by User");
    csvRows.push("User Name,Email,Message Count");
    analyticsData.charts.messagesByUser.forEach((item) => {
      csvRows.push(`"${item.userName}","${item.email}",${item.count}`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${timeRange}days-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        title="Analytics Dashboard"
        subtitle="Track your communication metrics"
        showBackButton={true}
        showAdminButton={true}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-gray-500">
              Monitor your communication performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-gray-900 focus:ring-gray-900 focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={exportToCSV}
              disabled={!analyticsData}
              className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !analyticsData ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              No analytics data available
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Total Messages
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.overview.totalMessages}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {analyticsData.overview.inboundCount} inbound,{" "}
                    {analyticsData.overview.outboundCount} outbound
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Conversations
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.overview.totalConversations}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Active threads</p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Avg Response Time
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.overview.averageResponseTime}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">minutes</p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Success Rate
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData.overview.successRate}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Messages delivered
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Message Volume Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.charts.volumeOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Messages"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Channel Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.charts.channelDistribution}
                      dataKey="count"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ channel, count }) => `${channel}: ${count}`}
                    >
                      {analyticsData.charts.channelDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHANNEL_COLORS[entry.channel] || "#9CA3AF"}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Message Status Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.charts.statusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Count">
                      {analyticsData.charts.statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || "#9CA3AF"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Response Time Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.charts.responseTimeOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                      formatter={(value: number) => [
                        `${value} min`,
                        "Avg Response Time",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="averageResponseTime"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Avg Response Time (min)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Responses by User
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analyticsData.charts.responsesByUser}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="userName"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Responses">
                      {analyticsData.charts.responsesByUser.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHANNEL_COLORS.SMS}
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Hourly Activity Pattern
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.charts.hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [value, "Messages"]}
                      labelFormatter={(label) => `Hour: ${label}:00`}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#8B5CF6" name="Messages" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {analyticsData.charts.messagesByUser.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Messages by User (All Messages)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analyticsData.charts.messagesByUser}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="userName"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10B981" name="Messages">
                      {analyticsData.charts.messagesByUser.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHANNEL_COLORS.WHATSAPP}
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
