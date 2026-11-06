import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FastAPIAdapter } from "../src/adapters/python/fastapi.adapter.js";

describe("FastAPIAdapter", () => {
  let tmpDir: string;
  const templatesDir = path.resolve(process.cwd(), "templates");
  const adapter = new FastAPIAdapter();

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sabhojaega-test-fastapi-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("has correct metadata and properties", () => {
    expect(adapter.id).toBe("fastapi");
    expect(adapter.name).toBe("FastAPI");
    expect(adapter.language).toBe("python");
    expect(adapter.meta.defaultPort).toBe(8000);
  });

  it("detects FastAPI project correctly", async () => {
    await fs.writeFile(
      path.join(tmpDir, "requirements.txt"),
      "fastapi>=0.100.0\nuvicorn\n"
    );
    await fs.writeFile(
      path.join(tmpDir, "main.py"),
      "from fastapi import FastAPI\napp = FastAPI()\n"
    );

    const result = await adapter.detect(tmpDir);
    expect(result.detected).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.entryPoint).toBe("main:app");
    expect(result.language).toBe("python");
  });

  it("creates FastAPI project files via create()", async () => {
    const projectDir = path.join(tmpDir, "my-fastapi");

    const result = await adapter.create({
      projectName: "my-fastapi",
      projectDir,
      templatesDir,
      language: "python",
      framework: "fastapi",
      skipInstall: true
    });

    expect(result.success).toBe(true);
    expect(result.projectDir).toBe(projectDir);

    const exists = await fs.stat(path.join(projectDir, "main.py"));
    expect(exists.isFile()).toBe(true);
  });

  it("setup() handles skipInstall gracefully", async () => {
    const result = await adapter.setup({
      projectDir: tmpDir,
      skipInstall: true
    });

    expect(result.success).toBe(true);
  });
});
