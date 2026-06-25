import { JSONFilePreset } from "lowdb/node";
import path from "node:path";
import fs from "node:fs";
import type { DBData, LogEntry } from "./types";
import type { Redis } from "@upstash/redis";

// Storage abstraction for the food log.
//
// - In production (Vercel) we use Upstash Redis (a.k.a. Vercel KV), because
//   Vercel's filesystem is read-only at runtime so a file DB can't persist.
// - Locally (no Redis env vars) we fall back to lowdb, a JSON file at
//   data/foodlog.json, so `npm run dev` works with zero cloud setup.

const LOG_KEY = "nutritrack:log";

/** Read Upstash/Vercel-KV credentials from the environment, if configured. */
function redisCreds(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return url && token ? { url, token } : null;
}

declare global {
  var __caloriedb: Awaited<ReturnType<typeof JSONFilePreset<DBData>>> | undefined;
  var __redis: Redis | undefined;
}

async function getRedis(): Promise<Redis | null> {
  const creds = redisCreds();
  if (!creds) return null;
  if (!global.__redis) {
    const { Redis } = await import("@upstash/redis");
    global.__redis = new Redis(creds);
  }
  return global.__redis;
}

// --- lowdb (local dev fallback) ---
const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "foodlog.json");
const defaultData: DBData = { log: [] };

async function getLowdb() {
  if (!global.__caloriedb) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    global.__caloriedb = await JSONFilePreset<DBData>(dbFile, defaultData);
  }
  return global.__caloriedb;
}

/** Read the full food log. */
export async function getLog(): Promise<LogEntry[]> {
  const redis = await getRedis();
  if (redis) {
    const log = await redis.get<LogEntry[]>(LOG_KEY);
    return Array.isArray(log) ? log : [];
  }
  const db = await getLowdb();
  return db.data.log;
}

/** Persist the full food log. */
export async function saveLog(log: LogEntry[]): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(LOG_KEY, log);
    return;
  }
  const db = await getLowdb();
  db.data.log = log;
  await db.write();
}
