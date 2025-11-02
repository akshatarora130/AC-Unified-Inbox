import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";

export async function PATCH(
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

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.userId !== session.user.id) {
    return Response.json(
      { error: "You can only edit your own notes" },
      { status: 403 }
    );
  }

  const updatedNote = await prisma.note.update({
    where: { id },
    data: {
      ...(content !== undefined && { content: content.trim() }),
      ...(isPublic !== undefined && { isPublic }),
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

  return Response.json({ note: updatedNote });
}

export async function DELETE(
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

  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) {
    return Response.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.userId !== session.user.id) {
    return Response.json(
      { error: "You can only delete your own notes" },
      { status: 403 }
    );
  }

  await prisma.note.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
