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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
    },
    orderBy: { firstName: "asc" },
  });

  return Response.json({ users });
}
