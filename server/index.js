const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
const HOST = "127.0.0.1";
const PORT = 4000;

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    secret: "devsecret",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true },
  })
);

// In-memory store for user workspaces
const workspaces = new Map(); // key: userId, value: data

// Auth endpoints
app.get("/api/auth/me", (req, res) => {
  const user = req.session.user || null;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });
  // DEV-ONLY: accept any email/password
  const user = { id: email, email, name: email.split("@")[0] };
  req.session.user = user;
  res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Dev-only OAuth stub: simulate provider login and redirect back
app.get("/api/auth/:provider", (req, res) => {
  const { provider } = req.params;
  const { returnTo, email } = req.query || {};
  // Simulate user from provider
  const user = {
    id: `${provider}:${email || "user@example.com"}`,
    email: typeof email === "string" ? email : `${provider}_user@example.com`,
    name: (typeof email === "string" ? email : `${provider}_user`).split("@")[0],
    provider,
  };
  req.session.user = user;
  const redirectTo = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/";
  res.redirect(redirectTo);
});

// Workspace endpoints
app.get("/api/workspace", (req, res) => {
  const user = req.session.user || null;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const data = workspaces.get(user.id) || null;
  res.json({ data });
});

app.post("/api/workspace", (req, res) => {
  const user = req.session.user || null;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: "Missing data" });
  workspaces.set(user.id, data);
  res.json({ ok: true });
});

console.log("BOOTSTRAP_SERVER");
const server = app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
});
server.on("listening", () => {
  const addr = server.address();
  console.log("SERVER_LISTENING", typeof addr === "string" ? addr : `${addr.address}:${addr.port}`);
});
server.on("error", (err) => {
  console.error("SERVER_ERROR", err && (err.code || err.message), err && err.stack ? err.stack : "");
});
