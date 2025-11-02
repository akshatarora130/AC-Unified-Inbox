import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";

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

  const notes = await prisma.note.findMany({
    where: {
      contactId: id,
      OR: [{ isPublic: true }, { userId: session.user.id }],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ notes });
}

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
  const { content, isPublic } = body;

  if (!content || !content.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    return Response.json({ error: "Contact not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      contactId: id,
      userId: session.user.id,
      content: content.trim(),
      isPublic: isPublic ?? true,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return Response.json({ note }, { status: 201 });
}
