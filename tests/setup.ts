import "@testing-library/jest-dom/jest-globals";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom does not expose the `TextEncoder` / `TextDecoder` globals that
// react-router reads at module scope. Node environments already provide them.
if (typeof globalThis.TextEncoder === "undefined") {
  Object.assign(globalThis, { TextEncoder, TextDecoder });
}

// jsdom implements no `matchMedia`, while the client hooks that read media
// queries depend on it. Node environments run this setup too.
if (typeof window !== "undefined") {
  window.matchMedia = (query) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
