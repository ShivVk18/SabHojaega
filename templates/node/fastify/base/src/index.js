import Fastify from "fastify";

const fastify = Fastify({
  logger: true
});

const port = Number(process.env.PORT) || {{port}};
const host = process.env.HOST || "127.0.0.1";

fastify.get("/", async () => {
  return {
    message: "Welcome to {{projectName}}!"
  };
});

fastify.get("/health", async () => {
  return {
    status: "healthy"
  };
});

async function start() {
  try {
    await fastify.listen({ port, host });
    console.log(`[Fastify] Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

function handleShutdown(signal) {
  fastify.log.info(`[Fastify] Received ${signal}, closing server...`);
  fastify.close().then(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

start();

