import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import type {
  TemplateManifest,
  RenderContext,
  TemplateValidationResult,
  RenderResult
} from "./template-types.js";
import type { SupportedLanguage } from "../types/index.js";

const KNOWN_TEXT_EXTENSIONS = new Set([
  ".json",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".py",
  ".java",
  ".go",
  ".mod",
  ".md",
  ".txt",
  ".properties",
  ".xml",
  ".yml",
  ".yaml",
  ".html",
  ".hbs",
  ".sh",
  ".env",
  ".gitignore"
]);

export function isTextFile(filename: string): boolean {
  if (filename.startsWith(".") && !filename.includes(".", 1)) {
    // e.g. .gitignore, .env
    return true;
  }
  const ext = path.extname(filename).toLowerCase();
  return KNOWN_TEXT_EXTENSIONS.has(ext);
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export class TemplateEngine {
  readonly templatesRoot: string;

  constructor(templatesRoot: string) {
    this.templatesRoot = path.resolve(templatesRoot);
  }

  /**
   * Resolves the physical path to a template directory for a given language & framework.
   * Handles "node" and "nodejs" aliases seamlessly.
   */
  resolveTemplateDir(language: string, framework: string): string {
    const normLang = language.toLowerCase() === "nodejs" ? "node" : language.toLowerCase();
    return path.join(this.templatesRoot, normLang, framework.toLowerCase());
  }

  /**
   * Loads and parses template.json from a template directory.
   */
  async loadManifest(templateDir: string): Promise<TemplateManifest> {
    const manifestPath = path.join(templateDir, "template.json");
    try {
      const content = await fs.readFile(manifestPath, "utf-8");
      return JSON.parse(content) as TemplateManifest;
    } catch (error) {
      throw new Error(
        `Failed to load template manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validates that template.json and all required files physically exist and match the contract.
   */
  async validateTemplate(templateDir: string): Promise<TemplateValidationResult> {
    const errors: string[] = [];

    let manifest: TemplateManifest | undefined;
    try {
      manifest = await this.loadManifest(templateDir);
    } catch (err) {
      return {
        valid: false,
        errors: [err instanceof Error ? err.message : String(err)]
      };
    }

    // Validate required manifest fields
    if (!manifest.id) errors.push("Manifest missing 'id'");
    if (!manifest.name) errors.push("Manifest missing 'name'");
    if (!manifest.language) errors.push("Manifest missing 'language'");
    if (!manifest.framework) errors.push("Manifest missing 'framework'");
    if (!manifest.version) errors.push("Manifest missing 'version'");
    if (typeof manifest.defaultPort !== "number") errors.push("Manifest missing or invalid 'defaultPort'");
    if (!manifest.entryPoint) errors.push("Manifest missing 'entryPoint'");
    if (!Array.isArray(manifest.requiredFiles)) errors.push("Manifest missing 'requiredFiles' array");

    // Validate base directory
    const baseDir = path.join(templateDir, "base");
    try {
      const stat = await fs.stat(baseDir);
      if (!stat.isDirectory()) {
        errors.push(`Template 'base' path is not a directory: ${baseDir}`);
      }
    } catch {
      errors.push(`Template missing 'base' directory: ${baseDir}`);
      return { valid: false, errors, manifest };
    }

    // Verify all required files exist inside base/
    if (manifest.requiredFiles) {
      for (const reqFile of manifest.requiredFiles) {
        const directPath = path.join(baseDir, reqFile);
        const hbsPath = `${directPath}.hbs`;
        let exists = false;

        try {
          await fs.access(directPath);
          exists = true;
        } catch {
          try {
            await fs.access(hbsPath);
            exists = true;
          } catch {
            exists = false;
          }
        }

        if (!exists) {
          errors.push(`Required file '${reqFile}' not found in template base: ${baseDir}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      manifest
    };
  }

  /**
   * Render and copy a template to the target output directory.
   */
  async render(
    language: SupportedLanguage,
    framework: string,
    outputDirectory: string,
    context: Partial<RenderContext> & { projectName: string }
  ): Promise<RenderResult> {
    const templateDir = this.resolveTemplateDir(language, framework);
    const validation = await this.validateTemplate(templateDir);

    if (!validation.valid || !validation.manifest) {
      throw new Error(
        `Template validation failed for ${language}/${framework}:\n  - ${validation.errors.join("\n  - ")}`
      );
    }

    const manifest = validation.manifest;
    const baseDir = path.join(templateDir, "base");
    const targetDir = path.resolve(outputDirectory);

    // Prevent directory traversal or invalid destination
    if (!targetDir || targetDir === "/" || targetDir === path.parse(targetDir).root) {
      throw new Error(`Invalid destination directory: ${targetDir}`);
    }

    // Ensure output directory is empty or does not exist
    try {
      const existing = await fs.readdir(targetDir);
      if (existing.length > 0) {
        throw new Error(`Destination directory is not empty: ${targetDir}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Destination directory")) {
        throw err;
      }
      // Directory doesn't exist yet, proceed
    }

    await fs.mkdir(targetDir, { recursive: true });

    const fullContext: RenderContext = {
      ...context,
      projectName: context.projectName,
      projectSlug: context.projectSlug ?? toSlug(context.projectName),
      framework: manifest.framework,
      language: manifest.language,
      port: context.port ?? manifest.defaultPort
    };

    const filesRendered: string[] = [];
    await this.copyAndRenderDirectory(baseDir, targetDir, targetDir, fullContext, filesRendered);

    return {
      success: true,
      outputDirectory: targetDir,
      filesRendered,
      manifest
    };
  }

  private async copyAndRenderDirectory(
    sourceDir: string,
    targetDir: string,
    rootTargetDir: string,
    context: RenderContext,
    filesRendered: string[]
  ): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);

      if (entry.isDirectory()) {
        const subTargetDir = path.join(targetDir, entry.name);
        this.assertSafePath(subTargetDir, rootTargetDir);
        await this.copyAndRenderDirectory(sourcePath, subTargetDir, rootTargetDir, context, filesRendered);
        continue;
      }

      // Compute destination filename (stripping .hbs if present)
      const isHbs = entry.name.endsWith(".hbs");
      const destFilename = isHbs ? entry.name.slice(0, -4) : entry.name;
      const destPath = path.join(targetDir, destFilename);
      this.assertSafePath(destPath, rootTargetDir);

      const fileStat = await fs.stat(sourcePath);

      if (isHbs || isTextFile(entry.name)) {
        const rawContent = await fs.readFile(sourcePath, "utf-8");
        const rendered = Handlebars.compile(rawContent, { noEscape: true })(context);
        await fs.writeFile(destPath, rendered, { mode: fileStat.mode });
      } else {
        // Binary file: copy directly without templating
        await fs.copyFile(sourcePath, destPath);
        await fs.chmod(destPath, fileStat.mode);
      }

      filesRendered.push(destPath);
    }
  }

  private assertSafePath(targetPath: string, rootTargetDir: string): void {
    const normalizedTarget = path.resolve(targetPath);
    const normalizedRoot = path.resolve(rootTargetDir);
    if (!normalizedTarget.startsWith(normalizedRoot)) {
      throw new Error(`Security violation: Path traversal detected outside root directory: ${targetPath}`);
    }
  }
}
