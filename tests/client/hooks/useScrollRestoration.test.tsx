import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";

import useScrollRestoration from "../../../src/client/hooks/useScrollRestoration";

let scrolled: Element[] = [];
let scrollTo: jest.SpiedFunction<(...args: unknown[]) => void>;

const originalScrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");

function addTarget(id: string): HTMLElement {
  const target = document.createElement("section");
  target.id = id;
  document.body.append(target);
  return target;
}

function renderPageScroll(initialEntries: string[] = ["/"], initialIndex = 0, strict = false) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {strict ? <StrictMode>{children}</StrictMode> : children}
    </MemoryRouter>
  );

  return renderHook(
    () => {
      useScrollRestoration();
      return useNavigate();
    },
    { wrapper },
  );
}

describe("useScrollRestoration", () => {
  beforeEach(() => {
    scrolled = [];
    document.body.innerHTML = "";
    scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {}) as typeof scrollTo;
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      writable: true,
      value: function (this: Element) {
        scrolled.push(this);
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalScrollIntoView) {
      Object.defineProperty(Element.prototype, "scrollIntoView", originalScrollIntoView);
    } else {
      delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    }
  });

  it("scrolls to the hash target on mount", () => {
    const target = addTarget("section");

    renderPageScroll(["/#section"]);

    expect(scrolled).toEqual([target]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves the scroll position alone when mounting without a hash", () => {
    renderPageScroll();

    expect(scrolled).toEqual([]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the top when navigating without a hash", () => {
    const { result } = renderPageScroll(["/first"]);

    expect(scrollTo).not.toHaveBeenCalled();

    act(() => {
      void result.current("/second");
    });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("scrolls to the hash of the next page", () => {
    const { result } = renderPageScroll(["/first"]);
    const target = addTarget("next");

    act(() => {
      void result.current("/second#next");
    });

    expect(scrolled).toEqual([target]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the hash when navigating to another hash on the same page", () => {
    const { result } = renderPageScroll(["/first"]);
    const target = addTarget("next");

    act(() => {
      void result.current("#next");
    });

    expect(scrolled).toEqual([target]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the top when the hash target does not exist", () => {
    const { result } = renderPageScroll(["/first"]);

    act(() => {
      void result.current("/second#missing");
    });

    expect(scrolled).toEqual([]);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("leaves the scroll position to the browser when navigating back", () => {
    const { result } = renderPageScroll(["/first", "/second"], 1);

    act(() => {
      void result.current(-1);
    });

    expect(scrolled).toEqual([]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("stops retrying the hash on load after unmount", () => {
    const target = addTarget("section");
    const { unmount } = renderPageScroll(["/#section"]);

    unmount();
    window.dispatchEvent(new Event("load"));

    expect(scrolled).toEqual([target]);
  });

  it("retries the hash when the document finishes loading", () => {
    renderPageScroll(["/#section"]);

    expect(scrolled).toEqual([]);

    const target = addTarget("section");

    window.dispatchEvent(new Event("load"));

    expect(scrolled).toEqual([target]);
  });

  // Effects do not replay under StrictMode with this test renderer, so this covers the double
  // render: it must neither scroll twice nor attach a second load listener.
  it("keeps a single scroll and a single load listener on a StrictMode mount", () => {
    const target = addTarget("section");
    const addEventListener = jest.spyOn(window, "addEventListener");

    renderPageScroll(["/#section"], 0, true);

    expect(scrolled).toEqual([target]);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(addEventListener.mock.calls.filter(([type]) => type === "load")).toHaveLength(1);
  });
});
