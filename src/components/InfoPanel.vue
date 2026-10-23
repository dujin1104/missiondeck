<script setup lang="ts">
import { useWorkbench } from "../composables/useWorkbench";
import { STATUS_COLOR, effectiveStatus } from "../utils/task";
import type { Task } from "../types";
import Icon from "./Icon.vue";
import CompleteButton from "./CompleteButton.vue";

defineEmits<{ (e: "collapse"): void; (e: "edit", t: Task): void }>();

const wb = useWorkbench();
</script>

<template>
  <div class="panel">
    <div class="panel-head">
      <span class="section-title">信息面板</span>
      <button class="icon-btn" title="收起信息栏" @click="$emit('collapse')">
        <Icon name="panel-right" :size="18" />
      </button>
    </div>

    <section class="mod">
      <div class="mod-head section-title">今日在办</div>
      <div v-if="wb.todayTasks.value.length" class="list">
        <div
          v-for="t in wb.todayTasks.value"
          :key="t.id"
          class="row"
          @click="$emit('edit', t)"
        >
          <CompleteButton :task="t" compact />
          <span class="dot" :style="{ background: STATUS_COLOR[effectiveStatus(t)] }"></span>
          <span class="row-title">{{ t.title }}</span>
          <span class="row-status" :style="{ color: STATUS_COLOR[effectiveStatus(t)] }">
            {{ effectiveStatus(t) }}
          </span>
        </div>
      </div>
      <div v-else class="mod-empty">今天暂无在办任务</div>
    </section>

    <section class="mod">
      <div class="mod-head section-title">{{ wb.readingsTitle.value }}</div>
      <div class="readings">
        <div v-for="r in wb.periodReadings.value" :key="r.label" class="reading">
          <span class="reading-val" :style="{ color: r.color }">{{ r.value }}</span>
          <span class="reading-label">{{ r.label }}</span>
        </div>
      </div>
    </section>

    <section class="mod">
      <div class="mod-head section-title">状态分布</div>
      <div class="bar">
        <template v-for="d in wb.statusDistribution.value" :key="d.status">
          <span
            v-if="d.percent > 0"
            class="bar-seg"
            :style="{ width: d.percent + '%', background: STATUS_COLOR[d.status] }"
            :title="`${d.status} ${d.percent}%`"
          ></span>
        </template>
        <span v-if="wb.periodRelevant.value.length === 0" class="bar-empty"></span>
      </div>
      <div class="legend">
        <div v-for="d in wb.statusDistribution.value" :key="d.status" class="legend-row">
          <span class="dot" :style="{ background: STATUS_COLOR[d.status] }"></span>
          <span class="legend-name">{{ d.status }}</span>
          <span class="legend-count">{{ d.count }}</span>
          <span class="legend-pct">{{ d.percent }}%</span>
        </div>
      </div>
    </section>

    <section class="mod">
      <div class="mod-head section-title">已逾期</div>
      <div v-if="wb.overdueTasks.value.length" class="list">
        <div
          v-for="t in wb.overdueTasks.value"
          :key="t.id"
          class="row over"
          @click="$emit('edit', t)"
        >
          <CompleteButton :task="t" compact />
          <span class="dot over-dot"></span>
          <span class="row-title">{{ t.title }}</span>
          <span class="row-delay">逾期 {{ wb.overdueDays(t) }} 天</span>
        </div>
      </div>
      <div v-else class="mod-empty ok">无逾期任务</div>
    </section>
  </div>
</template>

<style scoped>
.panel {
  height: 100%;
  background: var(--panel);
  border-left: 1px solid var(--border);
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mod {
  background: var(--panel-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.mod-head {
  margin-bottom: 12px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.row:hover {
  background: #f3efe9;
  border-color: var(--border);
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: 0 0 auto;
}
.over-dot {
  background: var(--c-over-red);
}
.row-title {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-status {
  font-size: 11.5px;
  font-weight: 700;
}
.row-delay {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-over-red);
}
.mod-empty {
  font-size: 12px;
  color: var(--text-3);
  padding: 6px 2px;
}
.mod-empty.ok {
  color: var(--c-done);
}

.readings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.reading {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 8px;
}
.reading-val {
  font-size: 25px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.reading-label {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 4px;
}

.bar {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  background: #ece8e1;
  margin-bottom: 14px;
}
.bar-seg {
  height: 100%;
}
.bar-seg + .bar-seg {
  box-shadow: -1px 0 0 #fff;
}
.bar-empty {
  width: 100%;
}
.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
}
.legend-name {
  font-weight: 600;
}
.legend-count {
  margin-left: auto;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.legend-pct {
  width: 46px;
  text-align: right;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
</style>
