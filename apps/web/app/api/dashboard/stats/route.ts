import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalMessages = await prisma.message.count();

  const unreadThreads = await prisma.thread.findMany({
    where: {
      unreadCount: {
        gt: 0,
      },
    },
  });

  const totalUnread = unreadThreads.reduce(
    (sum, thread) => sum + thread.unreadCount,
    0
  );

  return Response.json({
    totalMessages,
    totalUnread,
  });
}
