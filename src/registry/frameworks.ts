import { defaultRegistry } from "./framework-registry.js";

export interface Framework {
  id: string;
  name: string;
  language: string;
  category: "backend" | "frontend";
  templatePath: string;
}

export const frameworks: Framework[] = defaultRegistry.getAllMetadata().map((m) => ({
  id: m.id,
  name: m.name,
  language: m.language,
  category: m.category,
  templatePath: m.templatePath
}));

export function getFramework(id: string): Framework | undefined {
  const meta = defaultRegistry.getMeta(id);
  if (!meta) return undefined;
  return {
    id: meta.id,
    name: meta.name,
    language: meta.language,
    category: meta.category,
    templatePath: meta.templatePath
  };
}
