import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Root from "../../src/client/root";

describe("Root", () => {
  it("renders without throwing", () => {
    render(
      <MemoryRouter>
        <Root />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Hello World" })).toBeInTheDocument();
  });
});
