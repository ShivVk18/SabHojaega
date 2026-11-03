
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { generateProject } from "../../core/generator.js";
import { getProjectConfig } from "../../prompts/project-prompts.js";
import { setupFastAPI } from "../../core/setup.js";
interface CreateOptions {
  output?: string;
}

export async function createProject(
  templatesDirectory: string,
  framework?: string,
  projectName?: string,
  options: CreateOptions = {}
){
  try {
    let selectedFramework = framework;
    let selectedProjectName = projectName;

    if (!selectedFramework || !selectedProjectName) {
      const answers = await getProjectConfig();

      selectedFramework ??= answers.framework;
      selectedProjectName ??= answers.projectName;
    }

    const outputDirectory = path.resolve(
      options.output ?? selectedProjectName
    );

    const spinner = ora("Generating your project...").start();

    const generatedPath = await generateProject({
      framework: selectedFramework,
      projectName: selectedProjectName,
      outputDirectory,
      templatesDirectory: templatesDirectory ?? path.resolve("./templates")
    });

    spinner.succeed("Project generated successfully!");
if (selectedFramework === "fastapi") {
  await setupFastAPI(generatedPath);
}

    console.log();
  } catch (error) {
    console.error(
      chalk.red("\n✗ Project generation failed:")
    );

    console.error(
      error instanceof Error ? error.message : error
    );

    process.exitCode = 1;
  }
}
