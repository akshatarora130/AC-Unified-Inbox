import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken) {
  throw new Error("Twilio credentials are missing");
}

export const twilioClient = twilio(accountSid, authToken);

export async function sendSMS(to: string, body: string) {
  if (!phoneNumber) {
    throw new Error("Twilio phone number is not configured");
  }

  const message = await twilioClient.messages.create({
    body,
    from: phoneNumber,
    to,
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
  };
}

export async function sendWhatsApp(to: string, body: string) {
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || phoneNumber;
  if (!whatsappNumber) {
    throw new Error("Twilio WhatsApp number is not configured");
  }
  const whatsappFrom = `whatsapp:${whatsappNumber.replace(/^whatsapp:/, "")}`;
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const message = await twilioClient.messages.create({
    body,
    from: whatsappFrom,
    to: whatsappTo,
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
  };
}

export async function getTwilioPhoneNumbers() {
  const numbers = await twilioClient.incomingPhoneNumbers.list();
  return numbers.map((number) => ({
    sid: number.sid,
    phoneNumber: number.phoneNumber,
    friendlyName: number.friendlyName,
    capabilities: number.capabilities,
  }));
}
