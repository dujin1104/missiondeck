<script setup lang="ts">
import { computed } from "vue";
import { useWorkbench } from "../composables/useWorkbench";
import { useCalendar } from "../composables/useCalendar";
import { STATUS_COLOR, effectiveStatus, compactRange } from "../utils/task";
import type { Task } from "../types";

const emit = defineEmits<{ (e: "edit", t: Task): void }>();

const wb = useWorkbench();
const cal = useCalendar();

const note = computed(() =>
  cal.isWeek.value ? "本周有排期，截止日不在本周" : "本月有排期，截止日不在本月"
);
const emptyText = computed(() =>
  cal.isWeek.value ? "本周无跨期任务" : "本月无跨期任务"
);
</script>

<template>
  <section class="cross">
    <div class="cross-head">
      <span class="section-title">跨期任务</span>
      <span class="cross-note">{{ note }}</span>
    </div>
    <div v-if="wb.crossTasks.value.length" class="cross-list">
      <div
        v-for="t in wb.crossTasks.value"
        :key="t.id"
        class="cross-item"
        @click="emit('edit', t)"
      >
        <span class="dot" :style="{ background: STATUS_COLOR[effectiveStatus(t)] }"></span>
        <span class="cross-title">{{ t.title }}</span>
        <span class="cross-range">{{ compactRange(t) }}</span>
        <span
          class="tag"
          :style="{ color: STATUS_COLOR[effectiveStatus(t)], background: '#f3f0ea' }"
        >
          {{ effectiveStatus(t) }}
        </span>
      </div>
    </div>
    <div v-else class="cross-empty">{{ emptyText }}</div>
  </section>
</template>

<style scoped>
.cross {
  margin: 12px 22px 14px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  box-shadow: var(--shadow-sm);
  flex: none;
}
.cross-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.cross-note {
  font-size: 11.5px;
  color: var(--text-3);
}
.cross-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.cross-item {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  max-width: 320px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 11px;
  background: var(--panel-soft);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.cross-item:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.cross-title {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.cross-range {
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.cross-empty {
  font-size: 12px;
  color: var(--text-3);
  padding: 2px 0;
}
</style>
