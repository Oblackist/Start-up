// Cloudflare Turnstile integration (login CAPTCHA).
//
// Behavior contract (docs/CONTRACT.md §7):
//  - The widget is rendered ONLY when VITE_TURNSTILE_SITE_KEY is configured.
//  - The token is single-use: reset the widget after every failed login.
//  - The secret key lives ONLY on the backend (TURNSTILE_SECRET_KEY); it is
//    never referenced here. This module holds no secrets.
//  - Everything degrades gracefully: script-load failure surfaces an error
//    state the UI can show instead of silently submitting without a token.

export const TURNSTILE_SITE_KEY: string | undefined =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || undefined;

export const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Minimal typings for the Turnstile global (loaded lazily).
interface TurnstileApi {
  render: (
    el: HTMLElement,
    params: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback'?: (code: string) => void;
      'expired-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'flexible';
      retry?: 'auto' | 'never';
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoadPromise?: Promise<void>;
  }
}

/** Load the Turnstile script once; resolves when window.turnstile is ready. */
export function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoadPromise) return window.__turnstileLoadPromise;

  window.__turnstileLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const onBoth = () => {
      // The script calls onload when loaded; give the global a beat to attach.
      const started = Date.now();
      const wait = () => {
        if (window.turnstile) return resolve();
        if (Date.now() - started > 5000) {
          return reject(new Error('Turnstile yükləndi amma başlatılmadı'));
        }
        setTimeout(wait, 50);
      };
      wait();
    };
    if (existing) {
      existing.addEventListener('load', onBoth, { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile skripti yüklənmədi')), { once: true });
      if (window.turnstile) resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', onBoth, { once: true });
    s.addEventListener('error', () => reject(new Error('Turnstile skripti yüklənmədi')), { once: true });
    document.head.appendChild(s);
  });
  return window.__turnstileLoadPromise;
}

export interface RenderTurnstileOptions {
  container: HTMLElement;
  theme: 'light' | 'dark' | 'auto';
  onToken: (token: string) => void;
  onError?: (code: string) => void;
  onExpire?: () => void;
}

/** Render a widget into `container`; returns the widget id (empty string on failure). */
export async function renderTurnstile(opts: RenderTurnstileOptions): Promise<string> {
  if (!TURNSTILE_SITE_KEY) return '';
  await loadTurnstileScript();
  if (!window.turnstile) return '';
  return window.turnstile.render(opts.container, {
    sitekey: TURNSTILE_SITE_KEY,
    callback: opts.onToken,
    'error-callback': opts.onError,
    'expired-callback': opts.onExpire,
    theme: opts.theme,
    size: 'flexible',
    retry: 'auto',
  });
}

/** Reset a widget (token is single-use — call after every failed login). */
export function resetTurnstile(widgetId?: string): void {
  try {
    window.turnstile?.reset(widgetId || undefined);
  } catch {
    // resetting a removed/failed widget is a no-op
  }
}

/** Remove a widget (unmount cleanup). */
export function removeTurnstile(widgetId?: string): void {
  try {
    window.turnstile?.remove(widgetId || undefined);
  } catch {
    // ignore
  }
}
