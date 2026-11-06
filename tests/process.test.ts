import { describe, it, expect } from "vitest";
import { safeSpawn, runCommand } from "../src/utils/process.js";

describe("Safe Process Execution", () => {
  it("runs command safely and returns stdout and exitCode", async () => {
    const result = await runCommand("node", ["-e", "console.log('hello safe process')"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("hello safe process");
  });

  it("handles errors and non-zero exit codes", async () => {
    const result = await runCommand("node", ["-e", "process.exit(42)"]);
    expect(result.exitCode).toBe(42);
  });

  it("safeSpawn creates a ChildProcess with shell: false", () => {
    const child = safeSpawn("node", ["-v"]);
    expect(child.pid).toBeDefined();
    child.kill();
  });
});
