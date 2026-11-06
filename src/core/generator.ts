import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import { ALL_FRAMEWORK_METAS } from "../registry/meta.js";

export interface GenerateOptions {
  framework: string;
  projectName: string;
  outputDirectory: string;
  templatesDirectory: string;
  variables?: Record<string, unknown> | undefined;
}

async function renderDirectory(
  source: string,
  destination: string,
  variables: Record<string, unknown>,
  createdFiles: string[] = []
): Promise<string[]> {
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
        variables,
        createdFiles
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
    createdFiles.push(destinationPath);
  }

  return createdFiles;
}

export async function generateProject(
  options: GenerateOptions
): Promise<string> {
  const meta = ALL_FRAMEWORK_METAS.find((m) => m.id === options.framework);

  if (!meta) {
    throw new Error(
      `Framework "${options.framework}" is not supported.`
    );
  }

  const templatePath = path.join(
    options.templatesDirectory,
    meta.templatePath
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

  const templateVars = {
    projectName: options.projectName,
    ...options.variables
  };

  await renderDirectory(
    templatePath,
    outputPath,
    templateVars
  );

  return outputPath;
}
