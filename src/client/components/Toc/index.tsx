import { usePersist, useScrollSpy, useTimeout } from "@lilib/hooks";
import cn from "classnames";
import {
  type MouseEvent,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import TocIcon from "../../icons/TocIcon";
import LayoutContext from "../Layout/context";

import "./index.scss";

export interface TocItem {
  depth: number;
  text: string;
  slug: string;
}

interface TocProps {
  title?: ReactNode;
  items: readonly TocItem[];
}

const HEADER_HEIGHT_TOKEN = "--lipress-layout-header-height";

function readHeaderHeightToken(): number {
  if (typeof document === "undefined") {
    return 0;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(HEADER_HEIGHT_TOKEN);
  return Number.parseFloat(value) || 0;
}

function Toc(props: TocProps) {
  const { title, items } = props;
  const { hasHeader, headerHeight } = useContext(LayoutContext);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<{ top: number; height: number }>();
  const [scrolling, setScrolling] = useState(false);
  const [startScrollEnd] = useTimeout(() => setScrolling(false), 120);
  // The layout measures the header only after the first render; until then the header keeps the
  // height its token reserves, which resolves the active item without the corrective animation
  // that reloading a scrolled page would otherwise show.
  const [tokenHeaderHeight] = useState(() => (hasHeader ? readHeaderHeightToken() : 0));
  const [active, { select }] = useScrollSpy(
    items.map((item) => item.slug),
    {
      offset: (headerHeight ?? tokenHeaderHeight) + 16,
    },
  );

  // The list is the positioned scroll container, so these offsets are content coordinates:
  // the browser scrolls the indicator together with its item instead of a render behind it.
  const measureIndicator = usePersist(() => {
    const element = active ? itemRefs.current.get(active) : undefined;

    if (!element) {
      setIndicator(undefined);
      return;
    }

    setIndicator({ top: element.offsetTop, height: element.offsetHeight });
  });

  const revealActiveItem = usePersist(() => {
    const list = listRef.current;
    const element = active ? itemRefs.current.get(active) : undefined;

    if (!list || !element) {
      return;
    }

    const listRect = list.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();

    if (itemRect.top < listRect.top) {
      list.scrollTop += itemRect.top - listRect.top;
    } else if (itemRect.bottom > listRect.bottom) {
      list.scrollTop += itemRect.bottom - listRect.bottom;
    } else {
      return;
    }

    setScrolling(true);
    startScrollEnd();
  });

  useLayoutEffect(() => {
    revealActiveItem();
    measureIndicator();
  }, [active, items, measureIndicator, revealActiveItem]);

  const handleItemClick = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    select(slug);
    setScrolling(true);
    startScrollEnd();
  };

  return (
    <div className="lipress-toc">
      {title != null && (
        <div className="lipress-toc-header">
          <TocIcon className="lipress-toc-header-icon" />
          <span>{title}</span>
        </div>
      )}
      <div className="lipress-toc-body">
        <ul ref={listRef} className="lipress-toc-list">
          {indicator !== undefined && (
            <li
              aria-hidden="true"
              className={cn(
                "lipress-toc-indicator",
                scrolling && "lipress-toc-indicator-scrolling",
              )}
              style={{ height: indicator.height, transform: `translateY(${indicator.top}px)` }}
            />
          )}
          {items.map((item) => (
            <li key={item.slug}>
              <a
                ref={(element) => {
                  if (element) {
                    itemRefs.current.set(item.slug, element);
                  } else {
                    itemRefs.current.delete(item.slug);
                  }
                }}
                href={`#${item.slug}`}
                aria-current={item.slug === active ? "location" : undefined}
                className={cn(
                  "lipress-toc-item",
                  item.depth > 2 && `lipress-toc-item-depth-${Math.min(item.depth, 6)}`,
                  item.slug === active && "lipress-toc-item-active",
                )}
                onClick={(event) => handleItemClick(event, item.slug)}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Toc;
