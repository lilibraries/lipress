import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";

import Menu from "../../../src/client/components/Menu";

function StubLink({ to, ...rest }: { to: string } & ComponentPropsWithoutRef<"a">) {
  return <a href={to} {...rest} />;
}

describe("Menu", () => {
  it("renders without throwing", () => {
    render(
      <Menu>
        <Menu.Group title="Guide">
          <Menu.Item href="https://example.com" active>
            External
          </Menu.Item>
          <Menu.Item as={StubLink} to="/structure">
            Structure
          </Menu.Item>
        </Menu.Group>
        <Menu.Item href="#footer">Footer</Menu.Item>
      </Menu>,
    );

    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getByRole("link", { name: "Structure" })).toHaveAttribute("href", "/structure");
    expect(screen.getByRole("link", { name: "Footer" })).toBeInTheDocument();
  });
});
