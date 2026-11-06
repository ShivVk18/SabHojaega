import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { resolvePythonRuntime } from "./runtime.js";
import { safeSpawn, runCommand } from "../utils/process.js";

export interface SetupOptions {
  startServer?: boolean;
}

export async function setupFastAPI(
  projectPath: string,
  options: SetupOptions = {}
): Promise<ChildProcess | undefined> {
  const isWindows = process.platform === "win32";
  const pythonInfo = await resolvePythonRuntime();
  const python = pythonInfo ? pythonInfo.executable : (isWindows ? "py" : "python3");

  const venvArgs = isWindows
    ? ["-3", "-m", "venv", ".venv"]
    : ["-m", "venv", ".venv"];

  console.log("\nCreating virtual environment...");
  await runCommand(python, venvArgs, { cwd: projectPath });

  const venvPython = isWindows
    ? path.join(projectPath, ".venv", "Scripts", "python.exe")
    : path.join(projectPath, ".venv", "bin", "python");

  await fs.access(venvPython);

  console.log("\nInstalling dependencies...");
  await runCommand(
    venvPython,
    ["-m", "pip", "install", "-r", "requirements.txt"],
    { cwd: projectPath }
  );

  if (options.startServer) {
    console.log("\nStarting FastAPI server...\n");

    const child = safeSpawn(
      venvPython,
      [
        "-m",
        "uvicorn",
        "main:app",
        "--reload",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
      ],
      {
        cwd: projectPath,
        stdio: "inherit"
      }
    );

    child.on("error", (error) => {
      console.error("Failed to start Uvicorn:", error);
    });

    return child;
  }

  return undefined;
}
