import { afterEach, describe, expect, it } from "@jest/globals";
import { cleanup, render, screen } from "@testing-library/react";

import ThemeProvider from "../../../src/client/providers/ThemeProvider";

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
  });

  it("renders its children", () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
