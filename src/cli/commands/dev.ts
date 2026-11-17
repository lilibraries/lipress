import { createServer } from "vite";

import { createViteConfig } from "../configs/vite-config.js";
import assertReactPeers from "../utils/assertReactPeers.js";

/** Options of the dev command. */
interface DevOptions {
  /** Absolute path of the documentation project, used as the vite root. */
  root: string;
  /** Absolute path of the packaged client sources. */
  clientDir: string;
}

/**
 * Serves the documentation project with vite.
 *
 * @param options - Project root and packaged client directory.
 * @returns A promise that resolves once the server is listening.
 */
export async function dev({ root, clientDir }: DevOptions): Promise<void> {
  assertReactPeers(root);
  const server = await createServer(createViteConfig({ root, clientDir }));
  await server.listen();
  server.printUrls();
}
