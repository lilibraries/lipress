import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import Layout from "../../../../src/client/components/Layout";
import Toc from "../../../../src/client/components/Toc";

const ITEMS = [{ depth: 2, text: "Getting started", slug: "getting-started" }];

describe("Layout", () => {
  it("renders without a header", () => {
    render(
      <Layout toc={<Toc title="On this page" items={ITEMS} />}>
        <p>Content</p>
      </Layout>,
    );

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("On this page")).toBeInTheDocument();
  });
});
