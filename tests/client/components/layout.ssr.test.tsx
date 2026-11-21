/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "@jest/globals";

import Layout from "../../../src/client/components/Layout";

describe("Layout SSR", () => {
  it("renders on the server without throwing", () => {
    const html = renderToStaticMarkup(<Layout>Content</Layout>);

    expect(html).toContain("Content");
  });
});
