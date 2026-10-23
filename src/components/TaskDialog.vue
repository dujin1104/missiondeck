<script setup lang="ts">
import { ref, watch } from "vue";
import type { Task } from "../types";
import { STATUS_LIST, PRIORITY_LIST } from "../types";
import { toISO } from "../utils/date";
import Icon from "./Icon.vue";

const props = defineProps<{
  show: boolean;
  task: Task | null;
  defaultDate?: string;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", t: Task): void;
  (e: "remove", id: string): void;
}>();

const form = ref<Task>(blank());
const error = ref("");

function blank(): Task {
  const d = props.defaultDate ?? toISO(new Date());
  return {
    id: "",
    title: "",
    status: "待开始",
    priority: "中",
    start_date: d,
    end_date: d,
    remark: "",
  };
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      error.value = "";
      form.value = props.task
        ? { ...props.task, remark: props.task.remark ?? "" }
        : blank();
    }
  }
);

function save() {
  const f = form.value;
  if (!f.title.trim()) {
    error.value = "请填写任务标题";
    return;
  }
  if (f.end_date < f.start_date) {
    error.value = "截止日期不能早于开始日期";
    return;
  }
  const out: Task = {
    ...f,
    title: f.title.trim(),
    remark: f.remark?.trim() || null,
    id: f.id || crypto.randomUUID(),
  };
  emit("save", out);
}

function remove() {
  if (form.value.id) emit("remove", form.value.id);
}
</script>

<template>
  <div v-if="show" class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dlg-head">
        <span>{{ task ? "编辑任务" : "新建任务" }}</span>
        <button class="icon-btn" title="关闭" @click="emit('close')">
          <Icon name="x" :size="18" />
        </button>
      </div>

      <div class="dlg-body">
        <label class="field">
          <span class="field-label">任务标题</span>
          <input v-model="form.title" class="input" placeholder="输入任务标题" />
        </label>

        <div class="field-row">
          <label class="field">
            <span class="field-label">状态</span>
            <select v-model="form.status" class="input">
              <option v-for="s in STATUS_LIST" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">优先级</span>
            <select v-model="form.priority" class="input">
              <option v-for="p in PRIORITY_LIST" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
        </div>

        <div class="field-row">
          <label class="field">
            <span class="field-label">开始日期</span>
            <input v-model="form.start_date" type="date" class="input" />
          </label>
          <label class="field">
            <span class="field-label">截止日期</span>
            <input v-model="form.end_date" type="date" class="input" />
          </label>
        </div>

        <label class="field">
          <span class="field-label">备注</span>
          <textarea
            v-model="form.remark"
            class="input textarea"
            rows="3"
            placeholder="可选"
          ></textarea>
        </label>

        <div v-if="error" class="err">{{ error }}</div>
      </div>

      <div class="dlg-foot">
        <button v-if="task" class="btn btn-danger" @click="remove">
          <Icon name="trash-2" :size="16" /> 删除
        </button>
        <span class="spacer"></span>
        <button class="btn" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 26, 20, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.dialog {
  width: 440px;
  max-width: calc(100vw - 40px);
  background: var(--panel);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(30, 26, 20, 0.18);
  overflow: hidden;
}
.dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 12px 16px;
  font-size: 15px;
  font-weight: 800;
  border-bottom: 1px solid var(--border);
}
.dlg-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}
.field-row {
  display: flex;
  gap: 12px;
}
.field-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-2);
}
.input {
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 7px 9px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text);
  background: var(--panel);
  outline: none;
}
.input:focus {
  border-color: var(--c-doing);
}
.textarea {
  resize: vertical;
}
.err {
  color: #d9534f;
  font-size: 11.5px;
  font-weight: 600;
}
.dlg-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: var(--panel-soft);
}
.spacer {
  flex: 1;
}
</style>
