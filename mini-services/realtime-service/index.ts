/**
 * VMS PLTT Bintulu — Realtime Mini-Service
 *
 * Socket.io server on port 3003 that broadcasts visit status changes
 * to connected clients (security guards, staff, admin dashboards).
 *
 * Routes:
 *   GET  /                       -> Health check JSON { status, service, connections }
 *   POST /broadcast              -> Internal endpoint for Next.js API routes to broadcast events
 *                                    Body: { event, room, data }
 *   ws   /socket.io/?EIO=4&...   -> Socket.io engine (default path /socket.io/)
 *
 * Rooms (clients join via "join_room" event):
 *   - "security"      -> all security guards
 *   - "staff"         -> all staff
 *   - "admin"         -> all admins
 *   - "user:<id>"     -> individual staff member by userId
 *
 * Events broadcasted (emitted via POST /broadcast):
 *   - visit_status_changed
 *   - new_visit
 *   - visit_approved
 *   - visit_checked_in
 *   - visit_verified
 *   - visit_exited
 *   - overstay_alert
 *
 * Frontend connects via: io("/?XTransformPort=3003", {...})
 *   - URL path "/" is relative (no port in URL)
 *   - XTransformPort=3003 in query tells Caddy to reverse-proxy to localhost:3003
 *   - socket.io-client uses default path "/socket.io/" internally when URI path is "/"
 *
 * NOTE: Port 3003 is HARDCODED per task spec (not from env).
 * NOTE: This service is non-critical — the main app polls as a fallback.
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server, Socket } from "socket.io";

const PORT = 3003;

// ---------------------------------------------------------------------------
// HTTP server: handles / (health check) and /broadcast (internal emit).
// Socket.io will be attached AFTER this handler is registered; socket.io's
// attach() re-orders listeners so that:
//   - requests to /socket.io/* go to the engine (polling + websocket upgrade)
//   - all other requests fall through to our handler below
// ---------------------------------------------------------------------------
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // CORS headers for all responses (Next.js app + browser clients)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "";

  // --- Health check ---
  if (url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "vms-realtime",
        connections: io.engine.clientsCount,
        rooms: getRoomCounts(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // --- Internal broadcast endpoint (called by Next.js API routes) ---
  if (url === "/broadcast" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      // Prevent overly large payloads (>1MB)
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body) as {
          event?: string;
          room?: string;
          data?: unknown;
        };
        const { event, room, data } = payload;

        if (!event || typeof event !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ ok: false, error: "Missing or invalid 'event'" })
          );
          return;
        }
        if (!room || typeof room !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ ok: false, error: "Missing or invalid 'room'" })
          );
          return;
        }

        // Emit to the target room
        io.to(room).emit(event, data);
        const recipients = io.sockets.adapter.rooms.get(room)?.size ?? 0;
        console.log(
          `[realtime] Broadcast "${event}" -> room "${room}" | recipients=${recipients}`
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            emitted: true,
            event,
            room,
            recipients,
          })
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: false,
            error: "Invalid JSON body",
            detail: String(err),
          })
        );
      }
    });
    req.on("error", () => {
      if (!res.writableEnded) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Request error" }));
      }
    });
    return;
  }

  // --- 404 for everything else ---
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: "Not found",
      hint:
        "GET / for health check, POST /broadcast to emit, socket.io on /socket.io/",
    })
  );
});

// ---------------------------------------------------------------------------
// Create socket.io server and ATTACH it to httpServer.
// Using the default socket.io path "/socket.io/" so that:
//   - socket.io intercepts only /socket.io/* requests
//   - all other requests fall through to our HTTP handler above
// The frontend connects via io("/?XTransformPort=3003") which uses the
// default client path "/socket.io/" internally.
// ---------------------------------------------------------------------------
const io = new Server(httpServer, {
  // path defaults to "/socket.io/" — keeps HTTP routes at / and /broadcast clean
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60_000,
  pingInterval: 25_000,
  connectTimeout: 10_000,
});

// ---------------------------------------------------------------------------
// Socket.io connection lifecycle
// ---------------------------------------------------------------------------
io.on("connection", (socket: Socket) => {
  console.log(`[realtime] Client connected: ${socket.id}`);

  // Client requests to join a room (e.g. "security", "staff", "admin", "user:abc123")
  socket.on("join_room", (payload: { room?: string }) => {
    const room = payload?.room;
    if (typeof room !== "string" || room.length === 0) {
      socket.emit("error", { message: "Invalid room" });
      return;
    }
    socket.join(room);
    const members = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    console.log(
      `[realtime] ${socket.id} joined room: "${room}" (total in room: ${members})`
    );
    socket.emit("room_joined", { room, members });
  });

  // Client requests to leave a room
  socket.on("leave_room", (payload: { room?: string }) => {
    const room = payload?.room;
    if (typeof room !== "string") return;
    socket.leave(room);
    const members = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    console.log(
      `[realtime] ${socket.id} left room: "${room}" (remaining: ${members})`
    );
  });

  // Health ping from client (optional, for diagnostics)
  socket.on("ping_server", () => {
    socket.emit("pong_server", { time: Date.now() });
  });

  socket.on("disconnect", (reason: string) => {
    console.log(`[realtime] Client disconnected: ${socket.id} (${reason})`);
  });

  socket.on("error", (err: Error) => {
    console.error(`[realtime] Socket error (${socket.id}):`, err);
  });
});

/**
 * Build a snapshot of room -> member count for diagnostics.
 * Skips per-socket auto-rooms (where room name === socket id).
 */
function getRoomCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  const rooms = io.sockets.adapter.rooms;
  for (const [room, set] of rooms.entries()) {
    // Skip the per-socket auto-rooms (room name === socket id)
    if (io.sockets.sockets.has(room)) continue;
    counts[room] = set.size;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Start the server (port hardcoded per spec)
// ---------------------------------------------------------------------------
httpServer.listen(PORT, () => {
  console.log("===============================================");
  console.log(`[vms-realtime] Server listening on port ${PORT}`);
  console.log(`[vms-realtime] Health check : GET  http://localhost:${PORT}/`);
  console.log(
    `[vms-realtime] Broadcast    : POST http://localhost:${PORT}/broadcast`
  );
  console.log(`[vms-realtime] Socket.io   : path "/socket.io/" (default)`);
  console.log(`[vms-realtime] CORS        : * (all origins)`);
  console.log("===============================================");
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = (signal: string) => {
  console.log(`[vms-realtime] ${signal} received, shutting down...`);
  // Disconnect all connected clients first
  io.disconnectSockets(true);
  io.close(() => {
    httpServer.close(() => {
      console.log("[vms-realtime] Server closed.");
      process.exit(0);
    });
  });
  // Force exit after 5 seconds if graceful shutdown stalls
  setTimeout(() => process.exit(1), 5_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("[vms-realtime] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[vms-realtime] Unhandled rejection:", reason);
});
