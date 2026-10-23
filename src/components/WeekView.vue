<script setup lang="ts">
import { useWorkbench } from "../composables/useWorkbench";
import { useCalendar } from "../composables/useCalendar";
import { WEEKDAY_CN, toISO, isToday } from "../utils/date";
import type { Task } from "../types";
import TaskCard from "./TaskCard.vue";
import CrossSection from "./CrossSection.vue";

const emit = defineEmits<{ (e: "edit", t: Task): void }>();

const wb = useWorkbench();
const cal = useCalendar();

function colClass(d: Date): Record<string, boolean> {
  return {
    today: isToday(d),
    selected: wb.selectedDay.value === toISO(d),
  };
}
</script>

<template>
  <div class="view">
    <div class="grid-wrap">
      <div class="week-grid">
        <div
          v-for="(d, i) in cal.weekDayList.value"
          :key="i"
          class="day-col"
          :class="colClass(d)"
        >
          <div class="day-head" @click="wb.openDay(d)">
            <span class="wd-cn">{{ WEEKDAY_CN[i] }}</span>
            <span class="wd-date">{{ d.getDate() }}</span>
            <span v-if="isToday(d)" class="today-tag">今天</span>
          </div>

          <div class="day-body">
            <TaskCard
              v-for="t in wb.dayTasks.value[toISO(d)] || []"
              :key="t.id"
              :task="t"
              @open="emit('edit', $event)"
            />
            <div v-if="(wb.dayTasks.value[toISO(d)] || []).length === 0" class="empty">
              没有任务
            </div>
          </div>
        </div>
      </div>
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
.grid-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 22px;
}
.week-grid {
  display: flex;
  gap: 12px;
  min-width: 100%;
  min-height: 0;
}
.day-col {
  flex: 1 1 0;
  min-width: 150px;
  background: var(--panel);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.day-col.selected {
  background: #eef4fe;
}
.day-col.today .day-head {
  background: #eaf1fe;
}
.day-head {
  padding: 10px 12px 9px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  gap: 8px;
  cursor: pointer;
  flex: none;
}
.wd-cn {
  font-size: 12.5px;
  font-weight: 700;
}
.wd-date {
  font-size: 21px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.today-tag {
  margin-left: auto;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  background: var(--c-doing);
  border-radius: 5px;
  padding: 2px 6px;
}
.day-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: none;
}
.day-body::-webkit-scrollbar {
  display: none;
}
.empty {
  color: var(--text-3);
  font-size: 12px;
  text-align: center;
  padding: 20px 0;
}
</style>
