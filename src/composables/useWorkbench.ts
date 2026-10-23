// 工作台统一状态：任务数据 + 状态筛选 + 选中日 + 周期（周/月）派生数据
// 单例组合式（模块级响应式），供三栏组件共享。
import { ref, computed } from "vue";
import { useTasks } from "./useTasks";
import { useCalendar } from "./useCalendar";
import { effectiveStatus, isActiveOn, overdueDays } from "../utils/task";
import {
  parseISO,
  startOfDay,
  isToday,
  daysBetween,
  toISO,
} from "../utils/date";
import type { Task, StatusFilter, TaskStatus } from "../types";
import { STATUS_LIST } from "../types";

const { tasks, loaded, reload, add, update, remove } = useTasks();
const cal = useCalendar();

// 左侧状态筛选（默认全部）
const statusFilter = ref<StatusFilter>("全部");

// 左侧日期列表选中日（默认今天）
const selectedDay = ref<string | null>(toISO(new Date()));

/** 应用状态筛选后的任务（基于「有效状态」匹配） */
const filteredTasks = computed<Task[]>(() => {
  if (statusFilter.value === "全部") return tasks.value;
  return tasks.value.filter((t) => effectiveStatus(t) === statusFilter.value);
});

// 当前周期边界（周或月）
const periodStart = cal.periodStart;
const periodEnd = cal.periodEnd;
const periodDays = cal.periodDays;
const periodRangeText = cal.periodRangeText;

const periodStartIso = computed(() => toISO(periodStart.value));
const periodEndIso = computed(() => toISO(periodEnd.value));

/** 与当前周期区间有交集的任务（活跃于周期内） */
const periodRelevant = computed(() =>
  filteredTasks.value.filter((t) => {
    const s = parseISO(t.start_date);
    const e = parseISO(t.end_date);
    return s <= periodEnd.value && e >= periodStart.value;
  })
);

/** 周期内每日任务：按截止日排布 */
const dayTasks = computed<Record<string, Task[]>>(() => {
  const map: Record<string, Task[]> = {};
  for (const d of periodDays.value) map[toISO(d)] = [];
  for (const t of filteredTasks.value) {
    if (map[t.end_date] !== undefined) map[t.end_date].push(t);
  }
  const prio: Record<string, number> = { 高: 0, 中: 1, 低: 2 };
  for (const k of Object.keys(map)) {
    map[k].sort(
      (a, b) =>
        (prio[a.priority] ?? 9) - (prio[b.priority] ?? 9) ||
        a.start_date.localeCompare(b.start_date)
    );
  }
  return map;
});

/** 跨期任务：周期内有排期（活跃），但截止日超出周期结束日 */
const crossTasks = computed<Task[]>(() =>
  filteredTasks.value.filter((t) => {
    const s = parseISO(t.start_date);
    const e = parseISO(t.end_date);
    return s <= periodEnd.value && e > periodEnd.value;
  })
);

/** 今日在办：今天仍处于活跃区间（含起止当天）的任务 */
const todayTasks = computed<Task[]>(() =>
  filteredTasks.value.filter((t) => isActiveOn(t, startOfDay(new Date())))
);

/** 已逾期：有效状态为「已延期」的任务（全局） */
const overdueTasks = computed<Task[]>(() =>
  filteredTasks.value
    .filter((t) => effectiveStatus(t) === "已延期")
    .sort((a, b) => parseISO(a.end_date).getTime() - parseISO(b.end_date).getTime())
);

/** 当前周期统计标签（周/月自适应口径） */
const periodStats = computed(() => {
  const rel = periodRelevant.value;
  const startIso = periodStartIso.value;
  const endIso = periodEndIso.value;
  const endInPeriod = (t: Task) => t.end_date >= startIso && t.end_date <= endIso;
  return {
    截止: rel.filter(endInPeriod).length,
    跨期: crossTasks.value.length,
    在办: rel.filter((t) => effectiveStatus(t) === "进行中").length,
    逾期: rel.filter((t) => effectiveStatus(t) === "已延期").length,
    已完成: rel.filter((t) => effectiveStatus(t) === "已完成").length,
  };
});

/** 右侧「读数」卡片（标签随周/月变化） */
const periodReadings = computed(() => {
  const prefix = cal.isWeek.value ? "本周" : "本月";
  return [
    { label: `${prefix}截止`, value: periodStats.value.截止, color: "#2f6fed" },
    { label: "进行中", value: periodStats.value.在办, color: "#2f6fed" },
    { label: "已完成", value: periodStats.value.已完成, color: "#2e9e5b" },
    { label: "逾期", value: periodStats.value.逾期, color: "#c77b43" },
  ];
});

/** 右侧读数标题 */
const readingsTitle = computed(() => (cal.isWeek.value ? "本周读数" : "本月读数"));

/** 右侧「状态分布」：基于当前周期内的任务，按有效状态统计 */
const statusDistribution = computed(() => {
  const rel = periodRelevant.value;
  const total = rel.length;
  const counts: Record<TaskStatus, number> = {
    待开始: 0,
    进行中: 0,
    已完成: 0,
    已延期: 0,
  };
  for (const t of rel) counts[effectiveStatus(t)] += 1;
  return STATUS_LIST.map((s) => ({
    status: s,
    count: counts[s],
    percent: total === 0 ? 0 : Math.round((counts[s] / total) * 100),
  }));
});

/** 左侧日期列表：每天任务数（截止日落在当天，按当前筛选） */
const dayCounts = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  for (const d of periodDays.value) map[toISO(d)] = 0;
  for (const t of filteredTasks.value) {
    if (map[t.end_date] !== undefined) map[t.end_date] += 1;
  }
  return map;
});

// 当日任务弹窗（月/周视图点某天时展示）
const dayModalIso = ref<string | null>(null);

function openDay(d: Date) {
  const iso = toISO(d);
  selectedDay.value = iso;
  dayModalIso.value = iso;
}
function closeDay() {
  dayModalIso.value = null;
}

function setFilter(f: StatusFilter) {
  statusFilter.value = f;
}
function setSelectedDay(iso: string) {
  selectedDay.value = iso;
}
function clearSelectedDay() {
  selectedDay.value = null;
}

export function useWorkbench() {
  return {
    // 数据
    tasks,
    loaded,
    reload,
    add,
    update,
    remove,
    // 筛选/选中
    statusFilter,
    selectedDay,
    filteredTasks,
    setFilter,
    setSelectedDay,
    clearSelectedDay,
    dayModalIso,
    openDay,
    closeDay,
    // 周期
    periodStart,
    periodEnd,
    periodDays,
    periodRangeText,
    periodRelevant,
    // 派生
    dayTasks,
    crossTasks,
    todayTasks,
    overdueTasks,
    periodStats,
    periodReadings,
    readingsTitle,
    statusDistribution,
    dayCounts,
    // 工具（重新导出）
    isToday,
    effectiveStatus,
    overdueDays,
    daysBetween,
  };
}
