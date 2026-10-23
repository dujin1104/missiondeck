// 纯本地日期工具：所有日期以 yyyy-MM-dd 字符串在本地时区处理，避免 UTC 偏移问题

/** Date -> yyyy-MM-dd（本地） */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** yyyy-MM-dd -> 本地零点 Date */
export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 在 d 基础上加 n 天，返回新 Date（本地零点） */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

/** 取本地零点 */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 周一为一周起点，返回该周周一的本地零点 */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=周日 .. 6=周六
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(d), diff);
}

/** 该周的周一..周日 7 天 */
export function weekDays(d: Date): Date[] {
  const mon = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** ISO 8601 周序号（1-53） */
export function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
}

/** 两个本地零点日期相差的整天数（b - a） */
export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISO(a) === toISO(b);
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** 中文星期名 */
export const WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

/** 英文星期名（表头） */
export const WEEKDAY_EN = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

/** 简短日期范围文本：10.20 - 10.26 */
export function rangeText(days: Date[]): string {
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
  return `${fmt(days[0])} - ${fmt(days[6])}`;
}

/** 某年某 ISO 周（1-based）的周一本地零点 */
export function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4); // 1月4日一定在第1周
  const w1 = startOfWeek(jan4);
  return addDays(w1, (week - 1) * 7);
}

/** 某年的 ISO 周总数（52 或 53） */
export function isoWeeksInYear(year: number): number {
  return getISOWeek(new Date(year, 11, 28)); // 12月28日一定在最后一周
}
