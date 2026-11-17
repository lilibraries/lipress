#!/usr/bin/env node
import { fileURLToPath } from "node:url";

import { runCli } from "../dist/cli/index.js";

const clientDir = fileURLToPath(new URL("../dist/client", import.meta.url));

runCli({ clientDir }).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
