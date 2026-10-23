// 日历状态：周视图 / 月视图 双模式，统一管理锚点、周期区间与网格数据
// 单例组合式（模块级响应式），供三栏组件共享。
import { ref, computed } from "vue";
import {
  startOfWeek,
  weekDays,
  getISOWeek,
  addDays,
  rangeText,
  toISO,
} from "../utils/date";

export type ViewMode = "week" | "month";

const mode = ref<ViewMode>("month");
const anchor = ref(new Date());
// 月上下文：月视图定位、周视图翻页的边界都以此为准，独立于周锚点
const monthContext = ref(
  new Date(anchor.value.getFullYear(), anchor.value.getMonth(), 1)
);

const md = (d: Date) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;

// —— 周 ——
const weekStart = computed(() => startOfWeek(anchor.value));
const weekDayList = computed(() => weekDays(anchor.value));
const weekNumber = computed(() => getISOWeek(anchor.value));
const weekYear = computed(() => weekStart.value.getFullYear());
const weekRangeText = computed(() => rangeText(weekDayList.value));

// —— 月 ——
const monthStart = computed(
  () => new Date(monthContext.value.getFullYear(), monthContext.value.getMonth(), 1)
);
const monthEnd = computed(
  () =>
    new Date(monthContext.value.getFullYear(), monthContext.value.getMonth() + 1, 0)
);
const monthNumber = computed(() => monthContext.value.getMonth() + 1);
const monthYear = computed(() => monthContext.value.getFullYear());
const monthRangeText = computed(() => `${md(monthStart.value)} - ${md(monthEnd.value)}`);

/** 本月所有日期 */
const monthDays = computed<Date[]>(() => {
  const list: Date[] = [];
  for (let i = 1; i <= monthEnd.value.getDate(); i += 1) {
    list.push(
      new Date(monthContext.value.getFullYear(), monthContext.value.getMonth(), i)
    );
  }
  return list;
});

export interface MonthWeekRow {
  index: number;
  monday: Date;
  days: Date[];
  range: string;
}

/** 覆盖本月的所有自然周（周一为起点），用于侧栏与月历行 */
const monthWeeks = computed<MonthWeekRow[]>(() => {
  const first = startOfWeek(monthStart.value);
  const last = addDays(startOfWeek(monthEnd.value), 6);
  const rows: MonthWeekRow[] = [];
  let cur = first;
  let index = 1;
  while (cur <= last) {
    const ds = Array.from({ length: 7 }, (_, i) => addDays(cur, i));
    rows.push({ index, monday: cur, days: ds, range: rangeText(ds) });
    cur = addDays(cur, 7);
    index += 1;
  }
  return rows;
});

export interface MonthCell {
  blank: boolean;
  date: Date;
  iso: string;
  day: number;
}

/** 月历网格：本月日期正常显示，非本月以 blank 占位 */
const monthGrid = computed<MonthCell[][]>(() => {
  const first = startOfWeek(monthStart.value);
  const last = addDays(startOfWeek(monthEnd.value), 6);
  const rows: MonthCell[][] = [];
  let cur = first;
  const m = monthStart.value.getMonth();
  while (cur <= last) {
    const row: MonthCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(cur, i);
      row.push({
        blank: d.getMonth() !== m,
        date: d,
        iso: toISO(d),
        day: d.getDate(),
      });
    }
    rows.push(row);
    cur = addDays(cur, 7);
  }
  return rows;
});

const isWeek = computed(() => mode.value === "week");
const isMonth = computed(() => mode.value === "month");

// 周视图下是否还能前后翻（限制在本月自然周内）
const canPrev = computed(() => {
  if (!isWeek.value) return true;
  return addDays(weekStart.value, -7) >= startOfWeek(monthStart.value);
});
const canNext = computed(() => {
  if (!isWeek.value) return true;
  return addDays(weekStart.value, 7) <= startOfWeek(monthEnd.value);
});

// —— 当前周期（随模式变化）——
const periodStart = computed(() => (isWeek.value ? weekStart.value : monthStart.value));
const periodEnd = computed(() =>
  isWeek.value ? addDays(weekStart.value, 6) : monthEnd.value
);
const periodDays = computed(() => (isWeek.value ? weekDayList.value : monthDays.value));
const periodRangeText = computed(() =>
  isWeek.value ? weekRangeText.value : monthRangeText.value
);

// —— 导航 ——
/** 周视图：仅在本月覆盖的自然周内翻页 */
function prev() {
  if (isWeek.value) {
    const candidate = addDays(weekStart.value, -7);
    if (candidate < startOfWeek(monthStart.value)) return;
    anchor.value = candidate;
  } else {
    monthContext.value = new Date(monthYear.value, monthNumber.value - 2, 1);
    anchor.value = monthContext.value;
  }
}
function next() {
  if (isWeek.value) {
    const candidate = addDays(weekStart.value, 7);
    if (candidate > startOfWeek(monthEnd.value)) return;
    anchor.value = candidate;
  } else {
    monthContext.value = new Date(monthYear.value, monthNumber.value, 1);
    anchor.value = monthContext.value;
  }
}
function gotoToday() {
  const t = new Date();
  anchor.value = t;
  monthContext.value = new Date(t.getFullYear(), t.getMonth(), 1);
}
/** 进入周视图时，锚定到「今天的周」（若今天在该月内），否则该月第一周 */
function focusWeekAnchor() {
  const now = new Date();
  const inMonth =
    now.getFullYear() === monthContext.value.getFullYear() &&
    now.getMonth() === monthContext.value.getMonth();
  anchor.value = inMonth ? now : startOfWeek(monthStart.value);
}
function setMode(m: ViewMode) {
  if (m === "week" && mode.value !== "week") focusWeekAnchor();
  mode.value = m;
}
function setAnchor(d: Date) {
  anchor.value = d;
}
/** 设置月上下文（月视图定位 / 周视图翻页边界） */
function setMonth(d: Date) {
  monthContext.value = new Date(d.getFullYear(), d.getMonth(), 1);
  if (isWeek.value) focusWeekAnchor();
  else anchor.value = monthContext.value;
}

export function useCalendar() {
  return {
    mode,
    isWeek,
    isMonth,
    setMode,
    anchor,
    setAnchor,
    monthContext,
    setMonth,
    // 周
    weekStart,
    weekDayList,
    weekNumber,
    weekYear,
    weekRangeText,
    // 月
    monthStart,
    monthEnd,
    monthNumber,
    monthYear,
    monthDays,
    monthWeeks,
    monthGrid,
    monthRangeText,
    // 周期
    periodStart,
    periodEnd,
    periodDays,
    periodRangeText,
    // 导航
    prev,
    next,
    gotoToday,
    canPrev,
    canNext,
  };
}
