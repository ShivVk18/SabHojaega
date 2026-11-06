import chalk from "chalk";
import { defaultRegistry } from "../../registry/framework-registry.js";
import { detectProject } from "../../core/detector.js";
import type { SupportedLanguage } from "../../types/index.js";

export interface StartOptions {
  port?: string | undefined;
  host?: string | undefined;
  framework?: string | undefined;
  language?: string | undefined;
  app?: string | undefined;
}

export async function startProject(options: StartOptions = {}): Promise<void> {
  const cwd = process.cwd();

  let language: SupportedLanguage | undefined = undefined;
  if (options.language) {
    const resolved = defaultRegistry.resolveLanguage(options.language);
    if (!resolved) {
      throw new Error(`Unsupported language "${options.language}".`);
    }
    language = resolved;
  }

  // Detect project language and framework
  const projectInfo = await detectProject(cwd, options.framework, language);

  const detectedFramework = projectInfo.framework;
  const detectedLanguage = projectInfo.language;

  if (!detectedFramework) {
    throw new Error(
      "Could not detect backend framework in current directory.\nUse --framework to specify it (e.g. sabhojaega start --framework fastapi)."
    );
  }

  const adapter = defaultRegistry.getAdapter(
    detectedFramework,
    detectedLanguage ?? undefined
  );

  if (!adapter) {
    const meta = defaultRegistry.getMeta(
      detectedFramework,
      detectedLanguage ?? undefined
    );
    if (meta) {
      throw new Error(
        `Development server for ${meta.name} is scheduled for milestone implementation.\nCurrently ready: FastAPI.`
      );
    }
    throw new Error(
      `Framework "${detectedFramework}" is not supported.`
    );
  }

  let port: number | undefined = undefined;
  if (options.port) {
    port = Number(options.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port: "${options.port}". Port must be an integer between 1 and 65535.`);
    }
  }

  try {
    await adapter.start({
      projectDir: cwd,
      port,
      host: options.host,
      entryPoint: options.app
    });
  } catch (error) {
    console.error(chalk.red("\n✗ Failed to start development server:"));
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
