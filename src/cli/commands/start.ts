
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import chalk from "chalk";

import {
  detectFramework,
  detectFastAPIEntry
} from "../../core/detector.js";

interface StartOptions {
  port?: string;
  host?: string;
  framework?: string;
  app?: string;
}

export async function startProject(options: StartOptions) {
  const cwd = process.cwd();

  const framework =
    options.framework ?? await detectFramework(cwd);

  if (!framework) {
    throw new Error(
      "Could not detect framework. Use --framework to specify it."
    );
  }

  if (framework !== "fastapi") {
    throw new Error(
      `${framework} startup is not implemented yet.`
    );
  }

  const app = options.app ?? await detectFastAPIEntry(cwd);

  if (!app) {
    throw new Error(
      "FastAPI entry point not found. Use --app main:app."
    );
  }

  const isWindows = process.platform === "win32";

  const venvCandidates = isWindows
    ? [
        path.join(cwd, ".venv", "Scripts", "python.exe"),
        path.join(cwd, "venv", "Scripts", "python.exe")
      ]
    : [
        path.join(cwd, ".venv", "bin", "python"),
        path.join(cwd, "venv", "bin", "python")
      ];

  let python = isWindows ? "python" : "python3";

  for (const candidate of venvCandidates) {
    try {
      await fs.access(candidate);
      python = candidate;
      break;
    } catch {
      // Try next environment.
    }
  }

  const port = Number(options.port ?? 8000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid port.");
  }

  const host = options.host ?? "127.0.0.1";

  console.log(chalk.green(`✓ Framework: ${framework}`));
  console.log(chalk.green(`✓ Application: ${app}`));
  console.log(chalk.green(`✓ Python: ${python}`));

  console.log(chalk.cyan("\n🚀 Starting development server...\n"));

  const child = spawn(
    python,
    [
      "-m",
      "uvicorn",
      app,
      "--reload",
      "--host",
      host,
      "--port",
      String(port)
    ],
    {
      cwd,
      stdio: "inherit"
    }
  );

  child.on("error", (error) => {
    console.error(chalk.red(error.message));
  });

  child.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Server exited with code ${code}`);
    }
  });
}
