import path from "node:path";
import { input, select, confirm } from "@inquirer/prompts";
import { defaultRegistry } from "../registry/framework-registry.js";
import type { SupportedLanguage } from "../types/index.js";

export interface ProjectConfigAnswers {
  language: SupportedLanguage;
  framework: string;
  projectName: string;
  projectDirectory: string;
  confirmed: boolean;
}

export interface PromptDefaults {
  language?: string | undefined;
  framework?: string | undefined;
  projectName?: string | undefined;
  output?: string | undefined;
}

export async function getProjectConfig(
  defaults?: PromptDefaults | undefined
): Promise<ProjectConfigAnswers> {
  const supportedLanguages = defaultRegistry.getSupportedLanguages();

  // 1. Select Language
  let language: SupportedLanguage;
  const resolvedLang = defaults?.language
    ? defaultRegistry.resolveLanguage(defaults.language)
    : null;

  if (resolvedLang) {
    language = resolvedLang;
  } else {
    language = (await select({
      message: "Select language:",
      choices: supportedLanguages.map((item) => ({
        name: item.name,
        value: item.id
      }))
    })) as SupportedLanguage;
  }

  // 2. Select Framework (filtered by language)
  const availableFrameworks = defaultRegistry.getMetadataByLanguage(language);
  let framework = defaults?.framework;

  if (!framework || !availableFrameworks.some((f) => f.id === framework)) {
    framework = await select({
      message: `Select framework for ${language}:`,
      choices: availableFrameworks.map((item) => ({
        name: `${item.name} - ${item.description}`,
        value: item.id
      }))
    });
  }

  // 3. Enter Project Name
  let projectName = defaults?.projectName;
  if (!projectName) {
    projectName = await input({
      message: "Enter project name:",
      default: "my-backend-app",
      validate: (value) => {
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return "Use letters, numbers, hyphens and underscores.";
        }
        return true;
      }
    });
  }

  // 4. Select Project Directory
  let projectDirectory = defaults?.output;
  if (!projectDirectory) {
    projectDirectory = await input({
      message: "Select project directory:",
      default: `./${projectName}`
    });
  }

  // 5. Confirm Project Configuration
  const targetMeta = defaultRegistry.getMeta(framework, language);
  const frameworkDisplayName = targetMeta?.name ?? framework;

  console.log(`\nConfiguration summary:`);
  console.log(`  Language:  ${language}`);
  console.log(`  Framework: ${frameworkDisplayName}`);
  console.log(`  Name:      ${projectName}`);
  console.log(`  Directory: ${path.resolve(projectDirectory)}\n`);

  const confirmed = await confirm({
    message: "Confirm project configuration and proceed?",
    default: true
  });

  return {
    language,
    framework,
    projectName,
    projectDirectory,
    confirmed
  };
}
