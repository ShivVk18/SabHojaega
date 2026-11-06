import type {
  FrameworkAdapter,
  FrameworkMeta,
  LanguageInfo,
  SupportedLanguage
} from "../types/index.js";
import { FastAPIAdapter } from "../adapters/python/fastapi.adapter.js";
import { SUPPORTED_LANGUAGES, ALL_FRAMEWORK_METAS, FASTAPI_META } from "./meta.js";

export { SUPPORTED_LANGUAGES, ALL_FRAMEWORK_METAS, FASTAPI_META };

export class FrameworkRegistry {
  private adapters = new Map<string, FrameworkAdapter>();
  private metadata = new Map<string, FrameworkMeta>();

  constructor() {
    for (const meta of ALL_FRAMEWORK_METAS) {
      const key = this.buildKey(meta.id, meta.language);
      this.metadata.set(key, meta);
    }
  }

  private buildKey(id: string, language: SupportedLanguage): string {
    return `${language}:${id.toLowerCase()}`;
  }

  registerAdapter(adapter: FrameworkAdapter): void {
    const key = this.buildKey(adapter.id, adapter.language);
    this.adapters.set(key, adapter);
    this.metadata.set(key, adapter.meta);
  }

  getAdapter(
    id: string,
    language?: SupportedLanguage
  ): FrameworkAdapter | undefined {
    const normalizedId = id.toLowerCase();

    if (language) {
      return this.adapters.get(this.buildKey(normalizedId, language));
    }

    // If language is not specified, search for matching adapter
    for (const adapter of this.adapters.values()) {
      if (adapter.id.toLowerCase() === normalizedId) {
        return adapter;
      }
    }

    return undefined;
  }

  hasAdapter(id: string, language?: SupportedLanguage): boolean {
    return this.getAdapter(id, language) !== undefined;
  }

  getAdapters(): FrameworkAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAdaptersByLanguage(language: SupportedLanguage): FrameworkAdapter[] {
    return this.getAdapters().filter((a) => a.language === language);
  }

  getAllMetadata(): FrameworkMeta[] {
    return Array.from(this.metadata.values());
  }

  getMetadataByLanguage(language: SupportedLanguage): FrameworkMeta[] {
    return this.getAllMetadata().filter((m) => m.language === language);
  }

  getMeta(id: string, language?: SupportedLanguage): FrameworkMeta | undefined {
    const normalizedId = id.toLowerCase();
    if (language) {
      return this.metadata.get(this.buildKey(normalizedId, language));
    }

    for (const meta of this.metadata.values()) {
      if (meta.id.toLowerCase() === normalizedId) {
        return meta;
      }
    }
    return undefined;
  }

  getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
  }

  resolveLanguage(aliasOrId: string): SupportedLanguage | null {
    const lower = aliasOrId.toLowerCase().trim();
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.id === lower || lang.aliases.includes(lower)) {
        return lang.id;
      }
    }
    return null;
  }
}

// Create and export singleton registry initialized with FastAPI
export const defaultRegistry = new FrameworkRegistry();
defaultRegistry.registerAdapter(new FastAPIAdapter());
