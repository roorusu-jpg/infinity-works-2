const http = require("node:http");

const PORT = Number(process.env.PORT) || 10000;
const TTL_MS = 90_000;
const activeClients = new Map();
const allowedOrigins = new Set([
  "https://infinity-works-2.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
]);

function pruneExpired() {
  const now = Date.now();
  for (const [id, lastSeen] of activeClients) {
    if (now - lastSeen > TTL_MS) activeClients.delete(id);
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  res.end(JSON.stringify(payload));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2048) throw new Error("Request too large");
  }
  return JSON.parse(body || "{}");
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const path = new URL(req.url, "http://localhost").pathname;
  if (req.method === "GET" && path === "/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && path === "/presence/count") {
    pruneExpired();
    return sendJson(res, 200, { count: activeClients.size, updatedAt: Date.now() });
  }

  if (req.method === "POST" && path === "/presence/heartbeat") {
    try {
      const { id } = await readJson(req);
      if (typeof id !== "string" || !/^[a-zA-Z0-9-]{20,80}$/.test(id)) {
        return sendJson(res, 400, { error: "Invalid client id" });
      }
      pruneExpired();
      if (activeClients.size < 10000 || activeClients.has(id)) {
        activeClients.set(id, Date.now());
      }
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 400, { error: "Invalid request" });
    }
  }

  return sendJson(res, 404, { error: "Not found" });
});

setInterval(pruneExpired, 30_000).unref();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Presence API listening on port ${PORT}`);
});
