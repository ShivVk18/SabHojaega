import express, { type Request, type Response } from "express";

const app = express();
const port = Number(process.env.PORT) || {{port}};
const host = process.env.HOST || "127.0.0.1";

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to {{projectName}}!"
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy"
  });
});

const server = app.listen(port, host, () => {
  console.log(`[Express-TS] Server running on http://${host}:${port}`);
});

function handleShutdown(signal: string) {
  console.log(`[Express-TS] Received ${signal}, closing server...`);
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
