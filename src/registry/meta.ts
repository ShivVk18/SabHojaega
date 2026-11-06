import type { FrameworkMeta, LanguageInfo } from "../types/index.js";

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    id: "nodejs",
    name: "Node.js",
    aliases: ["node", "javascript", "js"],
    defaultExtension: ".js",
    configFiles: ["package.json"]
  },
  {
    id: "typescript",
    name: "TypeScript",
    aliases: ["ts"],
    defaultExtension: ".ts",
    configFiles: ["tsconfig.json", "package.json"]
  },
  {
    id: "python",
    name: "Python",
    aliases: ["py"],
    defaultExtension: ".py",
    configFiles: ["requirements.txt", "pyproject.toml", "Pipfile", "setup.py"]
  },
  {
    id: "java",
    name: "Java",
    aliases: [],
    defaultExtension: ".java",
    configFiles: ["pom.xml", "build.gradle", "build.gradle.kts"]
  },
  {
    id: "go",
    name: "Go",
    aliases: ["golang"],
    defaultExtension: ".go",
    configFiles: ["go.mod"]
  }
];

export const FASTAPI_META: FrameworkMeta = {
  id: "fastapi",
  name: "FastAPI",
  language: "python",
  category: "backend",
  description: "Modern, fast high-performance Python web framework based on standard type hints.",
  templatePath: "python/fastapi",
  defaultPort: 8000,
  entryCandidates: [
    "main.py",
    "app/main.py",
    "src/main.py",
    "app.py",
    "src/app.py"
  ],
  configFiles: ["requirements.txt", "pyproject.toml", "Pipfile"],
  runtimeName: "Python",
  minRuntimeVersion: "3.10",
  docsUrl: "https://fastapi.tiangolo.com"
};

export const ALL_FRAMEWORK_METAS: FrameworkMeta[] = [
  // Node.js
  {
    id: "express",
    name: "Express",
    language: "nodejs",
    category: "backend",
    description: "Fast, unopinionated, minimalist web framework for Node.js.",
    templatePath: "node/express",
    defaultPort: 3000,
    entryCandidates: ["src/index.js", "index.js", "app.js", "server.js"],
    configFiles: ["package.json"],
    runtimeName: "Node.js",
    minRuntimeVersion: "18.0.0",
    docsUrl: "https://expressjs.com"
  },
  {
    id: "fastify",
    name: "Fastify",
    language: "nodejs",
    category: "backend",
    description: "Extremely fast and low overhead web framework for Node.js.",
    templatePath: "node/fastify",
    defaultPort: 3000,
    entryCandidates: ["src/index.js", "index.js", "app.js", "server.js"],
    configFiles: ["package.json"],
    runtimeName: "Node.js",
    minRuntimeVersion: "18.0.0",
    docsUrl: "https://fastify.dev"
  },
  // TypeScript
  {
    id: "express",
    name: "Express (TypeScript)",
    language: "typescript",
    category: "backend",
    description: "Express web framework configured with TypeScript and ts-node/tsx.",
    templatePath: "typescript/express",
    defaultPort: 3000,
    entryCandidates: ["src/index.ts", "index.ts", "src/app.ts", "src/server.ts"],
    configFiles: ["tsconfig.json", "package.json"],
    runtimeName: "Node.js",
    minRuntimeVersion: "18.0.0",
    docsUrl: "https://expressjs.com"
  },
  {
    id: "fastify",
    name: "Fastify (TypeScript)",
    language: "typescript",
    category: "backend",
    description: "Fastify web framework configured with TypeScript and type providers.",
    templatePath: "typescript/fastify",
    defaultPort: 3000,
    entryCandidates: ["src/index.ts", "index.ts", "src/app.ts", "src/server.ts"],
    configFiles: ["tsconfig.json", "package.json"],
    runtimeName: "Node.js",
    minRuntimeVersion: "18.0.0",
    docsUrl: "https://fastify.dev"
  },
  {
    id: "nestjs",
    name: "NestJS",
    language: "typescript",
    category: "backend",
    description: "Progressive TypeScript framework for building scalable server-side apps.",
    templatePath: "typescript/nestjs",
    defaultPort: 3000,
    entryCandidates: ["src/main.ts"],
    configFiles: ["nest-cli.json", "tsconfig.json", "package.json"],
    runtimeName: "Node.js",
    minRuntimeVersion: "18.0.0",
    docsUrl: "https://nestjs.com"
  },
  // Python
  FASTAPI_META,
  {
    id: "django",
    name: "Django",
    language: "python",
    category: "backend",
    description: "The web framework for perfectionists with deadlines.",
    templatePath: "python/django",
    defaultPort: 8000,
    entryCandidates: ["manage.py"],
    configFiles: ["manage.py", "requirements.txt", "pyproject.toml"],
    runtimeName: "Python",
    minRuntimeVersion: "3.10",
    docsUrl: "https://www.djangoproject.com"
  },
  {
    id: "flask",
    name: "Flask",
    language: "python",
    category: "backend",
    description: "A lightweight WSGI web application framework in Python.",
    templatePath: "python/flask",
    defaultPort: 5000,
    entryCandidates: ["app.py", "wsgi.py", "src/app.py"],
    configFiles: ["requirements.txt", "pyproject.toml"],
    runtimeName: "Python",
    minRuntimeVersion: "3.10",
    docsUrl: "https://flask.palletsprojects.com"
  },
  // Java
  {
    id: "spring-boot",
    name: "Spring Boot",
    language: "java",
    category: "backend",
    description: "Spring Boot makes it easy to create stand-alone, production-grade Spring based Applications.",
    templatePath: "java/spring-boot",
    defaultPort: 8080,
    entryCandidates: ["src/main/java/**/*.java"],
    configFiles: ["pom.xml", "build.gradle"],
    runtimeName: "Java",
    minRuntimeVersion: "17",
    docsUrl: "https://spring.io/projects/spring-boot"
  },
  // Go
  {
    id: "gin",
    name: "Gin",
    language: "go",
    category: "backend",
    description: "High-performance HTTP web framework written in Go.",
    templatePath: "go/gin",
    defaultPort: 8080,
    entryCandidates: ["main.go", "cmd/server/main.go"],
    configFiles: ["go.mod"],
    runtimeName: "Go",
    minRuntimeVersion: "1.20",
    docsUrl: "https://gin-gonic.com"
  },
  {
    id: "fiber",
    name: "Fiber",
    language: "go",
    category: "backend",
    description: "Express inspired web framework written in Go built on Fasthttp.",
    templatePath: "go/fiber",
    defaultPort: 3000,
    entryCandidates: ["main.go", "cmd/server/main.go"],
    configFiles: ["go.mod"],
    runtimeName: "Go",
    minRuntimeVersion: "1.20",
    docsUrl: "https://gofiber.io"
  }
];
