import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";
import { UserRole } from "@repo/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { role } = body;

  if (!role || !Object.values(UserRole).includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: role as UserRole },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ user: updatedUser });
}
