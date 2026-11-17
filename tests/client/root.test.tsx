import { afterEach, describe, expect, it } from "@jest/globals";
import { cleanup, render, screen } from "@testing-library/react";

import Root from "../../src/client/root";

describe("Root", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the greeting heading", () => {
    render(<Root />);

    expect(screen.getByRole("heading", { level: 1, name: "Hello World" })).toBeInTheDocument();
  });
});
