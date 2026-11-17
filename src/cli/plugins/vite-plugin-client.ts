import path from "node:path";
import { pathToFileURL } from "node:url";

import { Eta } from "eta";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";

import toRealPath from "../utils/toRealPath.js";

/** Options of the client plugin. */
interface ClientPluginOptions {
  /** Absolute path of the packaged client sources. */
  clientDir: string;
}

/**
 * Renders the html shell that boots the packaged client.
 *
 * The shell is a template because the entry is referenced by an absolute url
 * that only the CLI knows; `eta` is used so the document can grow with
 * conditionals, loops, and partials without leaving html for strings.
 *
 * @param clientDir - Absolute path of the packaged client sources.
 * @param entryUrl - Url of the client entry module.
 * @returns The html document.
 */
function renderShell(clientDir: string, entryUrl: string): string {
  return new Eta({ views: clientDir }).render("shell.html", { entryUrl });
}

/**
 * Ensures the base url ends with the slash vite normalizes it to.
 *
 * @param base - Base url of the site.
 * @returns The base url ending with a slash.
 */
function withTrailingSlash(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Normalizes a path to the separators vite compares served files with.
 *
 * @param file - Absolute path to normalize.
 * @returns The path with forward slashes.
 */
function toServedPath(file: string): string {
  return file.replaceAll("\\", "/");
}

/**
 * Tells whether a request is a navigation that expects the html shell.
 *
 * Module urls, assets, and requests outside the base url keep reaching the
 * middlewares vite set up for them, while a navigation is answered with the
 * shell whatever its path is, since the client does the routing.
 *
 * @param req - Incoming request.
 * @param base - Base url of the site, ending with a slash.
 * @returns Whether the request asks for the html shell.
 */
function isNavigation({ method, url, headers }: IncomingMessage, base: string): boolean {
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  const pathname = (url ?? "/").replace(/[?#].*$/, "");
  if (!pathname.startsWith(base)) {
    return false;
  }

  // The part of the url vite resolves against the root.
  const filePath = pathname.slice(base.length - 1);
  // Vite owns the urls under the `@` namespace, and a file carries an extension
  // the shell does not have, `/index.html` being the document itself.
  const isDocument = filePath === "/index.html" || path.posix.extname(filePath) === "";
  if (filePath.startsWith("/@") || !isDocument) {
    return false;
  }

  const accept = headers.accept ?? "";
  return accept === "" || accept.includes("text/html") || accept.includes("*/*");
}

/**
 * Sends the shell html after letting vite inject its client and plugin tags.
 *
 * @param server - Dev server the plugin runs on.
 * @param req - Incoming request.
 * @param res - Response the shell is written to.
 * @param shellHtml - Html document of the shell.
 * @returns A promise that resolves once the response is written.
 */
async function sendShell(
  server: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
  shellHtml: string,
): Promise<void> {
  const html = await server.transformIndexHtml(req.url ?? "/", shellHtml);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(html));
  res.setHeader("Cache-Control", "no-cache");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(html);
}

/**
 * Serves the packaged client through the documentation project's dev server.
 *
 * The client sources live in the package, which is outside the vite root, so
 * the entry is referenced by absolute path and the shell html ships with the
 * package instead of coming from the project.
 *
 * @param options - Directory of the packaged client sources.
 * @returns The vite plugin.
 */
export default function clientPlugin({ clientDir }: ClientPluginOptions): Plugin {
  const entryUrl = `/@fs${pathToFileURL(toRealPath(path.join(clientDir, "entry.tsx"))).pathname}`;

  return {
    name: "lipress:client",

    configResolved(config) {
      // Vite allows the workspace root, the pnpm store, and its own client, and
      // the packaged client sits outside the project when lipress is installed
      // globally, so it is appended instead of replacing that list. Entries are
      // compared as served paths, which are resolved and slash-separated.
      const allow = config.server.fs.allow;
      const servedClientDir = toServedPath(toRealPath(clientDir));
      if (!allow.includes(servedClientDir)) {
        allow.push(servedClientDir);
      }
    },

    configureServer(server) {
      // The shell ships with the package and the entry url is fixed, so it is
      // rendered once per server rather than on every navigation.
      const shellHtml = renderShell(clientDir, entryUrl);
      const base = withTrailingSlash(server.config.base);

      server.middlewares.use((req, res, next) => {
        if (!isNavigation(req, base)) {
          next();
          return;
        }
        sendShell(server, req, res, shellHtml).catch(next);
      });
    },
  };
}
