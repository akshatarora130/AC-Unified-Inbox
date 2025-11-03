import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";
import { MessageDirection, MessageStatus } from "@repo/types";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get("range") || "30"; // 7, 30, 90, all

  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case "7":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        thread: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalMessages = messages.length;
    const totalConversations = new Set(messages.map((m) => m.threadId)).size;

    const outboundMessages = messages.filter(
      (m) => m.direction === MessageDirection.OUTBOUND
    );
    const inboundMessages = messages.filter(
      (m) => m.direction === MessageDirection.INBOUND
    );

    const successfulMessages = messages.filter(
      (m) =>
        m.status === MessageStatus.SENT ||
        m.status === MessageStatus.DELIVERED ||
        m.status === MessageStatus.READ
    );
    const successRate =
      totalMessages > 0 ? (successfulMessages.length / totalMessages) * 100 : 0;

    const responseTimes: number[] = [];
    const threads = new Map<string, any[]>();

    messages.forEach((msg) => {
      if (!threads.has(msg.threadId)) {
        threads.set(msg.threadId, []);
      }
      threads.get(msg.threadId)!.push(msg);
    });

    threads.forEach((threadMessages) => {
      const sorted = threadMessages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        if (
          current.direction === MessageDirection.INBOUND &&
          next.direction === MessageDirection.OUTBOUND &&
          next.userId
        ) {
          const currentTime = new Date(current.createdAt).getTime();
          const nextTime = new Date(next.createdAt).getTime();
          const responseTime = nextTime - currentTime;
          responseTimes.push(responseTime / (1000 * 60));
        }
      }
    });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const channelDistribution = messages.reduce(
      (acc, msg) => {
        acc[msg.channel] = (acc[msg.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const channelDistributionWithDirection = messages.reduce(
      (acc, msg) => {
        const key = `${msg.channel}_${msg.direction}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusBreakdown = messages.reduce(
      (acc, msg) => {
        acc[msg.status] = (acc[msg.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const responsesByUser = outboundMessages.reduce(
      (acc, msg) => {
        if (msg.userId && msg.user) {
          const userId = msg.userId;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              userName: `${msg.user.firstName} ${msg.user.lastName}`,
              email: msg.user.email,
              count: 0,
            };
          }
          acc[userId].count += 1;
        }
        return acc;
      },
      {} as Record<
        string,
        { userId: string; userName: string; email: string; count: number }
      >
    );

    const messagesByUser = messages.reduce(
      (acc, msg) => {
        if (msg.userId && msg.user) {
          const userId = msg.userId;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              userName: `${msg.user.firstName} ${msg.user.lastName}`,
              email: msg.user.email,
              count: 0,
            };
          }
          acc[userId].count += 1;
        }
        return acc;
      },
      {} as Record<
        string,
        { userId: string; userName: string; email: string; count: number }
      >
    );

    const volumeOverTime = messages.reduce(
      (acc, msg) => {
        const date = new Date(msg.createdAt);
        const dayKey = date.toISOString().split("T")[0];
        if (!acc[dayKey]) {
          acc[dayKey] = { date: dayKey, count: 0 };
        }
        acc[dayKey].count += 1;
        return acc;
      },
      {} as Record<string, { date: string; count: number }>
    );

    const responseTimeOverTime = messages.reduce(
      (acc, msg, idx) => {
        if (idx === 0) return acc;
        const prev = messages[idx - 1];

        if (
          prev.threadId === msg.threadId &&
          prev.direction === MessageDirection.INBOUND &&
          msg.direction === MessageDirection.OUTBOUND &&
          msg.userId
        ) {
          const date = new Date(msg.createdAt);
          const dayKey = date.toISOString().split("T")[0];
          if (!acc[dayKey]) {
            acc[dayKey] = { date: dayKey, times: [] };
          }
          const prevTime = new Date(prev.createdAt).getTime();
          const msgTime = new Date(msg.createdAt).getTime();
          const responseTime = (msgTime - prevTime) / (1000 * 60);
          acc[dayKey].times.push(responseTime);
        }
        return acc;
      },
      {} as Record<string, { date: string; times: number[] }>
    );

    const hourlyActivity = messages.reduce(
      (acc, msg) => {
        const date = new Date(msg.createdAt);
        const hour = date.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const volumeOverTimeArray = Object.values(volumeOverTime).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const responseTimeOverTimeArray = Object.entries(responseTimeOverTime)
      .map(([date, data]) => ({
        date,
        averageResponseTime:
          data.times.length > 0
            ? data.times.reduce((a, b) => a + b, 0) / data.times.length
            : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const responsesByUserArray = Object.values(responsesByUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const messagesByUserArray = Object.values(messagesByUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const hourlyActivityArray = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyActivity[i] || 0,
    }));

    return Response.json({
      overview: {
        totalMessages,
        totalConversations,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        inboundCount: inboundMessages.length,
        outboundCount: outboundMessages.length,
      },
      charts: {
        volumeOverTime: volumeOverTimeArray,
        channelDistribution: Object.entries(channelDistribution).map(
          ([channel, count]) => ({ channel, count })
        ),
        channelDistributionWithDirection: Object.entries(
          channelDistributionWithDirection
        ).map(([key, count]) => {
          const [channel, direction] = key.split("_");
          return { channel, direction, count };
        }),
        statusBreakdown: Object.entries(statusBreakdown).map(
          ([status, count]) => ({ status, count })
        ),
        responseTimeOverTime: responseTimeOverTimeArray,
        responsesByUser: responsesByUserArray,
        messagesByUser: messagesByUserArray,
        hourlyActivity: hourlyActivityArray,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    return Response.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
