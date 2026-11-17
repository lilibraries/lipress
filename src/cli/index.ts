import { dev } from "./commands/dev.js";

/** Options of the CLI entry point. */
interface RunCliOptions {
  /** Directory of the packaged client sources. */
  clientDir: string;
}

/**
 * Runs the CLI against the documentation project in the working directory.
 *
 * @param options - Client directory.
 * @returns A promise that resolves once the requested command finishes.
 */
export async function runCli({ clientDir }: RunCliOptions): Promise<void> {
  await dev({ root: process.cwd(), clientDir });
}
