# Sabhojaega — Multi-Language Backend CLI

Sabhojaega is a production-quality, multi-language backend project generator and development server manager built with TypeScript.

## Supported Languages & Frameworks

| Language | Frameworks |
| :--- | :--- |
| **Node.js** | Express, Fastify |
| **TypeScript** | Express, Fastify, NestJS |
| **Python** | FastAPI, Django, Flask |
| **Java** | Spring Boot |
| **Go** | Gin, Fiber |

---

## Installation & Setup

```bash
npm install
npm run build
```

Link globally for development:
```bash
npm link
```

---

## CLI Usage

### List Supported Frameworks
```bash
sabhojaega list
```

### Create a Project (Interactive Mode)
```bash
sabhojaega create
```
Walks through a 5-step wizard:
1. Select language
2. Select framework
3. Enter project name
4. Select project directory
5. Confirm configuration

### Create a Project (Non-Interactive)
```bash
# Node.js Express
sabhojaega create --language node --framework express --name my-express-api

# TypeScript NestJS
sabhojaega create --language typescript --framework nestjs --name my-nest-api

# Python FastAPI
sabhojaega create --language python --framework fastapi --name my-fastapi-app

# Java Spring Boot
sabhojaega create --language java --framework spring-boot --name my-spring-service

# Go Gin
sabhojaega create --language go --framework gin --name my-gin-service
```

### Start Development Server
In your generated project directory:
```bash
sabhojaega start
```
Sabhojaega automatically detects the language and framework from manifests and config files, verifies runtime availability, validates dependencies, and launches the server with graceful signal handling (`SIGINT`, `SIGTERM`).

Explicit framework override:
```bash
sabhojaega start --framework fastapi
```

---

## Template Architecture

All project scaffolding is governed by physical, validated templates under `templates/<language>/<framework>/`:
- `template.json`: Manifest describing required files, entry points, commands, and ports.
- `base/`: Physical boilerplates with Handlebars placeholder substitution (`{{projectName}}`, `{{projectSlug}}`, `{{port}}`).

For instructions on adding new frameworks without modifying the core generator, see [docs/template-guide.md](docs/template-guide.md).

---

## Testing

Run the full Vitest suite:
```bash
npm test
```
