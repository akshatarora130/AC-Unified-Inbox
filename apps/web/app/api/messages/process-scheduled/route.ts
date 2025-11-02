import { NextRequest } from "next/server";
import prisma from "@repo/database";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { Channel, MessageStatus, MessageDirection } from "@repo/types";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const scheduledMessages = await prisma.message.findMany({
    where: {
      status: MessageStatus.SCHEDULED as any,
      scheduledAt: {
        lte: now,
      },
    },
    include: {
      thread: {
        include: {
          contact: true,
        },
      },
      user: true,
    },
    take: 50,
  });

  if (scheduledMessages.length === 0) {
    return Response.json({
      processed: 0,
      message: "No scheduled messages to process",
    });
  }

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const message of scheduledMessages) {
    try {
      let twilioResult;
      let from = process.env.TWILIO_PHONE_NUMBER || "";

      if (message.channel === Channel.SMS) {
        twilioResult = await sendSMS(message.to, message.content);
      } else if (message.channel === Channel.WHATSAPP) {
        const whatsappPhoneNumber =
          process.env.TWILIO_WHATSAPP_NUMBER ||
          process.env.TWILIO_PHONE_NUMBER ||
          "";
        twilioResult = await sendWhatsApp(message.to, message.content);
        from = `whatsapp:${whatsappPhoneNumber.replace(/^whatsapp:/, "")}`;
      } else {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: MessageStatus.FAILED as any,
          },
        });
        results.failed++;
        continue;
      }

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.SENT as any,
          externalId: twilioResult.sid,
          sentAt: new Date(),
        },
      });

      await prisma.thread.update({
        where: { id: message.threadId },
        data: {
          lastActivity: new Date(),
        },
      });

      results.succeeded++;
      results.processed++;
    } catch (error: any) {
      console.error(`Failed to send scheduled message ${message.id}:`, error);

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.FAILED as any,
        },
      });

      results.failed++;
      results.processed++;
    }
  }

  return Response.json({
    processed: results.processed,
    succeeded: results.succeeded,
    failed: results.failed,
  });
}
