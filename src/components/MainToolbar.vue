<script setup lang="ts">
import { computed, ref } from "vue";
import { useCalendar } from "../composables/useCalendar";
import { useWorkbench } from "../composables/useWorkbench";
import { toISO } from "../utils/date";
import Icon from "./Icon.vue";

defineProps<{ leftCollapsed?: boolean; rightCollapsed?: boolean }>();
const emit = defineEmits<{
  (e: "create"): void;
  (e: "toggle-left"): void;
  (e: "toggle-right"): void;
}>();

const cal = useCalendar();
const wb = useWorkbench();

const title = computed(() => `${cal.monthYear.value}年${cal.monthNumber.value}月`);
const subtitle = computed(() => cal.periodRangeText.value);

const statItems = computed(() => {
  const s = wb.periodStats.value;
  const prefix = cal.isWeek.value ? "本周" : "本月";
  return [
    { label: `${prefix}截止`, value: s.截止, color: "#2f6fed" },
    { label: "跨期", value: s.跨期, color: "#8a7bd8" },
    { label: "在办", value: s.在办, color: "#2f6fed" },
    { label: "逾期", value: s.逾期, color: "#c77b43" },
    { label: "已完成", value: s.已完成, color: "#2e9e5b" },
  ];
});

// —— 月份选择器 ——
const showPicker = ref(false);
const pickerYear = ref(cal.monthYear.value);

function togglePicker() {
  showPicker.value = !showPicker.value;
  if (showPicker.value) {
    showWeekPicker.value = false;
    pickerYear.value = cal.monthYear.value;
  }
}
function isMonthSel(m: number): boolean {
  return pickerYear.value === cal.monthYear.value && m === cal.monthNumber.value;
}
function pickMonth(m: number) {
  const target = new Date(pickerYear.value, m - 1, 1);
  cal.setMonth(target);
  showPicker.value = false;
}

// —— 当月周选择器 ——
const showWeekPicker = ref(false);

function toggleWeekPicker() {
  showWeekPicker.value = !showWeekPicker.value;
  if (showWeekPicker.value) showPicker.value = false;
}
function isWeekRowSel(monday: Date): boolean {
  return cal.isWeek.value && toISO(monday) === toISO(cal.weekStart.value);
}
function pickWeekRow(monday: Date) {
  cal.setMode("week");
  cal.setAnchor(monday);
  wb.setSelectedDay(toISO(monday));
  showWeekPicker.value = false;
}
</script>

