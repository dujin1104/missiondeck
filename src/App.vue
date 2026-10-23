<script setup lang="ts">
import { onMounted, ref } from "vue";
import { initDb } from "./db";
import { useWorkbench } from "./composables/useWorkbench";
import { useCalendar } from "./composables/useCalendar";
import Sidebar from "./components/Sidebar.vue";
import MainToolbar from "./components/MainToolbar.vue";
import WeekView from "./components/WeekView.vue";
import MonthView from "./components/MonthView.vue";
import InfoPanel from "./components/InfoPanel.vue";
import TaskDialog from "./components/TaskDialog.vue";
import type { Task } from "./types";

const wb = useWorkbench();
const cal = useCalendar();
const ready = ref(false);
const bootError = ref("");

const leftCollapsed = ref(false);
const rightCollapsed = ref(true);

const showDialog = ref(false);
const editingTask = ref<Task | null>(null);
const defaultDate = ref<string | undefined>(undefined);

async function boot() {
  try {
    await initDb();
    await wb.reload();
    ready.value = true;
  } catch (e) {
    bootError.value = String(e);
  }
}
onMounted(boot);

function openCreate(date?: string) {
  editingTask.value = null;
  defaultDate.value = date;
  showDialog.value = true;
}
function openEdit(t: Task) {
  editingTask.value = t;
  defaultDate.value = undefined;
  showDialog.value = true;
}
function closeDialog() {
  showDialog.value = false;
  editingTask.value = null;
}
async function onSave(t: Task) {
  if (editingTask.value) await wb.update(t);
  else await wb.add(t);
  closeDialog();
}
async function onRemove(id: string) {
  await wb.remove(id);
  closeDialog();
}

// 拖拽调整栏宽
const leftWidth = ref(280);
const rightWidth = ref(340);
let drag: null | { side: "left" | "right"; startX: number; startW: number } = null;

function startDrag(side: "left" | "right", e: MouseEvent) {
  const w = side === "left" ? leftWidth.value : rightWidth.value;
  drag = { side, startX: e.clientX, startW: w };
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);
  document.body.style.userSelect = "none";
}
function onDrag(e: MouseEvent) {
  if (!drag) return;
  const dx = e.clientX - drag.startX;
  if (drag.side === "left") {
    leftWidth.value = Math.min(440, Math.max(220, drag.startW + dx));
  } else {
    rightWidth.value = Math.min(480, Math.max(260, drag.startW - dx));
  }
}
function endDrag() {
  drag = null;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", endDrag);
  document.body.style.userSelect = "";
}
</script>

<template>
  <div class="app">
    <div v-if="!ready" class="boot">
      <div v-if="bootError" class="boot-err">初始化失败：{{ bootError }}</div>
      <div v-else>正在加载本地数据…</div>
    </div>

    <template v-else>
      <aside v-show="!leftCollapsed" class="col left" :style="{ width: leftWidth + 'px' }">
        <Sidebar @collapse="leftCollapsed = true" />
      </aside>
      <div v-show="!leftCollapsed" class="resizer" @mousedown="startDrag('left', $event)"></div>

      <main class="col center-col">
        <MainToolbar
          :left-collapsed="leftCollapsed"
          :right-collapsed="rightCollapsed"
          @create="openCreate()"
          @toggle-left="leftCollapsed = !leftCollapsed"
          @toggle-right="rightCollapsed = !rightCollapsed"
        />
        <WeekView v-if="cal.isWeek.value" @edit="openEdit" />
        <MonthView v-else @edit="openEdit" />
      </main>

      <div v-show="!rightCollapsed" class="resizer" @mousedown="startDrag('right', $event)"></div>
      <aside v-show="!rightCollapsed" class="col right" :style="{ width: rightWidth + 'px' }">
        <InfoPanel @collapse="rightCollapsed = true" @edit="openEdit" />
      </aside>

      <TaskDialog
        :show="showDialog"
        :task="editingTask"
        :default-date="defaultDate"
        @close="closeDialog"
        @save="onSave"
        @remove="onRemove"
      />
    </template>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  background: var(--bg);
}
.col {
  height: 100%;
  flex: 0 0 auto;
  overflow: hidden;
}
.center-col {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.resizer {
  width: 5px;
  flex: 0 0 auto;
  cursor: col-resize;
  background: transparent;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
  transition: background 0.15s ease;
}
.resizer:hover {
  background: #e3ddd2;
}
.boot {
  margin: auto;
  color: var(--text-2);
  font-size: 13px;
}
.boot-err {
  color: var(--c-over-red);
  max-width: 480px;
  padding: 20px;
}
</style>
