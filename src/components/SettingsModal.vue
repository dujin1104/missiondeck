<script setup lang="ts">
import { ref, watch } from "vue";
import Icon from "./Icon.vue";
import { useWorkbench } from "../composables/useWorkbench";
import {
  getAllTasks,
  countAllTasks,
  clearAllTasks,
  bulkInsertTasks,
  sanitizeImportedTasks,
  getDbDisplayPath,
} from "../db";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const wb = useWorkbench();

// —— 版本与基础信息 ——
const appName = ref("任务工作台");
const appVersion = ref("1.0.2");
const appIdentifier = ref("com.missiondeck.taskbench");
const dbPath = ref("本地 SQLite · tasks.db");
const taskCount = ref(0);

async function loadInfo() {
  try {
    const app = await import("@tauri-apps/api/app");
    try {
      appName.value = await app.getName();
    } catch {
      /* 忽略 */
    }
    try {
      appVersion.value = await app.getVersion();
    } catch {
      /* 忽略 */
    }
  } catch {
    /* 浏览器预览环境：保持默认常量 */
  }
  try {
    dbPath.value = await getDbDisplayPath();
  } catch {
    /* 忽略 */
  }
  try {
    taskCount.value = await countAllTasks();
  } catch {
    taskCount.value = wb.tasks.value.length;
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      loadInfo();
    } else {
      // 关闭时清空上一次导入/导出遗留的临时状态，避免重开仍显示旧结果
      exportMsg.value = "";
      importMsg.value = "";
      confirmImport.value = false;
      importText.value = "";
      importCount.value = 0;
      importFilePath.value = "";
      importFile.value = null;
      showExportPreview.value = false;
      exportText.value = "";
      if (fileInput.value) fileInput.value.value = "";
    }
  }
);

// —— 导出（数据迁移）——
const exportText = ref("");
const showExportPreview = ref(false);
const exportMsg = ref("");

async function buildExportText(): Promise<string> {
  const rows = await getAllTasks();
  return JSON.stringify({ app: appIdentifier.value, version: appVersion.value, tasks: rows }, null, 2);
}

async function refreshExport() {
  exportText.value = await buildExportText();
}

async function doExportDownload() {
  try {
    const rows = await getAllTasks();
    const json = JSON.stringify(
      { app: appIdentifier.value, version: appVersion.value, tasks: rows },
      null,
      2
    );

    // 优先使用 Tauri 原生「存储到哪」对话框
    let savedPath: string | null = null;
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      savedPath = await save({
        defaultPath: `missiondeck-tasks-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: "JSON 文件", extensions: ["json"] }],
      });
    } catch {
      savedPath = null;
    }

    if (savedPath) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("write_file", { path: savedPath, contents: json });
      exportMsg.value = `已导出到：${savedPath}`;
      return;
    }

    // 浏览器预览环境（无 Tauri）：退化为 blob 下载
    if (!savedPath) {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `missiondeck-tasks-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      exportMsg.value = "已导出数据文件（可用于迁移备份）。";
    }
  } catch (e) {
    exportMsg.value = `导出失败：${String(e)}`;
  }
}

async function doCopyJson() {
  let text = "";
  try {
    if (!exportText.value) await refreshExport();
    text = exportText.value;
  } catch {
    exportMsg.value = "读取数据库失败，无法复制。";
    return;
  }

  // 1) Tauri 剪贴板插件（WKWebView 中最可靠）
  try {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
    exportMsg.value = "JSON 已复制到剪贴板。";
    return;
  } catch {
    /* 继续尝试其他方式 */
  }

  // 2) 浏览器 Clipboard API
  try {
    await navigator.clipboard.writeText(text);
    exportMsg.value = "JSON 已复制到剪贴板。";
    return;
  } catch {
    /* 继续尝试 execCommand 兜底 */
  }

  // 3) execCommand 兜底（旧 WebView）
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    exportMsg.value = ok
      ? "JSON 已复制到剪贴板。"
      : "复制失败，请点击「预览数据」后手动选取。";
  } catch {
    exportMsg.value = "复制失败，请点击「预览数据」后手动选取。";
  }
}

