
import { Command } from "commander";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

import { listFrameworks } from "./cli/commands/list.js";
import { createProject } from "./cli/commands/create.js";
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
  .description("Your boilerplate. Your stack. One command.")
  .version("0.1.0");

// CREATE COMMAND
program
  .command("create")
  .description("Create a new project")
  .argument("[framework]", "Framework to use")
  .argument("[project-name]", "Name of your project")
  .option("-o, --output <directory>", "Output directory")
  .action(async (framework, projectName, options) => {
    await createProject(
      templatesDirectory,
      framework,
      projectName,
      options
    );
  });

// LIST COMMAND
program
  .command("list")
  .description("List all available frameworks")
  .action(() => {
    listFrameworks();
  });

// START COMMAND
program
  .command("start")
  .description("Start the current development project")
  .option("-p, --port <port>", "Server port", "8000")
  .option("--host <host>", "Server host", "127.0.0.1")
  .option("--framework <framework>", "Manually specify framework")
  .option("--app <module:app>", "Specify ASGI application entry point")
  .action(async (options) => {
    await startProject(options);
  });

// INTERACTIVE MODE
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
    chalk.gray("Your boilerplate. Your stack. One command.\n")
  );

  const answers = await getProjectConfig();

  await createProject(
    templatesDirectory,
    answers.framework,
    answers.projectName
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
