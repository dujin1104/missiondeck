// 任务工作台 - 全局类型定义

export type TaskStatus = "待开始" | "进行中" | "已完成" | "已延期";
export type TaskPriority = "低" | "中" | "高";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** 开始日期 yyyy-MM-dd（本地日期，不含时区） */
  start_date: string;
  /** 截止日期 yyyy-MM-dd */
  end_date: string;
  /** 备注（可选） */
  remark?: string | null;
}

export const STATUS_LIST: TaskStatus[] = [
  "待开始",
  "进行中",
  "已完成",
  "已延期",
];

export const PRIORITY_LIST: TaskPriority[] = ["低", "中", "高"];

export type StatusFilter = "全部" | TaskStatus;
export const STATUS_FILTER_LIST: StatusFilter[] = [
  "全部",
  "待开始",
  "进行中",
  "已完成",
  "已延期",
];
