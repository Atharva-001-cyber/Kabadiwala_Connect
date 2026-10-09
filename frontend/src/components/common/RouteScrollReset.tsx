import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Top-view policy for PUSH/REPLACE/POP and query navigation, not data refresh. */
export function RouteScrollReset() {
  const { key, pathname, search } = useLocation();
  const { isLoading, isAuthenticated, role, user } = useAuth();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const reset = () => {
      // Only document and explicitly designated page containers, never arbitrary
      // overflow elements (sidebar, chat, tables, dialogs).
      const nodes = new Set<Element>([
        document.documentElement, document.body,
        ...document.querySelectorAll('#root, [data-page-scroll-root]'),
      ]);
      for (const node of nodes) {
        const element = node as HTMLElement;
        const previous = element.style.getPropertyValue('scroll-behavior');
        const priority = element.style.getPropertyPriority('scroll-behavior');
        element.style.setProperty('scroll-behavior', 'auto', 'important');
        element.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (previous) element.style.setProperty('scroll-behavior', previous, priority);
        else element.style.removeProperty('scroll-behavior');
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    reset();
    // Cover browser restoration/layout settling, without persistent timers or
    // observers that would interrupt ordinary reading/background refreshes.
    let next = 0;
    const frame = requestAnimationFrame(() => {
      reset();
      next = requestAnimationFrame(reset);
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(next); };
  }, [key, pathname, search, isLoading, isAuthenticated, role, user?.id]);
  return null;
}
