<script setup lang="ts">
import { useWorkbench } from "../composables/useWorkbench";
import { effectiveStatus } from "../utils/task";
import type { Task } from "../types";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{ task: Task; compact?: boolean }>(), {
  compact: false,
});

const wb = useWorkbench();

function toggle() {
  const done = effectiveStatus(props.task) === "已完成";
  const next: Task = { ...props.task, status: done ? "进行中" : "已完成" };
  wb.update(next);
}
</script>

<template>
  <button
    class="complete"
    :class="[effectiveStatus(task) === '已完成' ? 'done' : '', compact ? 'sm' : '']"
    :title="effectiveStatus(task) === '已完成' ? '标记为进行中' : '标记完成'"
    @click.stop="toggle"
  >
    <Icon v-if="effectiveStatus(task) === '已完成'" name="check" :size="compact ? 12 : 14" />
  </button>
</template>

<style scoped>
.complete {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--panel);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
.complete:hover {
  border-color: var(--c-done);
}
.complete:active {
  transform: scale(0.92);
}
.complete.done {
  background: var(--c-done);
  border-color: var(--c-done);
}
.complete.sm {
  width: 16px;
  height: 16px;
}
</style>
