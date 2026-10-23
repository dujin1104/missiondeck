<script setup lang="ts">
import { useWorkbench } from "../composables/useWorkbench";
import { useCalendar } from "../composables/useCalendar";
import { WEEKDAY_CN, toISO, isToday } from "../utils/date";
import { STATUS_COLOR, effectiveStatus } from "../utils/task";
import type { Task } from "../types";
import CrossSection from "./CrossSection.vue";
import CompleteButton from "./CompleteButton.vue";

const emit = defineEmits<{ (e: "edit", t: Task): void }>();

const wb = useWorkbench();
const cal = useCalendar();

function tasksOf(d: Date): Task[] {
  return wb.dayTasks.value[toISO(d)] || [];
}
</script>

<template>
  <div class="view">
    <div class="m-head">
      <span v-for="w in WEEKDAY_CN" :key="w">{{ w }}</span>
    </div>

    <div class="m-grid">
      <template v-for="(row, ri) in cal.monthGrid.value" :key="ri">
        <div
          v-for="(cell, ci) in row"
          :key="ci"
          class="cell"
          :class="{
            blank: cell.blank,
            today: !cell.blank && isToday(cell.date),
            selected: !cell.blank && wb.selectedDay.value === cell.iso,
          }"
          @click="!cell.blank && wb.openDay(cell.date)"
        >
          <template v-if="!cell.blank">
            <div class="cell-head">
              <span class="cell-date">{{ cell.day }}</span>
              <span v-if="isToday(cell.date)" class="today-tag">今天</span>
              <span v-else-if="tasksOf(cell.date).length" class="cell-count">
                {{ tasksOf(cell.date).length }} 项
              </span>
            </div>

            <div class="chips">
              <div
                v-for="t in tasksOf(cell.date).slice(0, 3)"
                :key="t.id"
                class="chip"
                :class="{ done: effectiveStatus(t) === '已完成' }"
                @click.stop="emit('edit', t)"
              >
                <CompleteButton :task="t" compact />
                <span
                  class="chip-dot"
                  :style="{ background: STATUS_COLOR[effectiveStatus(t)] }"
                ></span>
                <span class="chip-title">{{ t.title }}</span>
              </div>
              <button
                v-if="tasksOf(cell.date).length > 3"
                class="more"
                @click.stop="wb.openDay(cell.date)"
              >
                还有 {{ tasksOf(cell.date).length - 3 }} 项
              </button>
            </div>
          </template>
        </div>
      </template>
    </div>

    <CrossSection @edit="emit('edit', $event)" />
  </div>
</template>

<style scoped>
.view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.m-head {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 0 22px 8px;
  flex: none;
}
.m-head span {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-3);
  letter-spacing: 0.04em;
  padding-left: 2px;
}
.m-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(88px, 1fr);
  gap: 8px;
  padding: 0 22px;
  overflow-y: auto;
}
.cell {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.cell:hover {
  border-color: var(--border-strong);
}
.cell.blank {
  background: transparent;
  border-color: transparent;
  cursor: default;
  box-shadow: none;
}
.cell.today {
  background: #f4f8ff;
}
.cell.selected {
  border-color: #bcd3fb;
  background: #f4f8ff;
}
.cell-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 5px;
  flex: none;
}
.cell-date {
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.cell.today .cell-date {
  color: var(--c-doing);
}
.today-tag {
  font-size: 9.5px;
  font-weight: 800;
  color: #fff;
  background: var(--c-doing);
  border-radius: 4px;
  padding: 1px 5px;
}
.cell-count {
  font-size: 10px;
  color: var(--text-3);
}
.chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  min-height: 0;
}
.chip {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  border: none;
  background: #f4f1eb;
  border-radius: 5px;
  padding: 3px 6px;
  font-size: 11px;
  text-align: left;
  color: var(--text);
  overflow: hidden;
  transition: background 0.15s ease;
}
.chip:hover {
  background: #eae5dc;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}
.chip-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chip.done {
  background: #f5f6f4;
}
.chip.done .chip-title {
  color: var(--text-3);
  text-decoration: line-through;
}
.more {
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 10.5px;
  font-weight: 600;
  text-align: left;
  padding: 2px 4px;
  border-radius: 5px;
}
.more:hover {
  background: #ece8e1;
  color: var(--text);
}
</style>
