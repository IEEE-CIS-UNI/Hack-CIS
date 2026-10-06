"use client";

import { useEffect, useState, type RefObject } from "react";

export function useInView(ref: RefObject<Element | null>, rootMargin = "0px") {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return visible;
}
