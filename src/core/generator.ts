
import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import { getFramework } from "../registry/frameworks.js";

interface GenerateOptions {
  framework: string;
  projectName: string;
  outputDirectory: string;
  templatesDirectory: string;
}

async function renderDirectory(
  source: string,
  destination: string,
  variables: Record<string, string>
) {
  await fs.mkdir(destination, { recursive: true });

  const entries = await fs.readdir(source, {
    withFileTypes: true
  });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);

    if (entry.isDirectory()) {
      await renderDirectory(
        sourcePath,
        path.join(destination, entry.name),
        variables
      );
      continue;
    }

    const isTemplate = entry.name.endsWith(".hbs");

    const outputName = isTemplate
      ? entry.name.slice(0, -4)
      : entry.name;

    const destinationPath = path.join(
      destination,
      outputName
    );

    const content = await fs.readFile(
      sourcePath,
      "utf-8"
    );

    const output = isTemplate
      ? Handlebars.compile(content)(variables)
      : content;

    await fs.writeFile(destinationPath, output);
  }
}

export async function generateProject(
  options: GenerateOptions
) {
  const framework = getFramework(options.framework);

  if (!framework) {
    throw new Error(
      `Framework "${options.framework}" is not supported.`
    );
  }

  const templatePath = path.join(
    options.templatesDirectory,
    framework.templatePath
  );

  try {
    await fs.access(templatePath);
  } catch {
    throw new Error(
      `Template directory not found: ${templatePath}`
    );
  }

  const outputPath = path.resolve(
    options.outputDirectory
  );

  try {
    const existingFiles = await fs.readdir(outputPath);

    if (existingFiles.length > 0) {
      throw new Error(
        `Destination directory is not empty: ${outputPath}`
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Destination")
    ) {
      throw error;
    }

    // Directory does not exist yet.
  }

  await renderDirectory(
    templatePath,
    outputPath,
    { projectName: options.projectName }
  );

  return outputPath;
}
