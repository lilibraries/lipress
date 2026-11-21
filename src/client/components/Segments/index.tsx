import { usePersist, useResizeObserver } from "@lilib/hooks";
import cn from "classnames";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./index.scss";

interface SegmentsContextValue {
  value: string;
  select: (value: string) => void;
  registerItem: (value: string, element: HTMLButtonElement | null) => void;
}

const SegmentsContext = createContext<SegmentsContextValue | null>(null);

interface SegmentsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  children?: ReactNode;
}

interface SegmentsItemProps<T extends string> {
  value: T;
  icon?: ReactNode;
  label?: string;
  children?: ReactNode;
}

interface SegmentsIndicatorState {
  left: number;
  width: number;
}

function Segments<T extends string>(props: SegmentsProps<T>) {
  const { value, onChange, children } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<SegmentsIndicatorState | null>(null);

  const select = usePersist((nextValue: string) => {
    onChange(nextValue as T);
  });

  const registerItem = useCallback((itemValue: string, element: HTMLButtonElement | null) => {
    if (element) {
      itemsRef.current.set(itemValue, element);
    } else {
      itemsRef.current.delete(itemValue);
    }
  }, []);

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const item = itemsRef.current.get(value);

    if (!container || !item) {
      setIndicator(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const next = { left: itemRect.left - containerRect.left, width: itemRect.width };

    setIndicator((previous) =>
      previous && previous.left === next.left && previous.width === next.width ? previous : next,
    );
  }, [value]);

  const context = useMemo(() => ({ value, select, registerItem }), [value, select, registerItem]);

  useLayoutEffect(updateIndicator, [updateIndicator]);
  useResizeObserver(containerRef, updateIndicator);

  return (
    <div ref={containerRef} className="lipress-segments">
      {!!indicator && (
        <span
          className="lipress-segments-indicator"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      )}
      <SegmentsContext.Provider value={context}>{children}</SegmentsContext.Provider>
    </div>
  );
}

function SegmentsItem<T extends string>(props: SegmentsItemProps<T>) {
  const { value, icon, label, children } = props;
  const context = useContext(SegmentsContext);

  if (!context) {
    throw new Error("Segments.Item must be rendered inside Segments.");
  }

  const active = context.value === value;
  const labeled = children != null;

  return (
    <button
      ref={(element) => context.registerItem(value, element)}
      type="button"
      className={cn(
        "lipress-segments-item",
        labeled && "lipress-segments-item-labeled",
        active && "lipress-segments-item-active",
      )}
      aria-label={labeled ? undefined : label}
      aria-pressed={active}
      onClick={() => context.select(value)}
    >
      {icon != null && <span className="lipress-segments-item-icon">{icon}</span>}
      {labeled && <span className="lipress-segments-item-label">{children}</span>}
    </button>
  );
}

Segments.Item = SegmentsItem;

export default Segments;
