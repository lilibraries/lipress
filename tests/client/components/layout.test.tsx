import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import Layout from "../../../src/client/components/Layout";

describe("Layout", () => {
  it("renders without throwing", () => {
    render(
      <Layout
        header={<span>Header</span>}
        sidebar={<span>Sidebar</span>}
        toc={<span>Table of contents</span>}
        footer={<span>Footer</span>}
      >
        <article>Content</article>
      </Layout>,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("Table of contents")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
