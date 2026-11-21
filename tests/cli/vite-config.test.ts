/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import type { Plugin } from "vite";

import { createViteConfig } from "../../src/cli/configs/vite-config";

const ROOT = "/site";
const CLIENT_DIR = "/site/node_modules/@lilib/lipress/dist/client";

describe("createViteConfig", () => {
  it("roots vite at the documentation project", () => {
    expect(createViteConfig({ root: ROOT, clientDir: CLIENT_DIR }).root).toBe(ROOT);
  });

  it("dedupes react so the project copy shadows the packaged one", () => {
    const config = createViteConfig({ root: ROOT, clientDir: CLIENT_DIR });

    expect(config.resolve?.dedupe).toEqual(["react", "react-dom"]);
  });

  it("keeps the automatic jsx runtime the packaged client needs", () => {
    const config = createViteConfig({ root: ROOT, clientDir: CLIENT_DIR });

    expect(config.oxc).toEqual({ jsx: { runtime: "automatic" } });
  });

  it("registers the client plugin", () => {
    const config = createViteConfig({ root: ROOT, clientDir: CLIENT_DIR });
    const plugins = (config.plugins ?? []) as Plugin[];

    expect(plugins.map((plugin) => plugin.name)).toEqual(["lipress:client"]);
  });

  it("pre-bundles the imports of the injected entry", () => {
    const config = createViteConfig({ root: ROOT, clientDir: CLIENT_DIR });

    expect(config.optimizeDeps?.include).toEqual([
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "classnames",
    ]);
  });
});
