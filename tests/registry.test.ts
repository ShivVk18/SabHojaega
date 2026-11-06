import { describe, it, expect } from "vitest";
import { FrameworkRegistry, defaultRegistry } from "../src/registry/framework-registry.js";
import { frameworks, getFramework } from "../src/registry/frameworks.js";
import { FastAPIAdapter } from "../src/adapters/python/fastapi.adapter.js";

describe("FrameworkRegistry", () => {
  it("initializes with all supported languages", () => {
    const registry = new FrameworkRegistry();
    const languages = registry.getSupportedLanguages();
    const langIds = languages.map((l) => l.id);

    expect(langIds).toContain("nodejs");
    expect(langIds).toContain("typescript");
    expect(langIds).toContain("python");
    expect(langIds).toContain("java");
    expect(langIds).toContain("go");
  });

  it("resolves language aliases correctly", () => {
    const registry = new FrameworkRegistry();
    expect(registry.resolveLanguage("node")).toBe("nodejs");
    expect(registry.resolveLanguage("js")).toBe("nodejs");
    expect(registry.resolveLanguage("ts")).toBe("typescript");
    expect(registry.resolveLanguage("py")).toBe("python");
    expect(registry.resolveLanguage("golang")).toBe("go");
    expect(registry.resolveLanguage("unknown")).toBeNull();
  });

  it("registers and retrieves an adapter", () => {
    const registry = new FrameworkRegistry();
    const adapter = new FastAPIAdapter();
    registry.registerAdapter(adapter);

    expect(registry.hasAdapter("fastapi")).toBe(true);
    expect(registry.hasAdapter("fastapi", "python")).toBe(true);
    expect(registry.hasAdapter("express")).toBe(false);

    const retrieved = registry.getAdapter("fastapi");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("fastapi");
    expect(retrieved?.language).toBe("python");
  });

  it("retrieves adapters by language", () => {
    const registry = new FrameworkRegistry();
    registry.registerAdapter(new FastAPIAdapter());

    const pythonAdapters = registry.getAdaptersByLanguage("python");
    expect(pythonAdapters).toHaveLength(1);
    expect(pythonAdapters[0]?.id).toBe("fastapi");

    const nodeAdapters = registry.getAdaptersByLanguage("nodejs");
    expect(nodeAdapters).toHaveLength(0);
  });

  it("contains metadata for all required frameworks across languages", () => {
    const registry = new FrameworkRegistry();
    const allMeta = registry.getAllMetadata();

    const expected = [
      { lang: "nodejs", id: "express" },
      { lang: "nodejs", id: "fastify" },
      { lang: "typescript", id: "express" },
      { lang: "typescript", id: "fastify" },
      { lang: "typescript", id: "nestjs" },
      { lang: "python", id: "fastapi" },
      { lang: "python", id: "django" },
      { lang: "python", id: "flask" },
      { lang: "java", id: "spring-boot" },
      { lang: "go", id: "gin" },
      { lang: "go", id: "fiber" }
    ];

    for (const exp of expected) {
      const match = allMeta.find(
        (m) => m.id === exp.id && m.language === exp.lang
      );
      expect(match, `Missing metadata for ${exp.lang}:${exp.id}`).toBeDefined();
    }
  });

  it("provides backward compatible exports in registry/frameworks.ts", () => {
    expect(Array.isArray(frameworks)).toBe(true);
    expect(frameworks.length).toBeGreaterThan(0);

    const fastapi = getFramework("fastapi");
    expect(fastapi).toBeDefined();
    expect(fastapi?.name).toBe("FastAPI");
    expect(fastapi?.language).toBe("python");
  });

  it("defaultRegistry has FastAPI registered and ready", () => {
    expect(defaultRegistry.hasAdapter("fastapi")).toBe(true);
    const adapter = defaultRegistry.getAdapter("fastapi");
    expect(adapter).toBeInstanceOf(FastAPIAdapter);
  });
});
