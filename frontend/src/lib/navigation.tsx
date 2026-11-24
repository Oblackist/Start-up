import { useSyncExternalStore } from 'react';
import type { AnchorHTMLAttributes } from 'react';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

const getLocation = () => window.location.pathname + window.location.search;

export function useLocation() {
  return new URL(useSyncExternalStore(subscribe, getLocation), window.location.origin);
}

function navigate(path: string | number, options?: { replace?: boolean }) {
  if (typeof path === 'number') {
    window.history.go(path);
    return;
  }
  if (path === getLocation()) return;
  const index = window.history.state?.careerArenaIndex ?? 0;
  if (options?.replace) window.history.replaceState({ careerArenaIndex: index }, '', path);
  else window.history.pushState({ careerArenaIndex: index + 1 }, '', path);
  notify();
}

export function useNavigate() {
  return navigate;
}

export function Link({
  to,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return (
    <a
      {...props}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey &&
          (!props.target || props.target === '_self')
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
    />
  );
}
