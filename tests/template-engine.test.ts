import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { TemplateEngine } from "../src/core/template-engine.js";
import type { SupportedLanguage } from "../src/types/index.js";

describe("TemplateEngine & Template Architecture", () => {
  const templatesRoot = path.resolve(process.cwd(), "templates");
  const engine = new TemplateEngine(templatesRoot);
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sabhojaega-template-engine-"));
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  const allFrameworks: Array<{ language: SupportedLanguage; framework: string }> = [
    { language: "nodejs", framework: "express" },
    { language: "nodejs", framework: "fastify" },
    { language: "typescript", framework: "express" },
    { language: "typescript", framework: "fastify" },
    { language: "typescript", framework: "nestjs" },
    { language: "python", framework: "fastapi" },
    { language: "python", framework: "django" },
    { language: "python", framework: "flask" },
    { language: "java", framework: "spring-boot" },
    { language: "go", framework: "gin" },
    { language: "go", framework: "fiber" }
  ];

  it("validates all 11 framework templates have valid manifests and complete base directories", async () => {
    for (const { language, framework } of allFrameworks) {
      const templateDir = engine.resolveTemplateDir(language, framework);
      const validation = await engine.validateTemplate(templateDir);

      expect(
        validation.valid,
        `Template validation failed for ${language}/${framework}: ${validation.errors.join("; ")}`
      ).toBe(true);

      expect(validation.manifest).toBeDefined();
      expect(validation.manifest?.framework).toBe(framework);
      expect(validation.manifest?.requiredFiles.length).toBeGreaterThan(0);
      expect(validation.manifest?.healthEndpoint).toBe("/health");
    }
  });

  it("renders a Node.js Express template cleanly without unresolved placeholders", async () => {
    const targetDir = path.join(tmpDir, "my-express-app");

    const result = await engine.render("nodejs", "express", targetDir, {
      projectName: "My Awesome Express App",
      port: 3001
    });

    expect(result.success).toBe(true);
    expect(result.filesRendered.length).toBeGreaterThan(0);

    // Verify template.json was NOT copied into destination
    const files = await fs.readdir(targetDir);
    expect(files).not.toContain("template.json");
    expect(files).toContain("package.json");
    expect(files).toContain(".gitignore");

    // Verify package.json contains rendered projectSlug
    const pkgContent = await fs.readFile(path.join(targetDir, "package.json"), "utf-8");
    expect(pkgContent).toContain('"name": "my-awesome-express-app"');
    expect(pkgContent).not.toMatch(/\{\{[^}]+\}\}/); // No remaining placeholders

    // Verify index.js rendered projectName and port
    const indexContent = await fs.readFile(path.join(targetDir, "src", "index.js"), "utf-8");
    expect(indexContent).toContain("Welcome to My Awesome Express App!");
    expect(indexContent).toContain("3001");
    expect(indexContent).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it("renders TypeScript NestJS template with complete module structure", async () => {
    const targetDir = path.join(tmpDir, "my-nest-app");

    const result = await engine.render("typescript", "nestjs", targetDir, {
      projectName: "My Nest Backend"
    });

    expect(result.success).toBe(true);

    const files = await fs.readdir(targetDir);
    expect(files).toContain("package.json");
    expect(files).toContain("nest-cli.json");
    expect(files).toContain("tsconfig.json");

    const srcFiles = await fs.readdir(path.join(targetDir, "src"));
    expect(srcFiles).toContain("main.ts");
    expect(srcFiles).toContain("app.module.ts");
    expect(srcFiles).toContain("app.controller.ts");
    expect(srcFiles).toContain("app.service.ts");
  });

  it("renders Go Gin template with module and main.go", async () => {
    const targetDir = path.join(tmpDir, "my-gin-app");

    const result = await engine.render("go", "gin", targetDir, {
      projectName: "My Gin App"
    });

    expect(result.success).toBe(true);

    const mod = await fs.readFile(path.join(targetDir, "go.mod"), "utf-8");
    expect(mod).toContain("module my-gin-app");

    const mainGo = await fs.readFile(path.join(targetDir, "main.go"), "utf-8");
    expect(mainGo).toContain("Welcome to My Gin App!");
  });

  it("renders Java Spring Boot template with pom.xml and Application.java", async () => {
    const targetDir = path.join(tmpDir, "my-spring-app");

    const result = await engine.render("java", "spring-boot", targetDir, {
      projectName: "My Spring Service"
    });

    expect(result.success).toBe(true);

    const pom = await fs.readFile(path.join(targetDir, "pom.xml"), "utf-8");
    expect(pom).toContain("<artifactId>my-spring-service</artifactId>");

    const appJava = await fs.readFile(
      path.join(targetDir, "src", "main", "java", "com", "example", "demo", "Application.java"),
      "utf-8"
    );
    expect(appJava).toContain("Welcome to My Spring Service!");
    expect(appJava).toContain("@GetMapping(\"/health\")");
  });

  it("rejects non-empty target directory to prevent accidental overwrites", async () => {
    const targetDir = path.join(tmpDir, "existing-dir");
    await fs.mkdir(targetDir);
    await fs.writeFile(path.join(targetDir, "file.txt"), "content");

    await expect(
      engine.render("nodejs", "express", targetDir, { projectName: "Test" })
    ).rejects.toThrow(/Destination directory is not empty/);
  });

  it("fails gracefully if template manifest is corrupted or missing", async () => {
    const badEngine = new TemplateEngine(tmpDir);
    await expect(
      badEngine.render("nodejs", "unknown", path.join(tmpDir, "out"), { projectName: "Test" })
    ).rejects.toThrow(/Template validation failed/);
  });
});

