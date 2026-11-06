# Template Authoring Guide — Sabhojaega

Sabhojaega uses a **Template-First Architecture**. Project generators do not contain hardcoded boilerplate, strings, or file arrays in TypeScript. All project files live in physical, reusable template directories.

---

## 1. Directory Structure

Templates are located in `templates/<language>/<framework>/`:

```
templates/
└── <language>/
    └── <framework>/
        ├── template.json      # Metadata manifest
        └── base/              # Physical boilerplate files
            ├── package.json   # (or go.mod, pom.xml, requirements.txt)
            ├── src/
            ├── .gitignore
            └── README.md
```

---

## 2. Manifest Specification (`template.json`)

Every template directory must contain a `template.json` file adhering to this contract:

```json
{
  "id": "express",
  "name": "Node.js Express",
  "language": "nodejs",
  "framework": "express",
  "version": "1.0.0",
  "description": "Fast, unopinionated, minimalist web framework for Node.js",
  "requiredRuntime": "node",
  "minRuntimeVersion": "18.0.0",
  "defaultPort": 3000,
  "entryPoint": "src/index.js",
  "installCommand": ["npm", "install"],
  "devCommand": ["npm", "run", "dev"],
  "buildCommand": null,
  "healthEndpoint": "/health",
  "requiredFiles": [
    "package.json",
    "src/index.js",
    ".gitignore",
    "README.md"
  ],
  "supportedVariables": [
    "projectName",
    "projectSlug",
    "framework",
    "language",
    "port"
  ]
}
```

### Fields:
- `id`: Unique framework identifier (e.g., `express`, `fastapi`, `gin`).
- `name`: Display name.
- `language`: `nodejs` | `typescript` | `python` | `java` | `go`.
- `framework`: Framework identifier.
- `version`: Template version semver.
- `defaultPort`: Default development server port.
- `entryPoint`: Primary server entry point file.
- `installCommand`: Argument array for installing dependencies.
- `devCommand`: Argument array for development execution.
- `buildCommand`: Optional build command array or null.
- `healthEndpoint`: HTTP health probe path (must respond with `{"status":"healthy"}`).
- `requiredFiles`: Array of relative paths inside `base/` required for template validation.
- `supportedVariables`: List of supported Handlebars placeholders.

---

## 3. Supported Placeholders

Text files inside `base/` are parsed with Handlebars and support these variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `{{projectName}}` | Display name of the project | `My API Service` |
| `{{projectSlug}}` | Hyphenated lower-case identifier | `my-api-service` |
| `{{framework}}` | Framework ID | `express` |
| `{{language}}` | Language ID | `nodejs` |
| `{{port}}` | Target port number | `3000` |

---

## 4. How to Add a New Template

To add a new framework (e.g., Rust Axum or PHP Laravel) **without modifying any core generator code**:

1. Create directory `templates/<language>/<framework>/`:
   ```bash
   mkdir -p templates/rust/axum/base/src
   ```

2. Create `template.json`:
   ```json
   {
     "id": "axum",
     "name": "Rust Axum",
     "language": "rust",
     "framework": "axum",
     "version": "1.0.0",
     "description": "Ergonomic and modular web framework built with Tokio and Tower",
     "requiredRuntime": "cargo",
     "defaultPort": 3000,
     "entryPoint": "src/main.rs",
     "installCommand": ["cargo", "check"],
     "devCommand": ["cargo", "run"],
     "healthEndpoint": "/health",
     "requiredFiles": ["Cargo.toml", "src/main.rs", ".gitignore", "README.md"],
     "supportedVariables": ["projectName", "projectSlug", "port"]
   }
   ```

3. Place physical files in `base/`:
   - `Cargo.toml`
   - `src/main.rs`
   - `.gitignore`
   - `README.md`

4. Run `npm test` — the automated test suite will automatically discover and validate the template!

