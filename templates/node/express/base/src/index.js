import express from "express";

const app = express();
const port = Number(process.env.PORT) || {{port}};
const host = process.env.HOST || "127.0.0.1";

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to {{projectName}}!"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

const server = app.listen(port, host, () => {
  console.log(`[Express] Server running on http://${host}:${port}`);
});

function handleShutdown(signal) {
  console.log(`[Express] Received ${signal}, closing server...`);
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

