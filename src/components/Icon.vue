<script setup lang="ts">
// 轻量内联 SVG 图标（Lucide 风格，stroke=currentColor），离线可用
const props = defineProps<{ name: string; size?: number }>();
const s = props.size ?? 18;

const PATHS: Record<string, string[]> = {
  "panel-left": [
    "M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
    "M9 4v16",
  ],
  "panel-right": [
    "M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
    "M15 4v16",
  ],
  plus: ["M12 5v14", "M5 12h14"],
  "chevron-left": ["M15 18l-6-6 6-6"],
  "chevron-right": ["M9 18l6-6-6-6"],
  "chevron-down": ["M6 9l6 6 6-6"],
  "check": ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  "trash-2": [
    "M3 6h18",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    "M10 11v6M14 11v6",
  ],
  calendar: [
    "M3 4h18v18H3z",
    "M3 10h18",
    "M8 2v4M16 2v4",
  ],
  "bar-chart": ["M12 20v-6", "M18 20V8", "M6 20v-3"],
  clock: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    "M12 7v5l3 2",
  ],
  alert: [
    "M12 9v4",
    "M12 17h.01",
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  ],
};
</script>

<template>
  <svg
    :width="s"
    :height="s"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon"
    aria-hidden="true"
  >
    <path v-for="(d, i) in PATHS[name] || []" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  flex: none;
}
</style>
