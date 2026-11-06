import path from "node:path";
import { TemplateEngine } from "./template-engine.js";
import { ALL_FRAMEWORK_METAS } from "../registry/meta.js";
import type { SupportedLanguage } from "../types/index.js";

export interface GenerateOptions {
  framework: string;
  projectName: string;
  outputDirectory: string;
  templatesDirectory: string;
  language?: SupportedLanguage | undefined;
  variables?: Record<string, unknown> | undefined;
}

export async function generateProject(
  options: GenerateOptions
): Promise<string> {
  const engine = new TemplateEngine(options.templatesDirectory);

  // Resolve language if not provided
  let language = options.language;
  if (!language) {
    const meta = ALL_FRAMEWORK_METAS.find((m) => m.id === options.framework);
    if (!meta) {
      throw new Error(`Framework "${options.framework}" is not supported.`);
    }
    language = meta.language;
  }

  const result = await engine.render(
    language,
    options.framework,
    options.outputDirectory,
    {
      projectName: options.projectName,
      ...options.variables
    }
  );

  return result.outputDirectory;
}
