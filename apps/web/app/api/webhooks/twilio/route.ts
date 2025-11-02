import { NextRequest } from "next/server";
import prisma from "@repo/database";
import { Channel, MessageDirection, MessageStatus } from "@repo/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const numMedia = parseInt((formData.get("NumMedia") as string) || "0");

    console.log("[Twilio Webhook] Received message:", {
      messageSid,
      from,
      to,
      body: body?.substring(0, 50),
      messageStatus,
    });

    const isWhatsApp =
      from.startsWith("whatsapp:") || to.startsWith("whatsapp:");
    const channel = isWhatsApp ? Channel.WHATSAPP : Channel.SMS;

    let phone = from.replace(/^whatsapp:/, "").replace(/^\+/, "");
    if (!phone.startsWith("+")) {
      phone = `+${phone}`;
    }

    let contact = await prisma.contact.findFirst({
      where: { phone },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone,
        },
      });
    }

    let thread = await prisma.thread.findFirst({
      where: { contactId: contact.id },
    });

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          contactId: contact.id,
        },
      });
    }

    let status = MessageStatus.SENT;
    if (messageStatus === "delivered") {
      status = MessageStatus.DELIVERED;
    } else if (messageStatus === "read") {
      status = MessageStatus.READ;
    } else if (messageStatus === "failed") {
      status = MessageStatus.FAILED;
    }

    await prisma.message.create({
      data: {
        threadId: thread.id,
        channel: channel as any,
        direction: MessageDirection.INBOUND as any,
        status: status as any,
        content: body || "",
        from,
        to,
        externalId: messageSid,
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
      where: { id: thread.id },
      data: {
        lastActivity: new Date(),
        unreadCount: {
          increment: 1,
        },
      },
    });

    console.log("[Twilio Webhook] Successfully processed message:", messageSid);
    return new Response(null, { status: 200 });
  } catch (error: any) {
    console.error("[Twilio Webhook] Error processing message:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
