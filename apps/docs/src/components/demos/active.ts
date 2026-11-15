// The landing page shows one framework demo at a time; only that one should react to J/K.
// The tab switcher stores the active demo on <html data-demo> and announces changes with this event.
export const DEMO_EVENT = 'sc:demo';

export type DemoId = 'typescript' | 'react' | 'vue' | 'svelte' | 'solid';

export function currentDemo(): string {
  return document.documentElement.dataset.demo ?? 'typescript';
}

export function onDemoChange(callback: (id: string) => void): () => void {
  const handler = (event: Event) => callback((event as CustomEvent<string>).detail);

  window.addEventListener(DEMO_EVENT, handler);
  return () => window.removeEventListener(DEMO_EVENT, handler);
}
