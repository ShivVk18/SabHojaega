import { spawn, type SpawnOptions, type ChildProcess } from "node:child_process";

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a command safely using child_process.spawn with argument arrays.
 * Shell concatenation is explicitly disabled by default.
 */
export function safeSpawn(
  command: string,
  args: string[],
  options: SpawnOptions = {}
): ChildProcess {
  return spawn(command, args, {
    shell: false,
    ...options
  });
}

/**
 * Run a command and return stdout/stderr/exitCode.
 */
export function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions = {}
): Promise<RunCommandResult> {
  return new Promise((resolve, reject) => {
    const child = safeSpawn(command, args, {
      ...options,
      stdio: options.stdio ?? ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (data: Buffer | string) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data: Buffer | string) => {
        stderr += data.toString();
      });
    }

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 0
      });
    });
  });
}

/**
 * Attach termination signal handlers (SIGINT, SIGTERM) to the parent process
 * to forward signals gracefully to the child development server process.
 */
export function forwardProcessSignals(child: ChildProcess): () => void {
  const onSignal = (signal: NodeJS.Signals) => {
    if (!child.killed) {
      try {
        child.kill(signal);
      } catch {
        // Child may have already exited.
      }
    }
  };

  const handleSigInt = () => onSignal("SIGINT");
  const handleSigTerm = () => onSignal("SIGTERM");

  process.on("SIGINT", handleSigInt);
  process.on("SIGTERM", handleSigTerm);

  const cleanup = () => {
    process.removeListener("SIGINT", handleSigInt);
    process.removeListener("SIGTERM", handleSigTerm);
  };

  child.on("close", cleanup);
  child.on("error", cleanup);

  return cleanup;
}
