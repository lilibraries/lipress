import { createRequire } from "node:module";
import path from "node:path";

/** Peer dependencies imported by the packaged client. */
const REACT_PEERS = ["react", "react-dom"] as const;

/**
 * Asserts that the documentation project provides the react peer dependencies.
 *
 * Resolving them from the project root mirrors how vite resolves the deduped
 * react imports, so a missing peer fails at startup with an actionable message
 * instead of surfacing as a failed import in the browser.
 *
 * @param root - Absolute path of the documentation project.
 * @throws When a peer dependency cannot be resolved from the project.
 */
export default function assertReactPeers(root: string): void {
  const projectRequire = createRequire(path.join(root, "package.json"));
  for (const peer of REACT_PEERS) {
    try {
      projectRequire.resolve(peer);
    } catch {
      throw new Error(
        `Cannot resolve "${peer}" from "${root}". ` +
          "The documentation project must install react and react-dom.",
      );
    }
  }
}
