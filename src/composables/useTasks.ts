// 任务数据组合式：加载与 CRUD，并维护响应式任务列表
import { ref } from "vue";
import type { Task } from "../types";
import * as db from "../db";

const tasks = ref<Task[]>([]);
const loaded = ref(false);

async function reload() {
  tasks.value = await db.getAllTasks();
  loaded.value = true;
}

async function add(t: Task) {
  await db.insertTask(t);
  await reload();
}

async function update(t: Task) {
  await db.updateTask(t);
  await reload();
}

async function remove(id: string) {
  await db.deleteTask(id);
  await reload();
}

export function useTasks() {
  return { tasks, loaded, reload, add, update, remove };
}
