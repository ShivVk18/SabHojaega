import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || {{port}};
  await app.listen(port);
  console.log(`[NestJS] Application is running on: http://127.0.0.1:${port}`);
}

bootstrap();

