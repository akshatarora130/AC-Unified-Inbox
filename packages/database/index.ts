import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workspaceRoot = resolve(__dirname, "../..");
const envPath = resolve(workspaceRoot, ".env");

const envPaths = [envPath, resolve(process.cwd(), "../../.env")];

for (const path of envPaths) {
  if (existsSync(path)) {
    dotenv.config({ path });
    break;
  }
}

if (!process.env.DATABASE_URL) {
  dotenv.config();
}

const { PrismaClient } = await import("./generated/prisma/client");

const prisma = new PrismaClient();

export default prisma;
