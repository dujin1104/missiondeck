<script setup lang="ts">
import { useWorkbench } from "../composables/useWorkbench";
import { useCalendar } from "../composables/useCalendar";
import { WEEKDAY_CN, toISO } from "../utils/date";
import { STATUS_FILTER_LIST } from "../types";
import Icon from "./Icon.vue";

defineEmits<{ (e: "collapse"): void }>();

const wb = useWorkbench();
const cal = useCalendar();

/** 本月某一自然周内（仅统计本月日期）的任务数 */
function weekCount(days: Date[]): number {
  let c = 0;
  const m = cal.monthStart.value.getMonth();
  for (const d of days) {
    if (d.getMonth() !== m) continue;
    c += wb.dayCounts.value[toISO(d)] ?? 0;
  }
  return c;
}

function drillToWeek(monday: Date) {
  wb.setSelectedDay(toISO(monday));
  cal.setMode("week");
  cal.setAnchor(monday);
}
</script>

<template>
  <div class="sidebar">
    <div class="brand">
      <div class="brand-top">
        <div>
          <div class="brand-cn">任务工作台</div>
          <div class="brand-en">TASK WORKBENCH</div>
        </div>
        <button class="icon-btn" title="收起侧栏" @click="$emit('collapse')">
          <Icon name="panel-left" :size="18" />
        </button>
      </div>
      <div class="period-meta">
        <template v-if="cal.isWeek.value">
          <span class="period-no">WEEK {{ cal.weekNumber.value }}</span>
          <span class="period-year">{{ cal.weekYear.value }}</span>
        </template>
        <template v-else>
          <span class="period-no">{{ cal.monthNumber.value }}月</span>
          <span class="period-year">{{ cal.monthYear.value }}</span>
        </template>
        <span class="period-range">{{ cal.periodRangeText.value }}</span>
      </div>
    </div>

    <div class="block">
      <div class="block-head">
        <span class="section-title">{{ cal.isWeek.value ? "本周" : "本月周次" }}</span>
        <span v-if="cal.isMonth.value" class="block-hint">点击进入周视图</span>
      </div>

      <ul v-if="cal.isWeek.value" class="day-list">
        <li
          v-for="(d, i) in cal.weekDayList.value"
          :key="i"
          class="day-row"
          :class="{ active: wb.selectedDay.value === toISO(d) }"
          @click="wb.setSelectedDay(toISO(d))"
        >
          <span class="day-name">{{ WEEKDAY_CN[i] }}</span>
          <span class="day-date">{{ d.getMonth() + 1 }}.{{ d.getDate() }}</span>
          <span class="day-count">{{ wb.dayCounts.value[toISO(d)] ?? 0 }}</span>
        </li>
      </ul>

      <ul v-else class="week-list">
        <li
          v-for="w in cal.monthWeeks.value"
          :key="w.index"
          class="week-row"
          @click="drillToWeek(w.monday)"
        >
          <span class="week-name">第 {{ w.index }} 周</span>
          <span class="week-range">{{ w.range }}</span>
          <span class="week-count">{{ weekCount(w.days) }}</span>
          <Icon name="chevron-right" :size="14" class="week-arrow" />
        </li>
      </ul>
    </div>

    <div class="block">
      <div class="block-head">
        <span class="section-title">状态筛选</span>
      </div>
      <div class="filter-list">
        <button
          v-for="f in STATUS_FILTER_LIST"
          :key="f"
          class="filter-btn"
          :class="{ active: wb.statusFilter.value === f }"
          @click="wb.setFilter(f)"
        >
          {{ f }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 20px 16px;
  gap: 20px;
  overflow: hidden;
}
.brand {
  border-bottom: 1px solid var(--border);
  padding-bottom: 14px;
}
.brand-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.brand-cn {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.brand-en {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-3);
  letter-spacing: 0.2em;
  margin-top: 3px;
}
.period-meta {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.period-no {
  font-size: 14px;
  font-weight: 800;
  color: var(--c-doing);
  letter-spacing: 0.02em;
}
.period-year {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.period-range {
  font-size: 12px;
  color: var(--text-2);
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.block-hint {
  font-size: 10px;
  color: var(--text-3);
}
.day-list,
.week-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  scrollbar-width: none;
}
.day-list::-webkit-scrollbar,
.week-list::-webkit-scrollbar {
  display: none;
}
.day-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}
.day-row:hover {
  background: #f3efe9;
}
.day-row.active {
  background: #eaf1fe;
}
.day-name {
  font-size: 13px;
  font-weight: 600;
  width: 32px;
}
.day-date {
  font-size: 12px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.day-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.day-row.active .day-count {
  color: var(--c-doing);
}

.week-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}
.week-row:hover {
  background: #f3efe9;
}
.week-name {
  font-size: 12.5px;
  font-weight: 700;
  width: 58px;
  flex: none;
}
.week-range {
  font-size: 11.5px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.week-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.week-arrow {
  color: var(--text-3);
  flex: none;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.filter-btn {
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-2);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s ease, color 0.15s ease;
}
.filter-btn:hover {
  background: #f3efe9;
  color: var(--text);
}
.filter-btn.active {
  background: var(--text);
  color: #fff;
}
</style>
