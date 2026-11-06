import chalk from "chalk";
import { defaultRegistry } from "../../registry/framework-registry.js";

export function listFrameworks(): void {
  console.log(chalk.bold.cyan("\nSupported Languages and Frameworks:\n"));

  const languages = defaultRegistry.getSupportedLanguages();

  for (const lang of languages) {
    console.log(chalk.bold.white(`  ${lang.name} ${chalk.gray(`(${lang.id})`)}`));

    const frameworks = defaultRegistry.getMetadataByLanguage(lang.id);

    for (const fw of frameworks) {
      const hasAdapter = defaultRegistry.hasAdapter(fw.id, fw.language);
      const bullet = hasAdapter ? chalk.green("●") : chalk.yellow("○");
      const status = hasAdapter
        ? chalk.green("(ready)")
        : chalk.gray("(adapter pending)");

      console.log(
        `    ${bullet} ${chalk.white(fw.name)} ${chalk.gray(`(${fw.id})`)} ${status}`
      );
      console.log(`      ${chalk.gray(fw.description)}`);
    }

    console.log();
  }

  console.log(
    chalk.gray(
      `Legend: ${chalk.green("● ready")} = adapter implemented | ${chalk.yellow("○ pending")} = generator/runner in next milestone\n`
    )
  );
}
