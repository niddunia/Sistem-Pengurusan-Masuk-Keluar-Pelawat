"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

/**
 * useRealtime — subscribes the caller to a realtime room on the
 * VMS realtime mini-service (socket.io on port 3003) and forwards
 * every standard visit event to the supplied `onEvent` callback.
 *
 * CRITICAL (gateway rule):
 *   - The socket.io URL is ALWAYS a RELATIVE path with XTransformPort query
 *     param. Caddy reads the query param and forwards to localhost:3003.
 *   - NEVER use `io("http://localhost:3003")` or any direct-port URL.
 *
 * Available rooms:
 *   - "security"           -> security guards (receive all security events)
 *   - "staff"              -> all staff (receive visit_approved / visit_checked_in)
 *   - "admin"              -> all admins (broadcast analytics updates)
 *   - "user:<profileId>"   -> individual staff member (receive personal events)
 *
 * Standard events forwarded to onEvent:
 *   - visit_status_changed
 *   - new_visit
 *   - visit_approved
 *   - visit_checked_in
 *   - visit_verified
 *   - visit_exited
 *   - overstay_alert
 *
 * NOTE: This hook is provided for FUTURE use — the views currently rely on
 *       setInterval polling which is sufficient. Wiring this hook into a view
 *       will let it react to events instantly without polling.
 *
 * @param room    The room name to join (e.g. "security", "user:profile-001")
 * @param onEvent Callback invoked with (eventName, payload) for every event
 */
export function useRealtime(
  room: string,
  onEvent: (event: string, data: unknown) => void
): void {
  const socketRef = useRef<Socket | null>(null);

  // Keep a stable reference to the latest onEvent so we don't reconnect
  // every time the parent re-renders with a new inline callback.
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // CRITICAL: path is always "/", port via XTransformPort query param.
    // Caddy inspects XTransformPort and reverse-proxies to localhost:3003.
    // socket.io-client uses the default path "/socket.io/" internally when
    // the URI path is "/" — this matches the server's default path.
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      timeout: 10_000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Join the requested room on (re)connect
      socket.emit("join_room", { room });
    });

    socket.on("disconnect", (reason: string) => {
      console.debug(`[realtime] disconnected from room "${room}": ${reason}`);
    });

    socket.on("connect_error", (err: Error) => {
      // Realtime is non-critical; log and move on. Polling still works.
      console.warn(`[realtime] connect error (room=${room}):`, err.message);
    });

    // Listen for all standard VMS visit events
    const events = [
      "visit_status_changed",
      "new_visit",
      "visit_approved",
      "visit_checked_in",
      "visit_verified",
      "visit_exited",
      "overstay_alert",
    ] as const;

    const handlers: Array<[string, (data: unknown) => void]> = events.map(
      (e) => [
        e,
        (data: unknown) => {
          try {
            onEventRef.current(e, data);
          } catch (err) {
            console.error(
              `[realtime] onEvent handler error for "${e}":`,
              err
            );
          }
        },
      ]
    );
    handlers.forEach(([e, h]) => socket.on(e, h));

    return () => {
      // Best-effort leave, then disconnect
      try {
        socket.emit("leave_room", { room });
      } catch {
        /* ignore */
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [room]);
}
