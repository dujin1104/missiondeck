// SQLite 本地数据库访问层
// 数据库文件由 Tauri 放在应用本地数据目录（如 ~/Library/Application Support/<identifier>/tasks.db）
// 纯本地存储，无任何网络请求。

import Database from "@tauri-apps/plugin-sql";
import type { Task, TaskStatus, TaskPriority } from "./types";

let db: Database | null = null;

export async function initDb(): Promise<void> {
  db = await Database.load("sqlite:tasks.db");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS task (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      remark TEXT
    );
  `);
}

export function getDb(): Database {
  if (!db) throw new Error("数据库尚未初始化");
  return db;
}

export async function getAllTasks(): Promise<Task[]> {
  const rows = (await getDb().select(
    "SELECT id, title, status, priority, start_date, end_date, remark FROM task ORDER BY start_date ASC, end_date ASC"
  )) as Task[];
  return rows;
}

export async function insertTask(t: Task): Promise<void> {
  await getDb().execute(
    "INSERT INTO task (id, title, status, priority, start_date, end_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [t.id, t.title, t.status, t.priority, t.start_date, t.end_date, t.remark ?? null]
  );
}

export async function updateTask(t: Task): Promise<void> {
  await getDb().execute(
    "UPDATE task SET title = ?, status = ?, priority = ?, start_date = ?, end_date = ?, remark = ? WHERE id = ?",
    [t.title, t.status, t.priority, t.start_date, t.end_date, t.remark ?? null, t.id]
  );
}

export async function deleteTask(id: string): Promise<void> {
  await getDb().execute("DELETE FROM task WHERE id = ?", [id]);
}

async function countTasks(): Promise<number> {
  const rows = (await getDb().select(
    "SELECT COUNT(*) as c FROM task"
  )) as { c: number }[];
  return rows[0]?.c ?? 0;
}

/** 任务总数（导出/导入前用于展示） */
export async function countAllTasks(): Promise<number> {
  return countTasks();
}

export async function clearAllTasks(): Promise<void> {
  await getDb().execute("DELETE FROM task");
}

/** 批量插入（忽略主键冲突，用于「合并」模式安全导入） */
export async function bulkInsertTasks(list: Task[]): Promise<number> {
  let ok = 0;
  for (const t of list) {
    try {
      await insertTask(t);
      ok++;
    } catch {
      // 主键冲突等跳过
    }
  }
  return ok;
}

/**
 * 校验并规整外来数据，仅保留符合 Task 结构的记录。
 * 非法字段会被修正或丢弃，避免脏数据写入数据库。
 */
export function sanitizeImportedTasks(input: unknown): Task[] {
  if (!Array.isArray(input)) return [];
  const statuses: TaskStatus[] = ["待开始", "进行中", "已完成", "已延期"];
  const prios: TaskPriority[] = ["低", "中", "高"];
  const out: Task[] = [];
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const start = typeof r.start_date === "string" ? r.start_date : "";
    const end = typeof r.end_date === "string" ? r.end_date : "";
    if (!title || !isoRe.test(start) || !isoRe.test(end)) continue;
    const status = statuses.includes(r.status as TaskStatus)
      ? (r.status as TaskStatus)
      : "待开始";
    const priority = prios.includes(r.priority as TaskPriority)
      ? (r.priority as TaskPriority)
      : "中";
    const remark =
      typeof r.remark === "string" ? r.remark : r.remark == null ? null : String(r.remark);
    out.push({
      id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
      title,
      status,
      priority,
      start_date: start,
      end_date: end,
      remark,
    });
  }
  return out;
}

/** 解析数据库实际落盘路径（应用数据目录）用于界面展示 */
export async function getDbDisplayPath(): Promise<string> {
  try {
    const { appDataDir, join } = await import("@tauri-apps/api/path");
    const dir = await appDataDir();
    return await join(dir, "tasks.db");
  } catch {
    return "本地 SQLite · tasks.db";
  }
}

// 仅用于类型推断
export type { TaskStatus, TaskPriority };
