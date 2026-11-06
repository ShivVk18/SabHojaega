import type { SupportedLanguage } from "../types/index.js";

export interface TemplateManifest {
  id: string;
  name: string;
  language: SupportedLanguage;
  framework: string;
  version: string;
  description: string;
  requiredRuntime: string;
  minRuntimeVersion?: string;
  defaultPort: number;
  entryPoint: string;
  installCommand: string[];
  devCommand: string[];
  buildCommand?: string[] | null;
  healthEndpoint: string;
  requiredFiles: string[];
  supportedVariables: string[];
}

export interface RenderContext {
  projectName: string;
  projectSlug: string;
  framework: string;
  language: string;
  port: number;
  [key: string]: unknown;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: TemplateManifest;
}

export interface RenderResult {
  success: boolean;
  outputDirectory: string;
  filesRendered: string[];
  manifest: TemplateManifest;
}
