import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import Segments from "../../../../src/client/components/Segments";

describe("Segments", () => {
  it("renders without throwing", () => {
    render(
      <Segments value="icon" onChange={() => {}}>
        <Segments.Item value="icon" icon={<span>Icon only</span>} label="Icon item" />
        <Segments.Item value="text">Text only</Segments.Item>
        <Segments.Item value="both" icon={<span>Combo icon</span>}>
          Combo text
        </Segments.Item>
      </Segments>,
    );

    expect(screen.getByRole("button", { name: "Icon item" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Combo icon Combo text" })).toBeInTheDocument();
  });
});
