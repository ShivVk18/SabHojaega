import type { ChildProcess } from "node:child_process";

export type SupportedLanguage =
  | "nodejs"
  | "typescript"
  | "python"
  | "java"
  | "go";

export type FrameworkCategory = "backend" | "frontend";

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  aliases: string[];
  defaultExtension: string;
  configFiles: string[];
}

export interface FrameworkMeta {
  id: string;
  name: string;
  language: SupportedLanguage;
  category: FrameworkCategory;
  description: string;
  templatePath: string;
  defaultPort: number;
  entryCandidates: string[];
  configFiles: string[];
  runtimeName: string;
  minRuntimeVersion?: string | undefined;
  docsUrl?: string | undefined;
}

export interface DetectionResult {
  detected: boolean;
  confidence: number; // 0.0 to 1.0
  framework: string;
  language: SupportedLanguage;
  entryPoint?: string | undefined;
  runtime?: string | undefined;
  reason?: string | undefined;
  details?: Record<string, unknown> | undefined;
}

export interface CreateContext {
  projectName: string;
  projectDir: string;
  templatesDir: string;
  language: SupportedLanguage;
  framework: string;
  skipInstall?: boolean | undefined;
  options?: Record<string, unknown> | undefined;
}

export interface CreateResult {
  success: boolean;
  projectDir: string;
  entryPoint?: string | undefined;
  filesCreated: string[];
}

export interface SetupContext {
  projectDir: string;
  skipInstall?: boolean | undefined;
  stdio?: "inherit" | "pipe" | "ignore" | undefined;
}

export interface SetupResult {
  success: boolean;
  message?: string | undefined;
}

export interface StartContext {
  projectDir: string;
  port?: number | undefined;
  host?: string | undefined;
  entryPoint?: string | undefined;
  env?: NodeJS.ProcessEnv | undefined;
  stdio?: "inherit" | "pipe" | "ignore" | undefined;
  signal?: AbortSignal | undefined;
}

export interface StartResult {
  childProcess?: ChildProcess | undefined;
  url?: string | undefined;
  port: number;
  host: string;
  entryPoint?: string | undefined;
}

export interface RuntimeCheckResult {
  available: boolean;
  runtime: string;
  version?: string | undefined;
  executablePath?: string | undefined;
  error?: string | undefined;
}

/**
 * Common Framework Adapter interface implemented by all framework plugins.
 */
export interface FrameworkAdapter {
  readonly id: string;
  readonly name: string;
  readonly language: SupportedLanguage;
  readonly meta: FrameworkMeta;

  /**
   * Detect if the given directory contains an instance of this framework.
   */
  detect(projectDir: string): Promise<DetectionResult>;

  /**
   * Generate project scaffold files from templates.
   * Does NOT start the server or execute generated code.
   */
  create(context: CreateContext): Promise<CreateResult>;

  /**
   * Set up dependencies and environment (e.g., virtualenv, npm install).
   * Does NOT start the server.
   */
  setup(context: SetupContext): Promise<SetupResult>;

  /**
   * Start the development server.
   * Verifies runtime, dependencies, prints configuration, forwards signals.
   */
  start(context: StartContext): Promise<StartResult>;
}
