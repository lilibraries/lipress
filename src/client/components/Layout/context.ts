import { createContext } from "react";

export interface LayoutContextValue {
  hasHeader: boolean;

  /**
   * The measured header height in pixels, `0` when the layout renders no header, and
   * `undefined` until a rendered header has been measured.
   */
  headerHeight?: number;
}

const LayoutContext = createContext<LayoutContextValue>({ hasHeader: false, headerHeight: 0 });

export default LayoutContext;
