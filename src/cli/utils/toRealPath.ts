import { realpathSync } from "node:fs";

/**
 * Resolves the symlinks of an absolute path.
 *
 * Package managers often link packages into place and temporary directories
 * are symlinked on some platforms, so the dev server and the allow list it
 * checks served files against must agree on the resolved path.
 *
 * @param file - Absolute path to resolve.
 * @returns The resolved path, or the given path when it cannot be resolved.
 */
export default function toRealPath(file: string): string {
  try {
    return realpathSync(file);
  } catch {
    return file;
  }
}
