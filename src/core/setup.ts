
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} exited with code ${code}`)
        );
      }
    });
  });
}

export async function setupFastAPI(projectPath: string) {
  const isWindows = process.platform === "win32";

  const python = isWindows ? "py" : "python3";

  const venvArgs = isWindows
    ? ["-3", "-m", "venv", ".venv"]
    : ["-m", "venv", ".venv"];

  console.log("\nCreating virtual environment...");

  await runCommand(python, venvArgs, projectPath);

  const venvPython = isWindows
    ? path.join(projectPath, ".venv", "Scripts", "python.exe")
    : path.join(projectPath, ".venv", "bin", "python");

  await fs.access(venvPython);

  console.log("\nInstalling dependencies...");

  await runCommand(
    venvPython,
    ["-m", "pip", "install", "-r", "requirements.txt"],
    projectPath
  );

  console.log("\nStarting FastAPI server...\n");

  const child = spawn(
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
