<script setup lang="ts">
import { computed } from "vue";
import type { Task } from "../types";
import {
  effectiveStatus,
  STATUS_COLOR,
  PRIORITY_COLOR,
  compactRange,
  overdueDays,
} from "../utils/task";
import CompleteButton from "./CompleteButton.vue";

const props = defineProps<{ task: Task }>();
const emit = defineEmits<{ (e: "open", t: Task): void }>();

const eff = computed(() => effectiveStatus(props.task));
const isOverdue = computed(() => eff.value === "已延期");
const delayDays = computed(() => overdueDays(props.task));
const accent = computed(() => (isOverdue.value ? "#d9534f" : STATUS_COLOR[eff.value]));
</script>

<template>
  <div
    class="card"
    :class="{ overdue: isOverdue, done: eff === '已完成' }"
    :style="{ borderLeftColor: accent }"
    @click="emit('open', task)"
  >
    <CompleteButton :task="task" />
    <div class="card-body">
      <div class="card-top">
        <span class="status">
          <span class="dot" :style="{ background: STATUS_COLOR[eff] }"></span>
          {{ eff }}
        </span>
        <span class="prio" :style="{ color: PRIORITY_COLOR[task.priority] }">
          {{ task.priority }}
        </span>
      </div>

      <div class="card-title" :title="task.title">{{ task.title }}</div>

      <div class="card-meta">
        <span class="range">{{ compactRange(task) }}</span>
        <span v-if="isOverdue" class="delay">逾期 {{ delayDays }} 天</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: var(--panel);
  border: 1px solid var(--border);
  border-left: 3px solid var(--c-doing);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  min-width: 0;
}
.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
}
.card.overdue {
  background: #fdf7f4;
}
.card.done {
  background: #f7faf7;
  border-left-color: var(--c-done);
}
.card.done .card-title {
  color: var(--text-3);
  text-decoration: line-through;
}
.card-body {
  flex: 1;
  min-width: 0;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-2);
  white-space: nowrap;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.prio {
  font-size: 10.5px;
  font-weight: 800;
  flex: none;
}
.card-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.range {
  font-size: 10.5px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.delay {
  font-size: 10px;
  font-weight: 700;
  color: #d9534f;
  white-space: nowrap;
  flex: none;
}
</style>
