/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import assertReactPeers from "../../../src/cli/utils/assertReactPeers";

describe("assertReactPeers", () => {
  it("accepts a project that provides the react peers", () => {
    expect(() => {
      assertReactPeers(process.cwd());
    }).not.toThrow();
  });

  it("reports the missing peer with an actionable message", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "lipress-peers-"));
    try {
      expect(() => {
        assertReactPeers(root);
      }).toThrow(/must install react and react-dom/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
