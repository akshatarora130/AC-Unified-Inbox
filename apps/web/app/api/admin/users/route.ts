import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { NextRequest } from "next/server";
import { UserRole } from "@repo/types";

export async function GET(req: NextRequest) {
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

  const users = await prisma.user.findMany({
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
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ users });
}

export async function POST(req: NextRequest) {
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
  const { email, firstName, lastName, role } = body;

  if (!email || !firstName || !lastName || !role) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return Response.json({ error: "User already exists" }, { status: 400 });
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      role: role as UserRole,
      emailVerified: false,
    },
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

  return Response.json({ user: newUser }, { status: 201 });
}
