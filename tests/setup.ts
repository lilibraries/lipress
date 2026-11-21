import "@testing-library/jest-dom/jest-globals";

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
