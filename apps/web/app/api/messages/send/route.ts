import { auth } from "@/lib/auth";
import prisma from "@repo/database";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { NextRequest } from "next/server";
import { Channel, MessageDirection, MessageStatus } from "@repo/types";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "VIEWER") {
    return Response.json(
      {
        error:
          "Viewers cannot send messages. Only editors and admins can send messages.",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { threadId, channel, content, to } = body;

  if (!threadId || !channel || !content || !to) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { contact: true },
  });

  if (!thread) {
    return Response.json({ error: "Thread not found" }, { status: 404 });
  }

  let twilioResult;
  let from = process.env.TWILIO_PHONE_NUMBER || "";

  try {
    if (channel === Channel.SMS) {
      twilioResult = await sendSMS(to, content);
    } else if (channel === Channel.WHATSAPP) {
      const whatsappPhoneNumber =
        process.env.TWILIO_WHATSAPP_NUMBER ||
        process.env.TWILIO_PHONE_NUMBER ||
        "";
      twilioResult = await sendWhatsApp(to, content);
      from = `whatsapp:${whatsappPhoneNumber.replace(/^whatsapp:/, "")}`;
    } else {
      return Response.json({ error: "Unsupported channel" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        userId: session.user.id,
        channel: channel as any,
        direction: MessageDirection.OUTBOUND as any,
        status: MessageStatus.SENT as any,
        content,
        from,
        to,
        externalId: twilioResult.sid,
        sentAt: new Date(),
      },
      include: {
        thread: {
          include: {
            contact: true,
          },
        },
      },
    });

    await prisma.thread.update({
      where: { id: threadId },
      data: {
        lastActivity: new Date(),
      },
    });

    return Response.json({ message });
  } catch (error: any) {
    await prisma.message.create({
      data: {
        threadId,
        userId: session.user.id,
        channel: channel as any,
        direction: MessageDirection.OUTBOUND as any,
        status: MessageStatus.FAILED as any,
        content,
        from,
        to,
      },
    });

    return Response.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
