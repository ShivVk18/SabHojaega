import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { defaultRegistry } from "../../registry/framework-registry.js";
import { getProjectConfig } from "../../prompts/project-prompts.js";
import type { SupportedLanguage } from "../../types/index.js";

export interface CreateCommandOptions {
  language?: string | undefined;
  framework?: string | undefined;
  name?: string | undefined;
  output?: string | undefined;
  skipInstall?: boolean | undefined;
}

export async function createProject(
  templatesDirectory: string,
  frameworkArg?: string,
  projectNameArg?: string,
  options: CreateCommandOptions = {}
): Promise<void> {
  try {
    let framework = options.framework ?? frameworkArg;
    let projectName = options.name ?? projectNameArg;
    let languageStr = options.language;
    let outputDir = options.output;

    const isNonInteractive = Boolean(framework && projectName);

    let language: SupportedLanguage | null = null;
    if (languageStr) {
      language = defaultRegistry.resolveLanguage(languageStr);
      if (!language) {
        throw new Error(
          `Unsupported language "${languageStr}". Supported languages: nodejs, typescript, python, java, go.`
        );
      }
    }

    // In interactive mode, prompt the user through the 5 steps
    if (!isNonInteractive) {
      const answers = await getProjectConfig({
        language: language ?? undefined,
        framework,
        projectName,
        output: outputDir
      });

      if (!answers.confirmed) {
        console.log(chalk.yellow("\nProject creation cancelled."));
        return;
      }

      language = answers.language;
      framework = answers.framework;
      projectName = answers.projectName;
      outputDir = answers.projectDirectory;
    }

    if (!framework || !projectName) {
      throw new Error("Framework and project name are required.");
    }

    // If language is still not resolved, try to infer it from the framework
    if (!language) {
      const meta = defaultRegistry.getMeta(framework);
      if (meta) {
        language = meta.language;
      }
    }

    // Lookup adapter
    const adapter = defaultRegistry.getAdapter(framework, language ?? undefined);

    if (!adapter) {
      const meta = defaultRegistry.getMeta(framework, language ?? undefined);
      if (meta) {
        throw new Error(
          `Framework "${meta.name}" is scheduled for milestone implementation.\nCurrently ready: FastAPI. Run 'sabhojaega list' to see all frameworks.`
        );
      }
      throw new Error(
        `Unknown framework "${framework}". Run 'sabhojaega list' to see available frameworks.`
      );
    }

    const resolvedLanguage = language ?? adapter.language;
    const finalOutputDir = path.resolve(outputDir ?? projectName);

    const spinner = ora(`Generating ${adapter.name} project...`).start();

    await adapter.create({
      projectName,
      projectDir: finalOutputDir,
      templatesDir: templatesDirectory,
      language: resolvedLanguage,
      framework: adapter.id,
      skipInstall: options.skipInstall
    });

    spinner.succeed(`Project scaffolded at ${finalOutputDir}`);

    // Setup dependencies (if not skipped)
    if (!options.skipInstall) {
      const setupSpinner = ora("Setting up project dependencies...").start();
      const setupResult = await adapter.setup({
        projectDir: finalOutputDir,
        skipInstall: false,
        stdio: "pipe"
      });

      if (setupResult.success) {
        setupSpinner.succeed(setupResult.message ?? "Dependencies setup complete.");
      } else {
        setupSpinner.warn(
          setupResult.message ?? "Dependency setup encountered an issue. You can set it up manually."
        );
      }
    }

    console.log(chalk.bold.green("\n✓ Project created successfully!\n"));
    console.log(chalk.white("Next steps:"));
    const relativeDir = path.relative(process.cwd(), finalOutputDir) || ".";
    if (relativeDir !== ".") {
      console.log(chalk.cyan(`  cd ${relativeDir}`));
    }
    console.log(chalk.cyan("  sabhojaega start\n"));
  } catch (error) {
    console.error(chalk.red("\n✗ Project generation failed:"));
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
