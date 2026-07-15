/**
 * Realtime broadcast helper.
 *
 * Server-side utility used by Next.js API routes to emit events to the
 * realtime socket.io mini-service (running on port 3003).
 *
 * The mini-service then forwards the event to all clients currently joined
 * to the target room (e.g. "security", "staff", "admin", "user:<id>").
 *
 * IMPORTANT: This is a server-to-server call (Next.js API route → mini-service).
 * It bypasses the Caddy gateway and goes directly to localhost:3003, so no
 * XTransformPort query param is needed.
 *
 * Failures are logged but never thrown — realtime is a non-critical
 * enhancement. The app already auto-refreshes via setInterval on the client.
 */

const REALTIME_URL = "http://localhost:3003/broadcast";

// Timeout (ms) for the broadcast HTTP call. Keep it short so a slow or down
// realtime service never noticeably delays an API response.
const BROADCAST_TIMEOUT_MS = 2_000;

export async function broadcast(
  event: string,
  room: string,
  data: unknown
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    BROADCAST_TIMEOUT_MS
  );

  try {
    const res = await fetch(REALTIME_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, room, data }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(
        `[realtime] Broadcast failed: HTTP ${res.status} ${res.statusText} (event=${event}, room=${room})`
      );
    }
  } catch (e) {
    // Fail silently — realtime is non-critical. App falls back to polling.
    if (e instanceof Error && e.name === "AbortError") {
      console.error(
        `[realtime] Broadcast timed out after ${BROADCAST_TIMEOUT_MS}ms (event=${event}, room=${room})`
      );
    } else {
      console.error(
        `[realtime] Broadcast failed (event=${event}, room=${room}):`,
        e instanceof Error ? e.message : e
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convenience helpers for the standard VMS realtime events.
 * Use these in API routes for type-safety and discoverability.
 */
export const realtime = {
  newVisit: (data: unknown) => broadcast("new_visit", "security", data),
  visitApproved: (data: unknown) =>
    broadcast("visit_approved", "security", data),
  visitStatusChanged: (room: string, data: unknown) =>
    broadcast("visit_status_changed", room, data),
  visitCheckedIn: (data: unknown) =>
    broadcast("visit_checked_in", "staff", data),
  visitVerified: (data: unknown) => broadcast("visit_verified", "security", data),
  visitExited: (data: unknown) => broadcast("visit_exited", "security", data),
  overstayAlert: (data: unknown) => broadcast("overstay_alert", "security", data),
};
