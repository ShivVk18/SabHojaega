import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createProject } from "../src/cli/commands/create.js";
import { startProject } from "../src/cli/commands/start.js";
import { listFrameworks } from "../src/cli/commands/list.js";

describe("CLI Commands", () => {
  let tmpDir: string;
  const templatesDir = path.resolve(process.cwd(), "templates");

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sabhojaega-cli-test-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("listFrameworks() executes and prints without error", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    listFrameworks();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("createProject() creates project non-interactively with --framework and --name", async () => {
    const outputDir = path.join(tmpDir, "auto-api");

    await createProject(templatesDir, undefined, undefined, {
      framework: "fastapi",
      name: "auto-api",
      output: outputDir,
      skipInstall: true
    });

    const stat = await fs.stat(path.join(outputDir, "main.py"));
    expect(stat.isFile()).toBe(true);
  });

  it("createProject() supports positional arguments [framework] [project-name]", async () => {
    const outputDir = path.join(tmpDir, "pos-api");

    await createProject(templatesDir, "fastapi", "pos-api", {
      output: outputDir,
      skipInstall: true
    });

    const stat = await fs.stat(path.join(outputDir, "main.py"));
    expect(stat.isFile()).toBe(true);
  });

  it("createProject() handles unsupported language gracefully", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await createProject(templatesDir, undefined, undefined, {
      framework: "fastapi",
      name: "test-err",
      language: "unsupported-lang"
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("startProject() throws when no framework is detected in empty dir", async () => {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await expect(startProject({})).rejects.toThrow(/Could not detect backend framework/);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("startProject() validates port range", async () => {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await expect(startProject({ framework: "fastapi", port: "999999" })).rejects.toThrow(
        /Invalid port/
      );
    } finally {
      process.chdir(originalCwd);
    }
  });
});
