import { describe, it, expect } from "vitest";
import {
  checkCommandAvailable,
  resolvePythonRuntime,
  resolveNodeRuntime
} from "../src/core/runtime.js";

describe("Runtime Checker", () => {
  it("detects existing node runtime", async () => {
    const nodeResult = await resolveNodeRuntime();
    expect(nodeResult.available).toBe(true);
    expect(nodeResult.runtime).toBe("node");
    expect(nodeResult.version).toMatch(/v\d+/);
  });

  it("handles non-existent binary gracefully", async () => {
    const fakeResult = await checkCommandAvailable("nonexistent_binary_xyz_123");
    expect(fakeResult.available).toBe(false);
    expect(fakeResult.error).toBeDefined();
  });

  it("resolves python runtime if installed on system", async () => {
    const pyResult = await resolvePythonRuntime();
    if (pyResult) {
      expect(pyResult.executable).toBeDefined();
      expect(typeof pyResult.isVenv).toBe("boolean");
    }
  });
});
