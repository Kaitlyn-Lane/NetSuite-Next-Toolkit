// Runs a feature's init function, catching and logging any synchronous
// throw so one broken feature can't stop the rest of a shared content
// script's main() from running (e.g. registering a message listener that
// comes after it).
export function safeInit(name: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    console.error(`[NST] "${name}" failed to initialize`, error);
  }
}
