<script setup lang="ts">
// Docs demo: a J/K counter and the keys held right now.
import { usePressedKeys, useShortcut } from '@shortcutter/vue';
import { formatKeys } from 'shortcutter/format';
import { computed, ref } from 'vue';

const count = ref(0);
const pressed = usePressedKeys();
const held = computed(() => formatKeys(pressed.value));

useShortcut('K', () => count.value++);
useShortcut('J', () => count.value--);
useShortcut('Shift+K', () => (count.value += 10));
useShortcut('Shift+J', () => (count.value -= 10));
</script>

<template>
  <div class="fw-demo not-content">
    <output>{{ count }}</output>
    <p><kbd>K</kbd> up, <kbd>J</kbd> down, with <kbd>Shift</kbd> by 10</p>
    <p class="fw-demo-held" aria-live="polite">
      <template v-if="held.length">
        <kbd v-for="key in held" :key="key">{{ key }}</kbd>
      </template>
      <template v-else>No keys held</template>
    </p>
  </div>
</template>
