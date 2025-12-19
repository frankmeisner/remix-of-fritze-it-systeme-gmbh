import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't force-scroll inside the panel; it breaks restoring scroll position.
    if (pathname.startsWith('/panel') && pathname !== '/panel/login') return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};