function togglePreview() {
  showExportPreview.value = !showExportPreview.value;
  if (showExportPreview.value && !exportText.value) refreshExport();
}

// —— 导入（数据导入）——
const importFile = ref<File | null>(null);
const importFilePath = ref("");
const importText = ref("");
const importCount = ref(0);
const importMode = ref<"merge" | "replace">("merge");
const importMsg = ref("");
const importing = ref(false);
const confirmImport = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function applyImportText(text: string) {
  importMsg.value = "";
  try {
    const parsed = JSON.parse(text);
    const list = sanitizeImportedTasks(
      Array.isArray(parsed) ? parsed : parsed?.tasks
    );
    importText.value = JSON.stringify(list, null, 2);
    importCount.value = list.length;
    if (list.length === 0) importMsg.value = "未解析到有效任务数据，未导入。";
  } catch {
    importText.value = "";
    importCount.value = 0;
    importMsg.value = "文件不是合法的 JSON，未导入。";
  }
}

// 执行导入：弹出原生文件选择框，选定后直接导入；浏览器环境退回隐藏 input
async function runImport() {
  // 1) 尝试加载 Tauri dialog 插件（仅在桌面壳内可用）
  let openFn: ((opts: unknown) => Promise<unknown>) | null = null;
  try {
    const mod = await import("@tauri-apps/plugin-dialog");
    openFn = mod.open as (opts: unknown) => Promise<unknown>;
  } catch {
    openFn = null;
  }

  // 2) Tauri 环境：使用原生文件选择对话框
  if (openFn) {
    let path: string | null = null;
    try {
      path = (await openFn({
        multiple: false,
        filters: [{ name: "JSON 文件", extensions: ["json"] }],
      })) as string | null;
    } catch (e) {
      importMsg.value = `打开文件选择框失败：${String(e)}`;
      return;
    }
    if (!path) return; // 用户取消，无需提示

    importFilePath.value = path;
    importFile.value = null;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const text = (await invoke("read_file", { path })) as string;
      applyImportText(text);
      // 选完文件后进入「确认」环节，不直接写入
      if (importCount.value > 0) confirmImport.value = true;
    } catch (e) {
      importMsg.value = `读取文件失败：${String(e)}`;
    }
    return;
  }

  // 3) 浏览器预览环境（无 Tauri）：使用隐藏的 input，读取后进入确认环节
  fileInput.value?.click();
  if (!fileInput.value) {
    importMsg.value = "当前环境不支持文件选择。";
  }
}

function onPickFile(e: Event) {
  const el = e.target as HTMLInputElement;
  const f = el.files?.[0] ?? null;
  importFile.value = f;
  importFilePath.value = "";
  if (!f) {
    importText.value = "";
    importCount.value = 0;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    applyImportText(String(reader.result));
    // 选完文件后进入「确认」环节，不直接写入
    confirmImport.value = importCount.value > 0;
  };
  reader.readAsText(f);
}

async function doImport() {
  if (importCount.value === 0) {
    importMsg.value = "没有可导入的任务，请先选择文件。";
    return;
  }
  const list = sanitizeImportedTasks(
    importText.value ? JSON.parse(importText.value) : []
  );
  importing.value = true;
  try {
    if (importMode.value === "replace") {
      await clearAllTasks();
    }
    const inserted = await bulkInsertTasks(list);
    await wb.reload();
    taskCount.value = await countAllTasks();
    importMsg.value = `已从「${importFilePath.value || "所选文件"}」导入：成功写入 ${inserted} 条，跳过 ${list.length - inserted} 条（主键冲突）。`;
    importText.value = "";
    importCount.value = 0;
    importFile.value = null;
    if (fileInput.value) fileInput.value.value = "";
  } catch (err) {
    importMsg.value = `导入失败：${String(err)}`;
  } finally {
    importing.value = false;
  }
}

// 确认导入：真正写入数据库
async function confirmDoImport() {
  await doImport();
  confirmImport.value = false;
}

