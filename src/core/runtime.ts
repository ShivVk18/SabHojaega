import fs from "node:fs/promises";
import path from "node:path";
import { runCommand } from "../utils/process.js";
import type { RuntimeCheckResult } from "../types/index.js";

/**
 * Check if a command is available on PATH and return its version.
 */
export async function checkCommandAvailable(
  binary: string,
  versionArgs: string[] = ["--version"]
): Promise<RuntimeCheckResult> {
  try {
    const result = await runCommand(binary, versionArgs);
    if (result.exitCode === 0) {
      const output = result.stdout || result.stderr;
      const firstLine = output.split("\n")[0]?.trim();
      return {
        available: true,
        runtime: binary,
        version: firstLine || undefined,
        executablePath: binary
      };
    }
    return {
      available: false,
      runtime: binary,
      error: `Command "${binary}" returned exit code ${result.exitCode}${result.stderr ? `: ${result.stderr}` : ""}`
    };
  } catch (error) {
    return {
      available: false,
      runtime: binary,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export interface PythonRuntimeInfo {
  executable: string;
  isVenv: boolean;
  version?: string | undefined;
}

/**
 * Find the Python executable for a project, preferring local virtual environments.
 */
export async function resolvePythonRuntime(
  projectDir?: string
): Promise<PythonRuntimeInfo | null> {
  const isWindows = process.platform === "win32";

  if (projectDir) {
    const venvCandidates = isWindows
      ? [
          path.join(projectDir, ".venv", "Scripts", "python.exe"),
          path.join(projectDir, "venv", "Scripts", "python.exe")
        ]
      : [
          path.join(projectDir, ".venv", "bin", "python"),
          path.join(projectDir, "venv", "bin", "python")
        ];

    for (const candidate of venvCandidates) {
      try {
        await fs.access(candidate);
        const check = await checkCommandAvailable(candidate, ["--version"]);
        if (check.available) {
          return {
            executable: candidate,
            isVenv: true,
            version: check.version
          };
        }
      } catch {
        // Continue searching
      }
    }
  }

  // Fallback to system Python
  const systemCandidates = isWindows
    ? ["py", "python", "python3"]
    : ["python3", "python"];

  for (const candidate of systemCandidates) {
    const check = await checkCommandAvailable(candidate, ["--version"]);
    if (check.available) {
      return {
        executable: candidate,
        isVenv: false,
        version: check.version
      };
    }
  }

  return null;
}

/**
 * Check if Node.js runtime is available.
 */
export async function resolveNodeRuntime(): Promise<RuntimeCheckResult> {
  return checkCommandAvailable("node", ["-v"]);
}

/**
 * Check if Java runtime is available.
 */
export async function resolveJavaRuntime(): Promise<RuntimeCheckResult> {
  return checkCommandAvailable("java", ["-version"]);
}

/**
 * Check if Go runtime is available.
 */
export async function resolveGoRuntime(): Promise<RuntimeCheckResult> {
  return checkCommandAvailable("go", ["version"]);
}
