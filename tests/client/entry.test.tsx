import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockRender = jest.fn<(element: unknown) => void>();
const mockCreateRoot = jest.fn<
  (container: Element | DocumentFragment) => { render: typeof mockRender }
>(() => ({ render: mockRender }));

jest.mock("react-dom/client", () => ({ createRoot: mockCreateRoot }));

describe("entry", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateRoot.mockClear();
    mockRender.mockClear();
    document.body.innerHTML = "";
  });

  it("renders the root component into the root container", async () => {
    const container = document.createElement("div");
    container.id = "root";
    document.body.append(container);

    await import("../../src/client/entry");
    // The entry loads a fresh module after `resetModules`, so its root component is too.
    const { default: Root } = await import("../../src/client/root");

    expect(mockCreateRoot.mock.calls[0]?.[0]).toBe(container);
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockRender.mock.calls[0]?.[0]).toEqual(<Root />);
  });

  it("throws when the root container is missing", async () => {
    await expect(import("../../src/client/entry")).rejects.toThrow("Root container not found");
    expect(mockCreateRoot).not.toHaveBeenCalled();
  });
});
