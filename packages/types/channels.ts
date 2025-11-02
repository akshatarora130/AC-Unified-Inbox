export enum Channel {
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
  TWITTER = "TWITTER",
}

export enum MessageStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

export enum MessageDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
}