<template>
  <header class="head">
    <div class="head-left">
      <button
        class="icon-btn"
        :title="leftCollapsed ? '展开侧栏' : '收起侧栏'"
        @click="emit('toggle-left')"
      >
        <Icon name="panel-left" :size="18" />
      </button>
      <div class="title-wrap">
        <button class="title" @click="togglePicker">
          <span>{{ title }}</span>
          <Icon name="chevron-down" :size="16" class="title-caret" />
        </button>
        <button
          v-if="cal.isWeek.value"
          class="subtitle"
          :class="{ open: showWeekPicker }"
          @click="toggleWeekPicker"
        >
          <span>{{ subtitle }}</span>
          <Icon name="chevron-down" :size="13" class="subtitle-caret" />
        </button>

        <div v-if="showPicker" class="picker-backdrop" @click="showPicker = false"></div>
        <div v-if="showPicker" class="picker" @click.stop>
          <div class="picker-year">
            <button class="icon-btn" @click="pickerYear--">
              <Icon name="chevron-left" :size="16" />
            </button>
            <span class="picker-year-text">{{ pickerYear }} 年</span>
            <button class="icon-btn" @click="pickerYear++">
              <Icon name="chevron-right" :size="16" />
            </button>
          </div>

          <div class="picker-grid">
            <button
              v-for="m in 12"
              :key="m"
              class="picker-cell"
              :class="{ active: isMonthSel(m) }"
              @click="pickMonth(m)"
            >
              {{ m }}月
            </button>
          </div>
        </div>

        <template v-if="cal.isWeek.value">
          <div
            v-if="showWeekPicker"
            class="picker-backdrop"
            @click="showWeekPicker = false"
          ></div>
          <div v-if="showWeekPicker" class="week-picker" @click.stop>
            <div class="week-picker-head">{{ title }} · 选择周</div>
            <div class="week-list">
              <button
                v-for="w in cal.monthWeeks.value"
                :key="w.index"
                class="week-row"
                :class="{ active: isWeekRowSel(w.monday) }"
                @click="pickWeekRow(w.monday)"
              >
                <span class="week-range">{{ w.range }}</span>
                <Icon v-if="isWeekRowSel(w.monday)" name="check" :size="14" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="head-right">
      <div class="seg">
        <button
          class="seg-btn"
          :class="{ active: cal.isWeek.value }"
          @click="cal.setMode('week')"
        >
          周
        </button>
        <button
          class="seg-btn"
          :class="{ active: cal.isMonth.value }"
          @click="cal.setMode('month')"
        >
          月
        </button>
      </div>

      <div class="nav">
        <button
          class="icon-btn"
          :title="cal.isWeek.value ? '上一周' : '上一月'"
          :disabled="!cal.canPrev.value"
          @click="cal.prev()"
        >
          <Icon name="chevron-left" :size="18" />
        </button>
        <button class="btn btn-ghost" @click="cal.gotoToday()">今天</button>
        <button
          class="icon-btn"
          :title="cal.isWeek.value ? '下一周' : '下一月'"
          :disabled="!cal.canNext.value"
          @click="cal.next()"
        >
          <Icon name="chevron-right" :size="18" />
        </button>
      </div>

      <button class="btn btn-primary" @click="emit('create')">
        <Icon name="plus" :size="16" /> 新建任务
      </button>

      <button
        class="icon-btn"
        :title="rightCollapsed ? '展开信息栏' : '收起信息栏'"
        @click="emit('toggle-right')"
      >
        <Icon name="panel-right" :size="18" />
      </button>
    </div>
  </header>

  <div class="stats">
    <div v-for="s in statItems" :key="s.label" class="stat">
      <span class="stat-val" :style="{ color: s.color }">{{ s.value }}</span>
      <span class="stat-label">{{ s.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px 12px;
  gap: 14px;
  row-gap: 10px;
  flex: none;
  flex-wrap: wrap;
}
.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.title-wrap {
  min-width: 0;
  position: relative;
}
.title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  border-radius: 6px;
  transition: color 0.15s ease;
}
.title:hover {
  color: var(--c-doing);
}
.title-caret {
  color: var(--text-3);
  transform: translateY(1px);
}

.picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
}
.picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 232px;
  background: var(--panel);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 12px;
  z-index: 61;
}
.picker-year {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.picker-year-text {
  font-size: 13px;
  font-weight: 800;
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.picker-cell {
  border: 1px solid var(--border);
  background: var(--panel-soft);
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 4px;
  border-radius: 7px;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.picker-cell:hover {
  border-color: var(--border-strong);
  background: #f3efe9;
}
.picker-cell.active {
  background: var(--c-doing);
  border-color: var(--c-doing);
  color: #fff;
}
.subtitle {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
  padding: 1px 4px 1px 0;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--text-2);
  white-space: nowrap;
  cursor: pointer;
  border-radius: 5px;
  transition: color 0.15s ease;
}
.subtitle:hover,
.subtitle.open {
  color: var(--c-doing);
}
.subtitle-caret {
  color: var(--text-3);
  transition: transform 0.15s ease;
}
.subtitle.open .subtitle-caret {
  transform: rotate(180deg);
}

.week-picker {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 214px;
  background: var(--panel);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 10px;
  z-index: 61;
}
.week-picker-head {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-3);
  padding: 2px 4px 8px;
}
.week-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 260px;
  overflow-y: auto;
}
.week-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 6px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.week-row:hover {
  background: #f5f2ec;
}
.week-row.active {
  background: var(--c-doing);
  color: #fff;
}
.week-row.active .week-range {
  color: #fff;
}
.head-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.seg {
  display: flex;
  align-items: center;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}
.seg-btn {
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 12.5px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 7px;
  transition: background 0.15s ease, color 0.15s ease;
}
.seg-btn:hover {
  color: var(--text);
}
.seg-btn.active {
  background: var(--text);
  color: #fff;
}
.nav {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.stats {
  display: flex;
  gap: 10px;
  padding: 0 22px 12px;
  flex-wrap: wrap;
  flex: none;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 76px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}
.stat-val {
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.stat-label {
  font-size: 11px;
  color: var(--text-2);
  margin-top: 2px;
}
</style>
