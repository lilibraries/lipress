/** @jest-environment node */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { dev } from "../../src/cli/commands/dev";
import { runCli } from "../../src/cli/index";

jest.mock("../../src/cli/commands/dev", () => ({ dev: jest.fn() }));

const mockDev = jest.mocked(dev);

describe("runCli", () => {
  beforeEach(() => {
    mockDev.mockReset();
    mockDev.mockResolvedValue(undefined);
  });

  it("starts the dev command with the client directory and the working directory", async () => {
    await runCli({ clientDir: "/tmp/lipress-client" });

    expect(mockDev).toHaveBeenCalledTimes(1);
    expect(mockDev).toHaveBeenCalledWith({
      clientDir: "/tmp/lipress-client",
      root: process.cwd(),
    });
  });

  it("propagates dev command failures", async () => {
    mockDev.mockRejectedValue(new Error("boom"));

    await expect(runCli({ clientDir: "/tmp/lipress-client" })).rejects.toThrow("boom");
  });
});
