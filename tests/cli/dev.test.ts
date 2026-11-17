/** @jest-environment node */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createServer, type ViteDevServer } from "vite";

import { dev } from "../../src/cli/commands/dev";

jest.mock("vite", () => ({ createServer: jest.fn() }));

const mockCreateServer = jest.mocked(createServer);

const CLIENT_DIR = "/tmp/lipress-package/dist/client";
const ROOT = process.cwd();

interface FakeServer {
  server: ViteDevServer;
  listen: jest.Mock<() => Promise<void>>;
  printUrls: jest.Mock<() => void>;
}

function fakeServer(): FakeServer {
  const listen = jest.fn<() => Promise<void>>(() => Promise.resolve());
  const printUrls = jest.fn<() => void>();
  return {
    server: { listen, printUrls } as unknown as ViteDevServer,
    listen,
    printUrls,
  };
}

describe("dev", () => {
  beforeEach(() => {
    mockCreateServer.mockReset();
  });

  it("creates a vite server with the shared configuration", async () => {
    mockCreateServer.mockResolvedValue(fakeServer().server);

    await dev({ root: ROOT, clientDir: CLIENT_DIR });

    expect(mockCreateServer).toHaveBeenCalledWith(expect.objectContaining({ root: ROOT }));
  });

  it("rejects when the project does not provide the react peers", async () => {
    await expect(
      dev({ root: "/tmp/lipress-project-without-react", clientDir: CLIENT_DIR }),
    ).rejects.toThrow(/must install react and react-dom/);
    expect(mockCreateServer).not.toHaveBeenCalled();
  });

  it("listens on the server and prints its urls", async () => {
    const fake = fakeServer();
    mockCreateServer.mockResolvedValue(fake.server);

    await dev({ root: ROOT, clientDir: CLIENT_DIR });

    expect(fake.listen).toHaveBeenCalledTimes(1);
    expect(fake.printUrls).toHaveBeenCalledTimes(1);
  });

  it("rejects when the server cannot be created", async () => {
    mockCreateServer.mockRejectedValue(new Error("boom"));

    await expect(dev({ root: ROOT, clientDir: CLIENT_DIR })).rejects.toThrow("boom");
  });

  it("rejects without printing urls when listening fails", async () => {
    const fake = fakeServer();
    fake.listen.mockRejectedValueOnce(new Error("port in use"));
    mockCreateServer.mockResolvedValue(fake.server);

    await expect(dev({ root: ROOT, clientDir: CLIENT_DIR })).rejects.toThrow("port in use");
    expect(fake.printUrls).not.toHaveBeenCalled();
  });
});
