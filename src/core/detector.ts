
import fs from "fs/promises";
import path from "path";

export async function detectFramework(cwd: string) {
  const requirementsPath = path.join(cwd, "requirements.txt");
  const pyprojectPath = path.join(cwd, "pyproject.toml");

  let dependencies = "";

  for (const file of [requirementsPath, pyprojectPath]) {
    try {
      dependencies += await fs.readFile(file, "utf-8");
    } catch {
      // File doesn't exist.
    }
  }

  if (/fastapi/i.test(dependencies)) return "fastapi";
  if (/django/i.test(dependencies)) return "django";
  if (/flask/i.test(dependencies)) return "flask";

  return null;
}

export async function detectFastAPIEntry(cwd: string) {
  const candidates = [
    "main.py",
    "app/main.py",
    "src/main.py",
    "app.py",
    "src/app.py"
  ];

  for (const candidate of candidates) {
    const filePath = path.join(cwd, candidate);

    try {
      const content = await fs.readFile(filePath, "utf-8");

      if (
        /from\s+fastapi\s+import/.test(content) &&
        /FastAPI\s*\(/.test(content)
      ) {
        const module = candidate
          .replace(/\.py$/, "")
          .split(path.sep)
          .join(".");

        return `${module}:app`;
      }
    } catch {
      // Try next candidate.
    }
  }

  return null;
}
