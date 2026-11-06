import fs from "node:fs/promises";
import path from "node:path";
import { defaultRegistry } from "../registry/framework-registry.js";
import type { SupportedLanguage, DetectionResult } from "../types/index.js";

/**
 * Detect the programming language of a project by analyzing configuration
 * files and directory contents.
 */
export async function detectLanguage(cwd: string): Promise<SupportedLanguage | null> {
  // 1. Check Go
  try {
    await fs.access(path.join(cwd, "go.mod"));
    return "go";
  } catch {
    // Continue
  }

  // 2. Check Java
  for (const javaFile of ["pom.xml", "build.gradle", "build.gradle.kts"]) {
    try {
      await fs.access(path.join(cwd, javaFile));
      return "java";
    } catch {
      // Continue
    }
  }

  // 3. Check Python
  for (const pyFile of ["requirements.txt", "pyproject.toml", "Pipfile", "setup.py", "environment.yml"]) {
    try {
      await fs.access(path.join(cwd, pyFile));
      return "python";
    } catch {
      // Continue
    }
  }

  // 4. Check Node.js / TypeScript
  try {
    const pkgPath = path.join(cwd, "package.json");
    const pkgContent = await fs.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(pkgContent);

    // If tsconfig.json exists or typescript is in dependencies/devDependencies, it's TypeScript
    try {
      await fs.access(path.join(cwd, "tsconfig.json"));
      return "typescript";
    } catch {
      // Continue
    }

    if (
      pkg.devDependencies?.typescript ||
      pkg.dependencies?.typescript ||
      pkg.devDependencies?.["@types/node"]
    ) {
      return "typescript";
    }

    return "nodejs";
  } catch {
    // Continue
  }

  // 5. Inspect directory files as fallback
  try {
    const files = await fs.readdir(cwd);
    if (files.some((f) => f.endsWith(".go"))) return "go";
    if (files.some((f) => f.endsWith(".java"))) return "java";
    if (files.some((f) => f.endsWith(".py"))) return "python";
    if (files.some((f) => f.endsWith(".ts"))) return "typescript";
    if (files.some((f) => f.endsWith(".js") || f.endsWith(".mjs"))) return "nodejs";
  } catch {
    // Directory unreadable
  }

  return null;
}

/**
 * Detect the framework used in the current directory.
 * Preserves backwards compatibility with the original detectFramework signature.
 */
export async function detectFramework(
  cwd: string,
  options?: { language?: SupportedLanguage | undefined } | undefined
): Promise<string | null> {
  // 1. Query registered framework adapters
  const adapters = options?.language
    ? defaultRegistry.getAdaptersByLanguage(options.language)
    : defaultRegistry.getAdapters();

  let highestConfidence = 0;
  let bestMatch: string | null = null;

  for (const adapter of adapters) {
    try {
      const result = await adapter.detect(cwd);
      if (result.detected && result.confidence > highestConfidence) {
        highestConfidence = result.confidence;
        bestMatch = result.framework;
      }
    } catch {
      // Ignore adapter detection error
    }
  }

  if (bestMatch && highestConfidence >= 0.5) {
    return bestMatch;
  }

  // 2. Fallback regex detection on Python files (exact original logic)
  const requirementsPath = path.join(cwd, "requirements.txt");
  const pyprojectPath = path.join(cwd, "pyproject.toml");

  let dependencies = "";

  for (const file of [requirementsPath, pyprojectPath]) {
    try {
      dependencies += await fs.readFile(file, "utf-8");
    } catch {
      // File doesn't exist.
    }
  }

  if (/fastapi/i.test(dependencies)) return "fastapi";
  if (/django/i.test(dependencies)) return "django";
  if (/flask/i.test(dependencies)) return "flask";

  // 3. Fallback check for package.json
  try {
    const pkgContent = await fs.readFile(path.join(cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgContent);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    if (allDeps["@nestjs/core"]) return "nestjs";
    if (allDeps["fastify"]) return "fastify";
    if (allDeps["express"]) return "express";
  } catch {
    // Ignore
  }

  // 4. Fallback check for Go
  try {
    const goMod = await fs.readFile(path.join(cwd, "go.mod"), "utf-8");
    if (/github\.com\/gin-gonic\/gin/i.test(goMod)) return "gin";
    if (/github\.com\/gofiber\/fiber/i.test(goMod)) return "fiber";
  } catch {
    // Ignore
  }

  // 5. Fallback check for Java
  try {
    const pom = await fs.readFile(path.join(cwd, "pom.xml"), "utf-8");
    if (/spring-boot/i.test(pom)) return "spring-boot";
  } catch {
    // Ignore
  }

  return null;
}

export interface ProjectDetectionInfo {
  language: SupportedLanguage | null;
  framework: string | null;
  entryPoint?: string | undefined;
  detection?: DetectionResult | undefined;
}

/**
 * Detect full project info including language, framework, and entry point.
 */
export async function detectProject(
  cwd: string,
  preferredFramework?: string | undefined,
  preferredLanguage?: SupportedLanguage | undefined
): Promise<ProjectDetectionInfo> {
  const language = preferredLanguage ?? (await detectLanguage(cwd));

  let framework = preferredFramework;
  if (!framework) {
    framework = (await detectFramework(cwd, language ? { language } : undefined)) ?? undefined;
  }

  if (framework) {
    const adapter = defaultRegistry.getAdapter(framework, language ?? undefined);
    if (adapter) {
      const detection = await adapter.detect(cwd);
      return {
        language: language ?? adapter.language,
        framework,
        entryPoint: detection.entryPoint,
        detection
      };
    }
  }

  return {
    language,
    framework: framework ?? null
  };
}

/**
 * Detect FastAPI application entry point.
 * Preserved for backwards compatibility with original detector.
 */
export async function detectFastAPIEntry(cwd: string): Promise<string | null> {
  const candidates = [
    "main.py",
    "app/main.py",
    "src/main.py",
    "app.py",
    "src/app.py"
  ];

  for (const candidate of candidates) {
    const filePath = path.join(cwd, candidate);

    try {
      const content = await fs.readFile(filePath, "utf-8");

      if (
        /from\s+fastapi\s+import/.test(content) &&
        /FastAPI\s*\(/.test(content)
      ) {
        const module = candidate
          .replace(/\.py$/, "")
          .split(path.sep)
          .join(".");

        return `${module}:app`;
      }
    } catch {
      // Try next candidate.
    }
  }

  return null;
}
