import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { BaseFrameworkAdapter } from "../base.adapter.js";
import { generateProject } from "../../core/generator.js";
import { resolvePythonRuntime, checkCommandAvailable } from "../../core/runtime.js";
import { safeSpawn, runCommand, forwardProcessSignals } from "../../utils/process.js";
import { FASTAPI_META } from "../../registry/meta.js";
import type {
  FrameworkMeta,
  SupportedLanguage,
  DetectionResult,
  CreateContext,
  CreateResult,
  SetupContext,
  SetupResult,
  StartContext,
  StartResult
} from "../../types/index.js";

export { FASTAPI_META };

export class FastAPIAdapter extends BaseFrameworkAdapter {
  readonly id = "fastapi";
  readonly name = "FastAPI";
  readonly language: SupportedLanguage = "python";
  readonly meta = FASTAPI_META;

  async detect(projectDir: string): Promise<DetectionResult> {
    let hasDependency = false;
    let reason = "";

    // 1. Check dependency files
    for (const configFile of this.meta.configFiles) {
      const content = await this.readFileSafe(path.join(projectDir, configFile));
      if (content && /fastapi/i.test(content)) {
        hasDependency = true;
        reason = `Found fastapi in ${configFile}`;
        break;
      }
    }

    // 2. Check entry point candidates
    const entryPoint = await this.resolveEntryPoint(projectDir);

    if (entryPoint && !hasDependency) {
      hasDependency = true;
      reason = `Found FastAPI application in ${entryPoint}`;
    }

    if (hasDependency) {
      const pythonInfo = await resolvePythonRuntime(projectDir);
      return {
        detected: true,
        confidence: entryPoint ? 0.95 : 0.8,
        framework: this.id,
        language: this.language,
        entryPoint: entryPoint ?? "main:app",
        runtime: pythonInfo?.executable,
        reason
      };
    }

    return {
      detected: false,
      confidence: 0,
      framework: this.id,
      language: this.language
    };
  }

  async resolveEntryPoint(projectDir: string): Promise<string | null> {
    for (const candidate of this.meta.entryCandidates) {
      const filePath = path.join(projectDir, candidate);
      const content = await this.readFileSafe(filePath);

      if (
        content &&
        /from\s+fastapi\s+import/.test(content) &&
        /FastAPI\s*\(/.test(content)
      ) {
        const moduleName = candidate
          .replace(/\.py$/, "")
          .split(path.sep)
          .join(".");
        return `${moduleName}:app`;
      }
    }

    // Fallback: check if main.py or app.py exists even without matching imports yet
    for (const candidate of ["main.py", "app.py"]) {
      const filePath = path.join(projectDir, candidate);
      const content = await this.readFileSafe(filePath);
      if (content !== null) {
        return `${candidate.replace(/\.py$/, "")}:app`;
      }
    }

    return null;
  }

  async create(context: CreateContext): Promise<CreateResult> {
    const generatedPath = await generateProject({
      framework: this.id,
      projectName: context.projectName,
      outputDirectory: context.projectDir,
      templatesDirectory: context.templatesDir
    });

    const filesCreated: string[] = [];
    try {
      const entries = await fs.readdir(generatedPath, { recursive: true });
      filesCreated.push(...entries.map(String));
    } catch {
      // Ignore if readdir recursive not supported
    }

    return {
      success: true,
      projectDir: generatedPath,
      entryPoint: "main:app",
      filesCreated
    };
  }

  async setup(context: SetupContext): Promise<SetupResult> {
    if (context.skipInstall) {
      return { success: true, message: "Dependency installation skipped." };
    }

    const isWindows = process.platform === "win32";
    const systemPython = await resolvePythonRuntime();

    if (!systemPython) {
      return {
        success: false,
        message: "Python runtime not found. Please install Python 3.10+."
      };
    }

    const venvDir = path.join(context.projectDir, ".venv");
    let venvExists = false;
    try {
      await fs.access(venvDir);
      venvExists = true;
    } catch {
      venvExists = false;
    }

    if (!venvExists) {
      const venvArgs = ["-m", "venv", ".venv"];
      const venvResult = await runCommand(systemPython.executable, venvArgs, {
        cwd: context.projectDir
      });

      if (venvResult.exitCode !== 0) {
        return {
          success: false,
          message: `Failed to create virtual environment: ${venvResult.stderr}`
        };
      }
    }

    const venvPython = isWindows
      ? path.join(context.projectDir, ".venv", "Scripts", "python.exe")
      : path.join(context.projectDir, ".venv", "bin", "python");

    const reqPath = path.join(context.projectDir, "requirements.txt");
    let hasReqs = false;
    try {
      await fs.access(reqPath);
      hasReqs = true;
    } catch {
      hasReqs = false;
    }

    if (hasReqs) {
      const pipResult = await runCommand(
        venvPython,
        ["-m", "pip", "install", "-r", "requirements.txt"],
        {
          cwd: context.projectDir,
          stdio: context.stdio ?? "pipe"
        }
      );

      if (pipResult.exitCode !== 0) {
        return {
          success: false,
          message: `Failed to install requirements: ${pipResult.stderr}`
        };
      }
    }

    return {
      success: true,
      message: "Virtual environment created and dependencies installed."
    };
  }

  async start(context: StartContext): Promise<StartResult> {
    const cwd = context.projectDir;
    const entryPoint = context.entryPoint ?? (await this.resolveEntryPoint(cwd)) ?? "main:app";

    const pythonInfo = await resolvePythonRuntime(cwd);
    if (!pythonInfo) {
      throw new Error(
        "Python runtime not found. Please install Python 3.10+ to run FastAPI applications."
      );
    }

    const python = pythonInfo.executable;

    // Verify uvicorn is installed
    const uvicornCheck = await checkCommandAvailable(python, ["-m", "uvicorn", "--version"]);
    if (!uvicornCheck.available) {
      throw new Error(
        `FastAPI dependencies not installed in ${python}.\nPlease run 'pip install -r requirements.txt' or recreate the project with dependencies.`
      );
    }

    const port = context.port ?? this.meta.defaultPort;
    const host = context.host ?? "127.0.0.1";

    console.log(chalk.green(`✓ Language: Python`));
    console.log(chalk.green(`✓ Framework: FastAPI`));
    console.log(chalk.green(`✓ Application: ${entryPoint}`));
    console.log(chalk.green(`✓ Python: ${python}`));
    console.log(chalk.green(`✓ Server: http://${host}:${port}`));

    console.log(chalk.cyan("\n🚀 Starting development server...\n"));

    const child = safeSpawn(
      python,
      [
        "-m",
        "uvicorn",
        entryPoint,
        "--reload",
        "--host",
        host,
        "--port",
        String(port)
      ],
      {
        cwd,
        stdio: context.stdio ?? "inherit",
        env: {
          ...process.env,
          ...context.env
        }
      }
    );

    forwardProcessSignals(child);

    child.on("error", (error) => {
      console.error(chalk.red(`Server error: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0 && code !== null) {
        console.error(chalk.red(`Server exited with code ${code}`));
        process.exitCode = code;
      }
    });

    return {
      childProcess: child,
      url: `http://${host}:${port}`,
      port,
      host,
      entryPoint
    };
  }
}