// 取消导入：清空已选文件与待导入数据
function cancelImport() {
  confirmImport.value = false;
  importText.value = "";
  importCount.value = 0;
  importFilePath.value = "";
  importFile.value = null;
  if (fileInput.value) fileInput.value.value = "";
}

// —— 清空全部数据 ——
const clearConfirm = ref(false);
const clearing = ref(false);
const clearMsg = ref("");

function askClear() {
  if (taskCount.value === 0) {
    clearMsg.value = "当前没有任务数据，无需清空。";
    return;
  }
  clearMsg.value = "";
  clearConfirm.value = true;
}

async function doClear() {
  clearing.value = true;
  try {
    await clearAllTasks();
    await wb.reload();
    taskCount.value = await countAllTasks();
    clearMsg.value = "已清空全部任务数据。";
    clearConfirm.value = false;
  } catch (e) {
    clearMsg.value = `清空失败：${String(e)}`;
  } finally {
    clearing.value = false;
  }
}

function cancelClear() {
  clearConfirm.value = false;
}
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="modal-mask" @click.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <header class="modal-head">
          <div class="modal-title">
            <Icon name="settings" :size="18" />
            <span>设置</span>
          </div>
          <button class="icon-btn" title="关闭" @click="emit('close')">
            <Icon name="x" :size="18" />
          </button>
        </header>

        <div class="modal-body">
          <!-- 版本 / 关于 -->
          <section class="block">
            <div class="block-title">关于与版本</div>
            <div class="kv">
              <span class="k">应用名称</span><span class="v">{{ appName }}</span>
              <span class="k">当前版本</span><span class="v">{{ appVersion }}</span>
              <span class="k">应用标识</span><span class="v">{{ appIdentifier }}</span>
              <span class="k">数据存储</span><span class="v mono">{{ dbPath }}</span>
            </div>
            <div class="hint">
              纯本地单机工具 · 数据全部保存在本机 SQLite，无任何网络请求。
            </div>
          </section>

          <!-- 数据迁移（导出） -->
          <section class="block">
            <div class="block-title">数据迁移（导出备份）</div>
            <div class="hint">
              将全部任务导出为 JSON 文件，可在其他设备或重装后通过「数据导入」恢复。
            </div>
            <div class="actions">
              <button class="btn btn-primary" @click="doExportDownload">
                <Icon name="download" :size="16" /> 导出为 JSON 文件
              </button>
              <button class="btn" @click="doCopyJson">
                <Icon name="copy" :size="16" /> 复制 JSON
              </button>
              <button class="btn btn-ghost" @click="togglePreview">
                {{ showExportPreview ? "收起预览" : "预览数据" }}
              </button>
            </div>
            <pre v-if="showExportPreview" class="preview">{{ exportText || "（点击预览加载）" }}</pre>
          </section>

          <!-- 数据导入 -->
          <section class="block">
            <div class="block-title">数据导入</div>
            <div class="hint">
              点击下方「执行导入」将弹出文件选择框，选定 JSON 文件后需确认再导入。导入前请先选择模式：「合并」跳过主键冲突，「覆盖」会清空现有数据后写入。
            </div>
            <div class="seg seg-inline">
              <button
                class="seg-btn"
                :class="{ active: importMode === 'merge' }"
                @click="importMode = 'merge'"
              >
                合并
              </button>
              <button
                class="seg-btn"
                :class="{ active: importMode === 'replace' }"
                @click="importMode = 'replace'"
              >
                覆盖
              </button>
            </div>
            <div class="actions">
              <button
                class="btn btn-primary"
                :disabled="importing || confirmImport"
                @click="runImport"
              >
                <Icon name="upload" :size="16" /> {{ importing ? "导入中…" : "执行导入" }}
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="application/json,.json"
                class="file-input"
                style="display: none"
                @change="onPickFile"
              />
              <span v-if="importFilePath && !confirmImport" class="file-name">{{ importFilePath }}</span>
            </div>

            <div v-if="confirmImport" class="confirm-box">
              <div class="confirm-text">
                已选择文件：<span class="mono">{{ importFilePath }}</span><br />
                将导入 <b>{{ importCount }}</b> 条任务，模式：<b>{{ importMode === "merge" ? "合并" : "覆盖" }}</b>。确认执行？
              </div>
              <div class="actions">
                <button
                  class="btn btn-primary"
                  :disabled="importing"
                  @click="confirmDoImport"
                >
                  {{ importing ? "导入中…" : "确认导入" }}
                </button>
                <button class="btn btn-ghost" :disabled="importing" @click="cancelImport">
                  取消
                </button>
              </div>
            </div>
          </section>

          <!-- 数据清空 -->
          <section class="block">
            <div class="block-title">数据清空</div>
            <div class="hint">
              将删除本机数据库中所有任务（不可恢复）。如需要，请先通过上方「导出备份」保存数据。
            </div>
            <div class="actions">
              <button
                class="btn btn-danger"
                :disabled="clearConfirm || clearing"
                @click="askClear"
              >
                <Icon name="trash-2" :size="16" /> 清空全部数据
              </button>
            </div>

            <div v-if="clearConfirm" class="confirm-box confirm-danger">
              <div class="confirm-text">
                确定要清空全部 <b>{{ taskCount }}</b> 条任务吗？此操作不可恢复。
              </div>
              <div class="actions">
                <button
                  class="btn btn-danger"
                  :disabled="clearing"
                  @click="doClear"
                >
                  {{ clearing ? "清空中…" : "确认清空" }}
                </button>
                <button class="btn btn-ghost" :disabled="clearing" @click="cancelClear">
                  取消
                </button>
              </div>
            </div>
          </section>

          <div v-if="exportMsg || importMsg || clearMsg" class="msg">
            {{ exportMsg || importMsg || clearMsg }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(31, 30, 28, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}
.modal {
  width: 560px;
  max-width: 100%;
  max-height: 88vh;
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
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
}
.modal-body {
  padding: 16px;
  overflow-y: auto;
}
.block {
  padding: 14px 0;
  border-bottom: 1px dashed var(--border);
}
.block:first-child {
  padding-top: 0;
}
.block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.block-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
}
.kv {
  display: grid;
  grid-template-columns: 88px 1fr;
  row-gap: 7px;
  column-gap: 10px;
  font-size: 13px;
}
.k {
  color: var(--text-2);
}
.v {
  color: var(--text);
  font-weight: 600;
  word-break: break-all;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}
