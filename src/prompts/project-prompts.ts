
import { input, select } from "@inquirer/prompts";
import { frameworks } from "../registry/frameworks.js";

export async function getProjectConfig() {
  const framework = await select({
    message: "What do you want to create?",
    choices: frameworks.map((item) => ({
      name: item.name,
      value: item.id
    }))
  });

  const projectName = await input({
    message: "Enter your project name:",
    default: "my-awesome-project",
    validate: (value) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return "Use letters, numbers, hyphens and underscores.";
      }

      return true;
    }
  });

  return {
    framework,
    projectName
  };
}
