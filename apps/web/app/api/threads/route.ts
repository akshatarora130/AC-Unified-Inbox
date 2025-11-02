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

  const threads = await prisma.thread.findMany({
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastActivity: "desc" },
  });

  return Response.json({ threads });
}
