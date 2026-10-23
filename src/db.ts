// SQLite 本地数据库访问层
// 数据库文件由 Tauri 放在应用本地数据目录（如 ~/Library/Application Support/<identifier>/tasks.db）
// 纯本地存储，无任何网络请求。

import Database from "@tauri-apps/plugin-sql";
import type { Task, TaskStatus, TaskPriority } from "./types";
import { toISO, addDays, startOfWeek, weekDays } from "./utils/date";

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
  await seedIfEmpty();
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

/** 首次启动填充示例数据，避免空工作台；之后使用真实数据 */
async function seedIfEmpty(): Promise<void> {
  const c = await countTasks();
  if (c > 0) return;

  const today = new Date();
  const mon = startOfWeek(today);
  const days = weekDays(today);

  const samples: Task[] = [
    {
      id: crypto.randomUUID(),
      title: "需求评审会议纪要整理",
      status: "已完成",
      priority: "中",
      start_date: toISO(addDays(mon, 0)),
      end_date: toISO(addDays(mon, 0)),
      remark: "同步给产品与研发",
    },
    {
      id: crypto.randomUUID(),
      title: "周报数据看板上线联调",
      status: "进行中",
      priority: "高",
      start_date: toISO(addDays(mon, 1)),
      end_date: toISO(addDays(mon, 3)),
      remark: "前后端接口对齐",
    },
    {
      id: crypto.randomUUID(),
      title: "客户合同终稿确认",
      status: "待开始",
      priority: "中",
      start_date: toISO(addDays(mon, 2)),
      end_date: toISO(addDays(mon, 2)),
      remark: "",
    },
    {
      id: crypto.randomUUID(),
      title: "竞品功能拆解报告",
      status: "进行中",
      priority: "低",
      start_date: toISO(addDays(mon, 3)),
      end_date: toISO(addDays(mon, 4)),
      remark: "",
    },
    {
      id: crypto.randomUUID(),
      title: "季度复盘材料准备",
      status: "待开始",
      priority: "高",
      start_date: toISO(addDays(mon, 4)),
      end_date: toISO(addDays(mon, 5)),
      remark: "需要财务数据支持",
    },
    {
      id: crypto.randomUUID(),
      title: "线上故障复盘",
      status: "已完成",
      priority: "高",
      start_date: toISO(addDays(mon, 5)),
      end_date: toISO(addDays(mon, 5)),
      remark: "",
    },
    {
      id: crypto.randomUUID(),
      title: "下季度规划草案",
      status: "待开始",
      priority: "中",
      start_date: toISO(addDays(mon, 6)),
      end_date: toISO(addDays(days[6], 0)),
      remark: "",
    },
    // 故意制造一个逾期任务（截止日早于今天）
    {
      id: crypto.randomUUID(),
      title: "发票报销提交（已逾期）",
      status: "进行中",
      priority: "高",
      start_date: toISO(addDays(today, -5)),
      end_date: toISO(addDays(today, -2)),
      remark: "财务催办",
    },
    // 跨期任务：本周有排期，截止日不在本周
    {
      id: crypto.randomUUID(),
      title: "年度预算编制（跨期）",
      status: "进行中",
      priority: "高",
      start_date: toISO(addDays(mon, 2)),
      end_date: toISO(addDays(mon, 9)),
      remark: "跨多周进行",
    },
    {
      id: crypto.randomUUID(),
      title: "供应商资质审核（跨期）",
      status: "待开始",
      priority: "中",
      start_date: toISO(addDays(mon, 4)),
      end_date: toISO(addDays(mon, 12)),
      remark: "",
    },
  ];

  for (const s of samples) {
    await insertTask(s);
  }
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
