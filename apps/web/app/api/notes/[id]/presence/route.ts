import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";

const activeEditors = new Map<
  string,
  Map<string, { userId: string; userName: string; timestamp: number }>
>();

setInterval(() => {
  const now = Date.now();
  for (const [noteId, editors] of activeEditors.entries()) {
    for (const [userId, data] of editors.entries()) {
      if (now - data.timestamp > 30000) {
        editors.delete(userId);
      }
    }
    if (editors.size === 0) {
      activeEditors.delete(noteId);
    }
  }
}, 10000);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive } = body;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true },
  });

  if (!activeEditors.has(id)) {
    activeEditors.set(id, new Map());
  }

  const editors = activeEditors.get(id)!;

  if (isActive) {
    const userName = dbUser
      ? `${dbUser.firstName} ${dbUser.lastName}`
      : "Unknown";
    editors.set(session.user.id, {
      userId: session.user.id,
      userName,
      timestamp: Date.now(),
    });
  } else {
    editors.delete(session.user.id);
  }

  const activeUsers = Array.from(editors.values());

  return Response.json({ activeUsers });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const editors = activeEditors.get(id);
  const activeUsers = editors
    ? Array.from(editors.values()).filter((e) => e.userId !== session.user.id)
    : [];

  return Response.json({ activeUsers });
}
