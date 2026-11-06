import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateProject } from "../src/core/generator.js";

describe("Project Generator", () => {
  let tmpDir: string;
  const templatesDir = path.resolve(process.cwd(), "templates");

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sabhojaega-test-gen-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("generates a FastAPI project successfully using TemplateEngine", async () => {
    const targetDir = path.join(tmpDir, "test-api");

    const resultPath = await generateProject({
      framework: "fastapi",
      projectName: "test-api",
      outputDirectory: targetDir,
      templatesDirectory: templatesDir
    });

    expect(resultPath).toBe(targetDir);

    // Verify file existence in base
    const files = await fs.readdir(targetDir);
    expect(files).toContain("main.py");
    expect(files).toContain("requirements.txt");
    expect(files).toContain("README.md");
    expect(files).toContain(".gitignore");

    // Verify Handlebars substitution
    const mainPy = await fs.readFile(path.join(targetDir, "main.py"), "utf-8");
    expect(mainPy).toContain('title="test-api"');
    expect(mainPy).toContain("Welcome to test-api!");

    const readme = await fs.readFile(path.join(targetDir, "README.md"), "utf-8");
    expect(readme).toContain("# test-api");
  });

  it("fails if destination directory already has files", async () => {
    const targetDir = path.join(tmpDir, "non-empty");
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, "existing.txt"), "hello");

    await expect(
      generateProject({
        framework: "fastapi",
        projectName: "non-empty",
        outputDirectory: targetDir,
        templatesDirectory: templatesDir
      })
    ).rejects.toThrow(/Destination directory is not empty/);
  });

  it("fails on unsupported framework", async () => {
    const targetDir = path.join(tmpDir, "invalid");

    await expect(
      generateProject({
        framework: "invalid-framework-id",
        projectName: "invalid",
        outputDirectory: targetDir,
        templatesDirectory: templatesDir
      })
    ).rejects.toThrow(/is not supported/);
  });
});
