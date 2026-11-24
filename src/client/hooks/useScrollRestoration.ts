import { useEventListener, useLayoutMount, useLayoutUpdate } from "@lilib/hooks";
import { useRef } from "react";
import { NavigationType, useLocation, useNavigationType } from "react-router-dom";

function scrollToHash(hash: string): boolean {
  if (!hash) {
    return false;
  }

  const id = hash.slice(1);
  let decodedId = id;

  try {
    decodedId = decodeURIComponent(id);
  } catch {
    // A stray `%` is not a valid escape sequence; match the fragment as written.
  }

  const target = document.getElementById(decodedId);

  if (!target) {
    return false;
  }

  target.scrollIntoView();
  return true;
}

/**
 * Restores the scroll position across client-side navigations: scrolls to the hash target when
 * one exists, starts a push or replace navigation without one at the top, and leaves the first
 * render without a hash and back or forward navigations to the browser.
 */
function useScrollRestoration(): void {
  const { key, hash } = useLocation();
  const navigationType = useNavigationType();
  const windowRef = useRef<Window | null>(null);

  // `useEventListener` below attaches only after this layout effect fills the ref.
  useLayoutMount(() => {
    windowRef.current = window;

    return () => {
      windowRef.current = null;
    };
  });

  useLayoutMount(() => {
    scrollToHash(hash);
  });

  // A push or replace navigation starts at the top unless it targets a hash; back and forward
  // navigations keep the position the browser restores.
  useLayoutUpdate(() => {
    if (navigationType === NavigationType.Pop) {
      return;
    }

    if (!scrollToHash(hash)) {
      window.scrollTo(0, 0);
    }
  }, [key, hash, navigationType]);

  // Retry once the document finishes loading: images and fonts can shift the target away.
  useEventListener(
    windowRef,
    "load",
    () => {
      scrollToHash(hash);
    },
    { once: true },
  );
}

export default useScrollRestoration;
