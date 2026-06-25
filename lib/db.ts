import { JSONFilePreset } from "lowdb/node";
import path from "node:path";
import fs from "node:fs";
import type { DBData } from "./types";

// Local, file-backed database. The log persists in data/foodlog.json across
// server restarts and page refreshes — no external DB or login required.
const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "foodlog.json");

const defaultData: DBData = { log: [] };

// Memoize across hot reloads / requests in dev so we don't reopen the file each time.
declare global {
  var __caloriedb: Awaited<ReturnType<typeof JSONFilePreset<DBData>>> | undefined;
}

export async function getDb() {
  if (!global.__caloriedb) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    global.__caloriedb = await JSONFilePreset<DBData>(dbFile, defaultData);
  }
  return global.__caloriedb;
}
