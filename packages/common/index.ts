import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workspaceRoot = resolve(__dirname, "../../");

const envPath = resolve(workspaceRoot, ".env");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const env = process.env;
