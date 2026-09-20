// Shared contract between entrypoints/popup and entrypoints/nav.content.ts
// — imported by both sides so a mismatch is a compile error, not a runtime surprise.

export const BUILD_NAV_MENU_MESSAGE = "BUILD_NAV_MENU" as const;

export interface BuildNavMenuRequest {
  type: typeof BUILD_NAV_MENU_MESSAGE;
}

export type BuildNavMenuResponse = { ok: true; count: number } | { ok: false; error: string };

export function isBuildNavMenuRequest(message: unknown): message is BuildNavMenuRequest {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === BUILD_NAV_MENU_MESSAGE
  );
}
