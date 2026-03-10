const express = require("express");
const cors = require("cors");
require("dotenv").config();

const identifyRoutes = require("./routes/identifyRoutes");
const { errorHandler } = require("./utils/errorHandler");
const prisma = require("./database/prisma");

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use("/identify", identifyRoutes);

app.get("/", (req, res) => {
  res.send("Bitespeed Identity Reconciliation API");
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler (must be after all routes) ──
app.use(errorHandler);

// ── Start server ──
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ── Graceful shutdown ──
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Process exiting.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Handle unhandled rejections & uncaught exceptions ──
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
