/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";
import { realpathSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import os from "node:os";
import path from "node:path";
import type { Connect, ResolvedConfig, ViteDevServer } from "vite";

import clientPlugin from "../../../src/cli/plugins/vite-plugin-client";

const CLIENT_DIR = path.resolve(__dirname, "../../../src/client");
const ENTRY_URL = `/@fs${realpathSync(path.join(CLIENT_DIR, "entry.tsx"))}`;

interface FakeServer {
  transformIndexHtml: jest.Mock<(url: string, html: string) => Promise<string>>;
  handler: Connect.NextHandleFunction;
}

/** Registers the plugin on a stand-in dev server and returns its middleware. */
function startPlugin(clientDir = CLIENT_DIR, base = "/"): FakeServer {
  const transformIndexHtml = jest.fn<(url: string, html: string) => Promise<string>>((_url, html) =>
    Promise.resolve(`${html}<!-- transformed -->`),
  );
  const handlers: Connect.NextHandleFunction[] = [];
  const server = {
    config: { base },
    transformIndexHtml,
    middlewares: {
      use: (handler: Connect.NextHandleFunction) => {
        handlers.push(handler);
      },
    },
  } as unknown as ViteDevServer;

  const hook = clientPlugin({ clientDir }).configureServer;
  if (typeof hook !== "function") {
    throw new Error("The client plugin must configure the dev server synchronously");
  }
  void hook.call({} as ThisParameterType<typeof hook>, server);

  const handler = handlers[0];
  if (!handler) {
    throw new Error("The client plugin did not register a middleware");
  }
  return { transformIndexHtml, handler };
}

interface FakeResponse {
  res: ServerResponse;
  headers: Map<string, string>;
  end: jest.Mock<(body?: string) => void>;
}

function fakeResponse(): FakeResponse {
  const headers = new Map<string, string>();
  const end = jest.fn<(body?: string) => void>();
  const res = {
    statusCode: 0,
    setHeader: (name: string, value: string) => {
      headers.set(name, value);
    },
    end,
  } as unknown as ServerResponse;
  return { res, headers, end };
}

function fakeRequest(accept: string, method = "GET", url = "/"): IncomingMessage {
  return { method, url, headers: { accept } } as IncomingMessage;
}

/** Waits for the middleware's async response to be written. */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

/** Runs the plugin's configuration hook against a stand-in allow list. */
function configurePlugin(allow: string[]): string[] {
  const config = { server: { fs: { allow } } } as unknown as ResolvedConfig;
  const hook = clientPlugin({ clientDir: CLIENT_DIR }).configResolved;
  if (typeof hook !== "function") {
    throw new Error("The client plugin must resolve its configuration synchronously");
  }
  void hook.call({} as ThisParameterType<typeof hook>, config);
  return allow;
}

describe("clientPlugin", () => {
  it("appends the resolved client directory to the allow list", () => {
    expect(configurePlugin(["/site"])).toEqual(["/site", realpathSync(CLIENT_DIR)]);
  });

  it("does not append the client directory twice", () => {
    const resolvedClientDir = realpathSync(CLIENT_DIR);

    expect(configurePlugin([resolvedClientDir])).toEqual([resolvedClientDir]);
  });

  it("serves the shell for navigations after letting vite transform it", async () => {
    const fake = startPlugin();
    const next = jest.fn();
    const response = fakeResponse();

    fake.handler(fakeRequest("text/html"), response.res, next);
    await flush();

    expect(fake.transformIndexHtml).toHaveBeenCalledWith("/", expect.stringContaining(ENTRY_URL));
    expect(response.end).toHaveBeenCalledWith(expect.stringContaining("<!-- transformed -->"));
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(next).not.toHaveBeenCalled();
  });

  it("keeps the request url when transforming the shell", async () => {
    const fake = startPlugin();

    fake.handler(fakeRequest("text/html", "GET", "/guide?from=nav"), fakeResponse().res, jest.fn());
    await flush();

    expect(fake.transformIndexHtml).toHaveBeenCalledWith("/guide?from=nav", expect.any(String));
  });

  it("answers head requests with the headers of the shell and no body", async () => {
    const fake = startPlugin();
    const response = fakeResponse();

    fake.handler(fakeRequest("text/html", "HEAD"), response.res, jest.fn());
    await flush();

    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(response.end).toHaveBeenCalledWith();
  });

  it("serves the shell to clients that send no accept header", async () => {
    const fake = startPlugin();
    const response = fakeResponse();

    fake.handler(fakeRequest("", "GET", "/guide"), response.res, jest.fn());
    await flush();

    expect(response.end).toHaveBeenCalledWith(expect.stringContaining("<!-- transformed -->"));
  });

  it("serves the shell for the index document", async () => {
    const fake = startPlugin();
    const response = fakeResponse();

    fake.handler(fakeRequest("text/html", "GET", "/index.html"), response.res, jest.fn());
    await flush();

    expect(response.end).toHaveBeenCalledWith(expect.stringContaining("<!-- transformed -->"));
  });

  it("serves the shell under the base url", async () => {
    const fake = startPlugin(CLIENT_DIR, "/docs/");
    const response = fakeResponse();

    fake.handler(fakeRequest("text/html", "GET", "/docs/guide"), response.res, jest.fn());
    await flush();

    expect(response.end).toHaveBeenCalledWith(expect.stringContaining("<!-- transformed -->"));
  });

  it("passes requests outside the base url through", () => {
    const fake = startPlugin(CLIENT_DIR, "/docs/");
    const next = jest.fn();

    fake.handler(fakeRequest("text/html", "GET", "/guide"), fakeResponse().res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("passes module requests through", () => {
    const fake = startPlugin();
    const next = jest.fn();
    const response = fakeResponse();

    fake.handler(fakeRequest("*/*", "GET", "/@vite/client"), response.res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.end).not.toHaveBeenCalled();
  });

  it("passes asset requests through", () => {
    const fake = startPlugin();
    const next = jest.fn();

    fake.handler(fakeRequest("*/*", "GET", "/favicon.ico"), fakeResponse().res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("passes non-read requests through", () => {
    const fake = startPlugin();
    const next = jest.fn();

    fake.handler(fakeRequest("text/html", "POST"), fakeResponse().res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("resolves symlinked client directories so vite can serve them", async () => {
    const base = await mkdtemp(path.join(os.tmpdir(), "lipress-client-"));
    try {
      const realDir = path.join(base, "real");
      const linkDir = path.join(base, "link");
      await mkdir(realDir);
      await writeFile(path.join(realDir, "entry.tsx"), "");
      await copyFile(path.join(CLIENT_DIR, "shell.html"), path.join(realDir, "shell.html"));
      await symlink(realDir, linkDir, "dir");

      const fake = startPlugin(linkDir);
      const response = fakeResponse();
      fake.handler(fakeRequest("text/html"), response.res, jest.fn());
      await flush();

      const realEntry = await realpath(path.join(realDir, "entry.tsx"));
      expect(response.end).toHaveBeenCalledWith(expect.stringContaining(`src="/@fs${realEntry}"`));
    } finally {
      await rm(base, { recursive: true, force: true });
    }
  });

  it("forwards transform failures to next", async () => {
    const fake = startPlugin();
    const error = new Error("transform failed");
    fake.transformIndexHtml.mockRejectedValue(error);
    const next = jest.fn();

    fake.handler(fakeRequest("text/html"), fakeResponse().res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(error);
  });
});
