<script setup lang="ts">
import { computed } from "vue";
import { useWorkbench } from "../composables/useWorkbench";
import { parseISO, WEEKDAY_CN } from "../utils/date";
import type { Task } from "../types";
import TaskCard from "./TaskCard.vue";
import Icon from "./Icon.vue";

const props = defineProps<{ show: boolean; iso: string }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit", t: Task): void;
  (e: "create", date: string): void;
}>();

const wb = useWorkbench();

const tasks = computed<Task[]>(() => wb.dayTasks.value[props.iso] || []);

const dateLabel = computed(() => {
  if (!props.iso) return "";
  const d = parseISO(props.iso);
  const wd = WEEKDAY_CN[(d.getDay() + 6) % 7];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${wd}`;
});
</script>

<template>
  <div v-if="show" class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div class="head-text">
          <div class="date">{{ dateLabel }}</div>
          <div class="count">共 {{ tasks.length }} 项任务</div>
        </div>
        <div class="head-actions">
          <button class="btn btn-ghost" @click="emit('create', iso)">
            <Icon name="plus" :size="15" /> 新建
          </button>
          <button class="icon-btn" title="关闭" @click="emit('close')">
            <Icon name="x" :size="18" />
          </button>
        </div>
      </div>

      <div class="modal-body">
        <TaskCard
          v-for="t in tasks"
          :key="t.id"
          :task="t"
          compact
          @open="emit('edit', $event)"
        />
        <div v-if="tasks.length === 0" class="empty">这一天没有任务</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(40, 36, 30, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  padding: 24px;
}
.modal {
  width: 448px;
  max-width: 100%;
  max-height: 76vh;
  background: var(--panel);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border);
  flex: none;
}
.date {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.3;
}
.count {
  margin-top: 1px;
  font-size: 12px;
  color: var(--text-2);
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 11px 15px 13px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.empty {
  color: var(--text-3);
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}
</style>
