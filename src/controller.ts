export function useController() {
  /**
   * Internal Set store of pressed keys.
   *
   * @private
   */
  const PRESSED_KEYS: Set<string> = new Set();

  return {
    /**
     * Saves exact key as pressed.
     */
    press(key: string): void {
      PRESSED_KEYS.add(key);
    },
    /**
     * Releases exact key if is saved as pressed.
     */
    release(key: string): void {
      PRESSED_KEYS.delete(key);
    },
    /**
     * Releases all pressed keys.
     */
    releaseAll(): void {
      PRESSED_KEYS.clear();
    },
    /**
     * Returns all keys saved as pressed at the moment.
     */
    getPressed(): string[] {
      return [...PRESSED_KEYS.values()].sort();
    },
    /**
     * Check if key is already saved as pressed.
     */
    isPressed(key: string): boolean {
      return PRESSED_KEYS.has(key);
    },
  };
}
