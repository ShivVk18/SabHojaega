import { Command } from "commander";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

import { listFrameworks } from "./cli/commands/list.js";
import { createProject, type CreateCommandOptions } from "./cli/commands/create.js";
import { startProject } from "./cli/commands/start.js";
import { getProjectConfig } from "./prompts/project-prompts.js";

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

// Resolve templates in both development and production.
const templatesDirectory = path.resolve(
  currentDirectory,
  "../templates"
);

const program = new Command();

program
  .name("sabhojaega")
  .description("Multi-language backend project generator and development server launcher")
  .version("0.1.0");

// CREATE COMMAND
program
  .command("create")
  .description("Create a new backend project")
  .argument("[framework]", "Framework to use (e.g. fastapi, express, gin)")
  .argument("[project-name]", "Name of your project")
  .option("-l, --language <language>", "Language (nodejs, typescript, python, java, go)")
  .option("-f, --framework <framework>", "Framework to use")
  .option("-n, --name <name>", "Project name")
  .option("-o, --output <directory>", "Output directory")
  .option("--skip-install", "Skip automatic dependency installation")
  .action(async (frameworkArg, projectNameArg, options: CreateCommandOptions) => {
    await createProject(
      templatesDirectory,
      frameworkArg,
      projectNameArg,
      options
    );
  });

// LIST COMMAND
program
  .command("list")
  .description("List all supported languages and frameworks")
  .action(() => {
    listFrameworks();
  });

// START COMMAND
program
  .command("start")
  .description("Start the development server for the current project")
  .option("-p, --port <port>", "Server port")
  .option("--host <host>", "Server host (default: 127.0.0.1)")
  .option("-l, --language <language>", "Manually specify project language")
  .option("-f, --framework <framework>", "Manually specify framework")
  .option("--app <entryPoint>", "Specify application entry point (e.g. main:app)")
  .action(async (options) => {
    await startProject(options);
  });

// INTERACTIVE BANNER MODE
async function interactiveMode() {
  console.log(chalk.bold.cyan(`
  ███████╗ █████╗ ██████╗ ██╗  ██╗ ██████╗
  ██╔════╝██╔══██╗██╔══██╗██║  ██║██╔═══██╗
  ███████╗███████║██████╔╝███████║██║   ██║
  ╚════██║██╔══██║██╔══██╗██╔══██║██║   ██║
  ███████║██║  ██║██████╔╝██║  ██║╚██████╔╝
  ╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝
  `));

  console.log(
    chalk.gray("Multi-language backend project generator & runner\n")
  );

  const answers = await getProjectConfig();

  if (!answers.confirmed) {
    console.log(chalk.yellow("\nProject creation cancelled."));
    return;
  }

  await createProject(
    templatesDirectory,
    answers.framework,
    answers.projectName,
    {
      language: answers.language,
      output: answers.projectDirectory
    }
  );
}

// MAIN
async function main() {
  if (process.argv.length <= 2) {
    await interactiveMode();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(
    chalk.red("\n✗ Something went wrong:")
  );

  console.error(
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
