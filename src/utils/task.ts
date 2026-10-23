// 任务相关计算：有效状态（自动逾期）、配色、分类

import type { Task, TaskStatus } from "../types";
import { parseISO, startOfDay, daysBetween } from "./date";

/**
 * 有效状态：自动逾期规则
 * 当前日期 > end_date 且 status != 已完成 -> 视为「已延期」
 * 已完成任务不受逾期影响。
 */
export function effectiveStatus(task: Task, today: Date = new Date()): TaskStatus {
  if (task.status === "已完成") return "已完成";
  if (daysBetween(parseISO(task.end_date), startOfDay(today)) > 0) {
    return "已延期";
  }
  return task.status;
}

/** 任务在指定日期是否仍处于活跃区间（含起止当天） */
export function isActiveOn(task: Task, day: Date): boolean {
  const s = parseISO(task.start_date);
  const e = parseISO(task.end_date);
  return day >= s && day <= e;
}

/** 状态固定配色（浅色商务风、低饱和度） */
export const STATUS_COLOR: Record<TaskStatus, string> = {
  待开始: "#9aa0a6", // 灰
  进行中: "#2f6fed", // 蓝
  已完成: "#2e9e5b", // 绿
  已延期: "#c77b43", // 橙棕
};

/** 状态对应的浅色背景（用于标签底） */
export const STATUS_BG: Record<TaskStatus, string> = {
  待开始: "#eef0f1",
  进行中: "#e8f0fe",
  已完成: "#e7f5ec",
  已延期: "#fbeede",
};

export const PRIORITY_COLOR: Record<string, string> = {
  低: "#9aa0a6",
  中: "#c79a3a",
  高: "#c0532f",
};

/** 逾期天数（仅当有效状态为已延期时有意义） */
export function overdueDays(task: Task, today: Date = new Date()): number {
  return Math.max(0, daysBetween(parseISO(task.end_date), startOfDay(today)));
}

/** 起止时间范围文本：2026-10-20 ~ 2026-10-23 */
export function rangeLabel(task: Task): string {
  return `${task.start_date} ~ ${task.end_date}`;
}

/** 紧凑日期范围：10.19 - 10.21；同一天只显示 10.19 */
export function compactRange(task: Task): string {
  const md = (iso: string) => {
    const d = parseISO(iso);
    return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
  };
  if (task.start_date === task.end_date) return md(task.start_date);
  return `${md(task.start_date)} - ${md(task.end_date)}`;
}
