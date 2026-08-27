import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query.
 *
 * Layout decisions that change *structure* (bottom tabs vs a sidebar) cannot be
 * made in CSS alone, because the two chromes are different components.
 *
 * `useSyncExternalStore` rather than state + effect: the match is external
 * state React should read on every render, so there is no window where the
 * component shows one breakpoint while the browser is at another.
 */
export const useMediaQuery = (query: string): boolean => {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query);
            list.addEventListener('change', onChange);
            return () => list.removeEventListener('change', onChange);
        },
        [query],
    );

    const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

    // Server render and the pre-hydration pass have no viewport: assume small,
    // which is the layout that degrades most gracefully.
    const getServerSnapshot = useCallback(() => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/** The width at which a sidebar beats a bottom bar. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

export const useIsDesktop = (): boolean => useMediaQuery(DESKTOP_QUERY);
