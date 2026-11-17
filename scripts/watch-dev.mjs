import { spawn } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/watch-dev.mjs <command> [args...]");
  process.exit(1);
}

const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";
const watchDirs = [path.join(root, "src")];

let dev = null;
let build = null;
let rebuilding = false;
let rebuildQueued = false;
let changeTimer = null;
let shuttingDown = false;
const watchers = [];

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRunning(child) {
  return Boolean(child) && child.exitCode === null && child.signalCode === null;
}

/** Tells whether the child or any member of its process group is still running. */
function isTreeRunning(child) {
  if (isRunning(child)) {
    return true;
  }
  if (!child || isWindows || !child.pid) {
    return false;
  }
  try {
    // Signal 0 probes the process group without delivering anything.
    process.kill(-child.pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

/** Signals the child's process group on POSIX, falling back to the direct child when that fails. */
function signalTree(child, signal) {
  try {
    // A detached child leads its own process group, so a negative pid targets the whole tree.
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

function taskkillTree(child) {
  const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  killer.once("error", (error) => {
    console.error(`[watch-dev] Failed to kill process ${child.pid}: ${error.message}`);
  });
  killer.once("exit", (code) => {
    if (code !== 0) {
      console.error(`[watch-dev] taskkill exited with code ${code} for ${child.pid}`);
    }
  });
}

function killTree(child) {
  if (!isTreeRunning(child)) {
    return;
  }
  if (isWindows) {
    taskkillTree(child);
    return;
  }
  signalTree(child, "SIGTERM");
  // Force-kill if the process ignores the termination signal.
  setTimeout(() => forceKillTree(child), 5000).unref();
}

function forceKillTree(child) {
  if (!isTreeRunning(child)) {
    return;
  }
  if (isWindows) {
    taskkillTree(child);
  } else {
    signalTree(child, "SIGKILL");
  }
}

/** Tracks when a child process is gone, including spawn failures. */
function trackExit(child) {
  child.exited = new Promise((resolve) => {
    child.once("error", () => resolve());
    child.once("exit", () => resolve());
  });
  return child;
}

/** Runs a command, tracking its child in `build`, and rejects when it fails. */
function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = trackExit(
      spawn(cmd, cmdArgs, {
        // A build reports to the terminal but must not read from it.
        stdio: ["ignore", "inherit", "inherit"],
        // A `.cmd` shim cannot be spawned without a shell on Windows.
        shell: isWindows,
        // Lead a new process group so the whole tree can be signalled on POSIX.
        detached: !isWindows,
      }),
    );
    build = child;
    child.once("error", (error) => {
      build = null;
      reject(error);
    });
    child.once("exit", (code, signal) => {
      build = null;
      if (code === 0) {
        resolve();
        return;
      }
      const reason = signal ?? `exit code ${code}`;
      reject(new Error(`${cmd} ${cmdArgs.join(" ")} failed (${reason})`));
    });
  });
}

function startDev() {
  const child = trackExit(spawn(command, args, { stdio: "inherit" }));
  child.once("error", (error) => {
    console.error(`[watch-dev] Failed to start dev: ${error.message}`);
  });
  dev = child;
}

async function stopDev() {
  const child = dev;
  dev = null;
  if (!child) {
    return;
  }
  killTree(child);
  await child.exited;
}

async function rebuildAndRestart() {
  if (rebuilding) {
    rebuildQueued = true;
    return;
  }
  rebuilding = true;
  try {
    do {
      rebuildQueued = false;
      await stopDev();
      if (shuttingDown) {
        return;
      }
      try {
        await run(npm, ["run", "dist"]);
      } catch (error) {
        if (shuttingDown) {
          return;
        }
        // The distribution has already been cleared, so keep the dev process down and retry later.
        console.error(`[watch-dev] Failed to run dist: ${error.message}`);
        continue;
      }
      if (shuttingDown) {
        return;
      }
      // A queued change triggers another build, so keep the dev process down until it finishes.
      if (rebuildQueued) {
        continue;
      }
      console.log("[watch-dev] Restarting dev server...");
      startDev();
    } while (rebuildQueued);
  } finally {
    rebuilding = false;
  }
}

/** Debounces watcher events into a single rebuild. */
function scheduleRebuild() {
  if (shuttingDown) {
    return;
  }
  clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    changeTimer = null;
    if (shuttingDown) {
      return;
    }
    console.log("[watch-dev] Source changed, rebuilding dist...");
    rebuildAndRestart().catch((error) => {
      console.error(`[watch-dev] Rebuild failed: ${error.message}`);
    });
  }, 200);
}

/** Stops the watchers and the child processes before exiting. */
async function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  clearTimeout(changeTimer);
  for (const watcher of watchers) {
    watcher.close();
  }

  const child = dev;
  dev = null;
  const children = [build, child].filter(Boolean);
  for (const item of children) {
    killTree(item);
  }
  // Give the children a moment to exit gracefully before forcing them.
  await Promise.race([Promise.all(children.map((item) => item.exited)), delay(1000)]);
  for (const item of children) {
    forceKillTree(item);
  }
  process.exit(code);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
// Build children lead their own session, so they do not receive the terminal hangup.
process.on("SIGHUP", () => void shutdown());
if (isWindows) {
  // `Ctrl+Break` is delivered as `SIGBREAK` on Windows.
  process.on("SIGBREAK", () => void shutdown());
}

for (const dir of watchDirs) {
  try {
    const watcher = watch(dir, { recursive: true }, (_eventType, filename) => {
      if (filename && /(^|\/)\.DS_Store$|\.sw[po]$/.test(filename)) {
        return;
      }
      scheduleRebuild();
    });
    watcher.on("error", (error) => {
      console.error(`[watch-dev] Watch error on ${dir}: ${error.message}`);
      void shutdown(1);
    });
    watchers.push(watcher);
  } catch (error) {
    console.error(`[watch-dev] Failed to watch ${dir}: ${error.message}`);
    await shutdown(1);
  }
}

// Build before the first start so the dev process always runs fresh code.
console.log("[watch-dev] Building dist...");
await rebuildAndRestart();
