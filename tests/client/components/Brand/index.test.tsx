import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import Brand from "../../../../src/client/components/Brand";
import ThemeProvider from "../../../../src/client/providers/ThemeProvider";

describe("Brand", () => {
  it("renders without throwing", () => {
    render(
      <ThemeProvider>
        <Brand href="/" title="Logo URLs" logo={{ light: "/logo.svg", dark: "/logo-dark.svg" }} />
        <Brand href="/" title="Logo icons" logo={{ light: <svg />, dark: <svg /> }} />
        <Brand href="/" title="Single logo" logo="/logo.svg" />
        <Brand href="/" title="Element logo" logo={<svg />} />
      </ThemeProvider>,
    );

    expect(screen.getByRole("link", { name: "Logo URLs" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Logo icons" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Single logo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Element logo" })).toBeInTheDocument();
  });
});
