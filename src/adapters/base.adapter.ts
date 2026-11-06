import fs from "node:fs/promises";
import path from "node:path";
import type {
  FrameworkAdapter,
  FrameworkMeta,
  SupportedLanguage,
  DetectionResult,
  CreateContext,
  CreateResult,
  SetupContext,
  SetupResult,
  StartContext,
  StartResult
} from "../types/index.js";

export abstract class BaseFrameworkAdapter implements FrameworkAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly language: SupportedLanguage;
  abstract readonly meta: FrameworkMeta;

  abstract detect(projectDir: string): Promise<DetectionResult>;
  abstract create(context: CreateContext): Promise<CreateResult>;
  abstract setup(context: SetupContext): Promise<SetupResult>;
  abstract start(context: StartContext): Promise<StartResult>;

  /**
   * Helper to check if any of the given candidate files exist.
   */
  protected async findFirstExistingFile(
    dir: string,
    candidates: string[]
  ): Promise<string | null> {
    for (const candidate of candidates) {
      const fullPath = path.join(dir, candidate);
      try {
        await fs.access(fullPath);
        return candidate;
      } catch {
        // File does not exist
      }
    }
    return null;
  }

  /**
   * Helper to safely read file content as string.
   */
  protected async readFileSafe(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }
}
