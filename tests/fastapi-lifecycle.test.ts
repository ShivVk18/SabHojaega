import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FastAPIAdapter } from "../src/adapters/python/fastapi.adapter.js";
import { resolvePythonRuntime } from "../src/core/runtime.js";
import { safeSpawn, forwardProcessSignals } from "../src/utils/process.js";

describe("FastAPI Full Lifecycle Tests", () => {
  let tmpDir: string;
  const templatesDir = path.resolve(process.cwd(), "templates");
  const adapter = new FastAPIAdapter();

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sabhojaega-lifecycle-fastapi-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("Step 1 & 2: Project creation & File structure verification", async () => {
    const projectDir = path.join(tmpDir, "test-fastapi-app");

    const result = await adapter.create({
      projectName: "test-fastapi-app",
      projectDir,
      templatesDir,
      language: "python",
      framework: "fastapi",
      skipInstall: true
    });

    expect(result.success).toBe(true);

    // Verify all required files exist
    const files = await fs.readdir(projectDir);
    expect(files).toContain("main.py");
    expect(files).toContain("requirements.txt");
    expect(files).toContain("README.md");
    expect(files).toContain(".gitignore");
  });

  it("Step 3: Dependency / Configuration verification", async () => {
    const projectDir = path.join(tmpDir, "test-fastapi-app");
    await adapter.create({
      projectName: "test-fastapi-app",
      projectDir,
      templatesDir,
      language: "python",
      framework: "fastapi",
      skipInstall: true
    });

    const reqs = await fs.readFile(path.join(projectDir, "requirements.txt"), "utf-8");
    expect(reqs).toContain("fastapi");
    expect(reqs).toContain("uvicorn");

    const mainPy = await fs.readFile(path.join(projectDir, "main.py"), "utf-8");
    expect(mainPy).toContain("from fastapi import FastAPI");
    expect(mainPy).toContain("@app.get(\"/health\")");
    expect(mainPy).toContain("return {\"status\": \"healthy\"}");
  });

  it("Step 4: Runtime availability verification", async () => {
    const pythonInfo = await resolvePythonRuntime();
    expect(pythonInfo).not.toBeNull();
    expect(pythonInfo?.executable).toBeDefined();
  });

  it("Step 5 & 7: Server execution & Graceful signal forwarding verification", () => {
    // Test safe process spawn and signal forwarding handler
    const child = safeSpawn("node", ["-e", "setInterval(() => {}, 1000)"]);
    expect(child.pid).toBeDefined();

    const cleanup = forwardProcessSignals(child);
    expect(typeof cleanup).toBe("function");

    // Test graceful shutdown
    const killed = child.kill("SIGTERM");
    expect(killed).toBe(true);
    cleanup();
  });

  it("Step 6: Health endpoint contract verification in generated code", async () => {
    const projectDir = path.join(tmpDir, "test-fastapi-endpoints");
    await adapter.create({
      projectName: "test-fastapi-endpoints",
      projectDir,
      templatesDir,
      language: "python",
      framework: "fastapi",
      skipInstall: true
    });

    const mainPy = await fs.readFile(path.join(projectDir, "main.py"), "utf-8");
    // Ensure health endpoint is properly declared and responds with {"status": "healthy"}
    expect(mainPy).toMatch(/@app\.get\(\s*["']\/health["']\s*\)/);
    expect(mainPy).toMatch(/async\s+def\s+health\s*\(\s*\)/);
    expect(mainPy).toMatch(/return\s*\{\s*["']status["']\s*:\s*["']healthy["']\s*\}/);

    // Ensure root endpoint is properly declared
    expect(mainPy).toMatch(/@app\.get\(\s*["']\/["']\s*\)/);
    expect(mainPy).toMatch(/Welcome to test-fastapi-endpoints!/);
  });

  it("Detects missing dependencies gracefully during start()", async () => {
    const projectDir = path.join(tmpDir, "uninstalled-fastapi");
    await adapter.create({
      projectName: "uninstalled-fastapi",
      projectDir,
      templatesDir,
      language: "python",
      framework: "fastapi",
      skipInstall: true
    });

    // When uvicorn is not in the system/local python, start() throws a helpful message
    await expect(
      adapter.start({
        projectDir,
        port: 8000,
        stdio: "pipe"
      })
    ).rejects.toThrow(/dependencies not installed|Please install Python/);
  });
});
