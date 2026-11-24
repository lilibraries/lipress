import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import Toc from "../../../../src/client/components/Toc";

const ITEMS = [
  { depth: 2, text: "Getting started", slug: "getting-started" },
  { depth: 3, text: "Install", slug: "install" },
];

describe("Toc", () => {
  it("renders without throwing", () => {
    render(<Toc title="On this page" items={ITEMS} />);

    expect(screen.getByText("On this page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Getting started" })).toHaveAttribute(
      "href",
      "#getting-started",
    );
    expect(screen.getByRole("link", { name: "Install" })).toHaveAttribute("href", "#install");
  });
});
