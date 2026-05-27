import { useEffect, useState } from "react";

// Mobile-first: default assumption is "small screen". Desktop is the enhancement.
export function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

// True on tablet/desktop widths. Base styling targets phones.
export const useIsWide = () => useMediaQuery("(min-width: 768px)");
