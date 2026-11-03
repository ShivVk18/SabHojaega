
import { frameworks } from "../../registry/frameworks.js";
import chalk from "chalk";

export function listFrameworks() {
  console.log(chalk.bold("\nAvailable frameworks:\n"));

  for (const framework of frameworks) {
    console.log(
      `  ${chalk.green("●")} ${framework.name} ${chalk.gray(`(${framework.id})`)}`
    );
  }

  console.log();
}
