<script setup lang="ts">
import { useShortcut } from '@shortcutter/vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { currentDemo, onDemoChange } from '../active';

const count = ref(0);
const active = ref(false);
let stop: (() => void) | undefined;

onMounted(() => {
  active.value = currentDemo() === 'vue';
  stop = onDemoChange((id) => (active.value = id === 'vue'));
});
onBeforeUnmount(() => stop?.());

useShortcut(
  'K',
  () => count.value++,
  () => ({ enabled: active.value }),
);
useShortcut(
  'J',
  () => count.value--,
  () => ({ enabled: active.value }),
);
useShortcut(
  'Shift+K',
  () => (count.value += 10),
  () => ({ enabled: active.value }),
);
useShortcut(
  'Shift+J',
  () => (count.value -= 10),
  () => ({ enabled: active.value }),
);
</script>

<template>
  <div class="demo-counter">
    <output>{{ count }}</output>
    <p>Vue</p>
  </div>
</template>
