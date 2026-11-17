import type { InlineConfig } from "vite";

import clientPlugin from "../plugins/vite-plugin-client.js";

/** Options of the vite configuration shared by the CLI commands. */
interface ViteConfigOptions {
  /** Absolute path of the documentation project, used as the vite root. */
  root: string;
  /** Absolute path of the packaged client sources. */
  clientDir: string;
}

/**
 * Creates the vite configuration the CLI commands run on.
 *
 * The vite root is the documentation project instead of the packaged client,
 * so that bare imports made by the client (react above all) resolve from the
 * project's dependencies instead of the copy nested in the package.
 *
 * @param options - Project root and packaged client directory.
 * @returns The vite configuration.
 */
export function createViteConfig({ root, clientDir }: ViteConfigOptions): InlineConfig {
  return {
    root,
    plugins: [clientPlugin({ clientDir })],
    resolve: {
      // The client sources import react from inside the package, so the
      // importer's location would shadow the project's copy; deduping resolves
      // them from the root instead.
      dedupe: ["react", "react-dom"],
    },
    // The packaged client ships without a tsconfig, so its jsx runtime is
    // declared here instead of being inferred from project configuration.
    oxc: { jsx: { runtime: "automatic" } },
    optimizeDeps: {
      // The client sources are installed under node_modules, which vite's
      // dependency scanner does not crawl, so the imports they need must be
      // listed explicitly.
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
  };
}
