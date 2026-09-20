/**
 * Resolves once `selector` exists under `root`. Useful when an injection
 * point is rendered after document_idle — poll via MutationObserver
 * instead of assuming presence.
 */
export function waitForElement(
  selector: string,
  { timeout = 10000, root = document }: { timeout?: number; root?: Document | Element } = {},
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = root.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = root.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    const timer = timeout
      ? setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Timed out waiting for "${selector}"`));
        }, timeout)
      : undefined;
  });
}
