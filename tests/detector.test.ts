import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  detectLanguage,
  detectFramework,
  detectFastAPIEntry,
  detectProject
} from "../src/core/detector.js";

describe("Language & Framework Detector", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sabhojaega-test-detect-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it("detects Python from requirements.txt", async () => {
    await fs.writeFile(path.join(tmpDir, "requirements.txt"), "fastapi\nuvicorn\n");
    const lang = await detectLanguage(tmpDir);
    expect(lang).toBe("python");
  });

  it("detects Go from go.mod", async () => {
    await fs.writeFile(path.join(tmpDir, "go.mod"), "module example.com/app\ngo 1.20\n");
    const lang = await detectLanguage(tmpDir);
    expect(lang).toBe("go");
  });

  it("detects Java from pom.xml", async () => {
    await fs.writeFile(path.join(tmpDir, "pom.xml"), "<project></project>");
    const lang = await detectLanguage(tmpDir);
    expect(lang).toBe("java");
  });

  it("detects TypeScript from tsconfig.json", async () => {
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "ts-app", dependencies: {} })
    );
    await fs.writeFile(path.join(tmpDir, "tsconfig.json"), "{}");
    const lang = await detectLanguage(tmpDir);
    expect(lang).toBe("typescript");
  });

  it("detects Node.js from package.json without TypeScript", async () => {
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "node-app", dependencies: { express: "^4.18.2" } })
    );
    const lang = await detectLanguage(tmpDir);
    expect(lang).toBe("nodejs");
  });

  it("detects FastAPI framework and entry point", async () => {
    await fs.writeFile(
      path.join(tmpDir, "requirements.txt"),
      "fastapi==0.100.0\nuvicorn\n"
    );
    await fs.writeFile(
      path.join(tmpDir, "main.py"),
      "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef root(): return {'hello': 'world'}\n"
    );

    const fw = await detectFramework(tmpDir);
    expect(fw).toBe("fastapi");

    const entry = await detectFastAPIEntry(tmpDir);
    expect(entry).toBe("main:app");

    const project = await detectProject(tmpDir);
    expect(project.language).toBe("python");
    expect(project.framework).toBe("fastapi");
    expect(project.entryPoint).toBe("main:app");
  });

  it("detects FastAPI in nested src/app.py entry point", async () => {
    await fs.mkdir(path.join(tmpDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, "pyproject.toml"),
      "[project]\ndependencies = [\"fastapi\"]\n"
    );
    await fs.writeFile(
      path.join(tmpDir, "src", "app.py"),
      "from fastapi import FastAPI\napp = FastAPI()\n"
    );

    const entry = await detectFastAPIEntry(tmpDir);
    expect(entry).toBe("src.app:app");
  });
});