.hint {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.6;
  margin: 8px 0;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0 4px;
}
.file-input {
  font-size: 12.5px;
  color: var(--text-2);
  max-width: 100%;
}
.file-name {
  font-size: 12px;
  color: var(--text-2);
  font-weight: 600;
}
.confirm-box {
  margin-top: 12px;
  padding: 12px 14px;
  background: #fff7ed;
  border: 1px solid #f0d9c4;
  border-radius: var(--radius-sm);
}
.confirm-text {
  font-size: 12.5px;
  color: #8a5a2b;
  line-height: 1.7;
  margin-bottom: 10px;
}
.confirm-text .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  word-break: break-all;
}
.confirm-text b {
  color: #b9532f;
}
.confirm-danger {
  background: #fef2f2;
  border-color: #f4c9c9;
}
.confirm-danger .confirm-text {
  color: #a13b3b;
}
.confirm-danger .confirm-text b {
  color: #c0392b;
}
.seg-inline {
  margin: 6px 0 2px;
}
.seg {
  display: inline-flex;
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
  padding: 5px 14px;
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
.preview {
  margin-top: 10px;
  max-height: 180px;
  overflow: auto;
  background: var(--panel-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  font-size: 11.5px;
  line-height: 1.5;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-2);
  white-space: pre-wrap;
  word-break: break-all;
}
.import-preview {
  color: var(--c-doing);
}
.msg {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f3f7ff;
  border: 1px solid #d6e2fb;
  color: #2f6fed;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  line-height: 1.5;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
