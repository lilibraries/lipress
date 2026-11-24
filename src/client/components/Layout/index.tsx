import { useElementSize } from "@lilib/hooks";
import { type ReactNode, useRef } from "react";
import cn from "classnames";

import LayoutContext from "./context";

import "./index.scss";

interface LayoutProps {
  width?: "wide" | "full";
  header?: ReactNode;
  sidebar?: ReactNode;
  toc?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

function Layout(props: LayoutProps) {
  const { width, header, sidebar, toc, footer, children } = props;
  const headerRef = useRef<HTMLElement>(null);
  const hasHeader = !!header;
  const { height: measuredHeaderHeight } = useElementSize(headerRef);
  const headerHeight = hasHeader ? measuredHeaderHeight : 0;

  return (
    <LayoutContext.Provider value={{ hasHeader, headerHeight }}>
      <div
        className={cn(
          "lipress-layout",
          width === "wide" && "lipress-layout-wide",
          width === "full" && "lipress-layout-full",
          !hasHeader && "lipress-layout-headerless",
        )}
      >
        {hasHeader && (
          <header ref={headerRef} className="lipress-layout-header">
            <div className="lipress-layout-header-inner">{header}</div>
          </header>
        )}
        <div className="lipress-layout-grid">
          {!!sidebar && <nav className="lipress-layout-sidebar">{sidebar}</nav>}
          <main className="lipress-layout-main">
            <div className="lipress-layout-main-content">{children}</div>
            {!!toc && <nav className="lipress-layout-toc">{toc}</nav>}
          </main>
        </div>
        {!!footer && (
          <footer className="lipress-layout-footer">
            <div className="lipress-layout-footer-inner">{footer}</div>
          </footer>
        )}
      </div>
    </LayoutContext.Provider>
  );
}

export default Layout;
