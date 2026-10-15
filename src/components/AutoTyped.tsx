"use client";

import { useEffect, useRef, useState } from "react";
import { isLowPower } from "@/lib/perf";
import { useInView } from "@/lib/useInView";

const HOLD = 55;
const ERASE_STEP = 3;

export default function AutoTyped({ messages }: { messages: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref);
  const [t, setT] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setAnimate(!isLowPower()), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!animate || !visible) return;
    const id = setInterval(() => setT((v) => v + 1), 40);
    return () => clearInterval(id);
  }, [animate, visible]);

  let text = messages[0];
  let n = messages[0].length;
  if (animate) {
    const cycles = messages.map((m) => m.length + HOLD + Math.ceil(m.length / ERASE_STEP));
    const total = cycles.reduce((a, b) => a + b, 0);
    let m = t % total;
    let i = 0;
    while (m >= cycles[i]) {
      m -= cycles[i];
      i++;
    }
    text = messages[i];
    const len = text.length;
    n = m <= len ? m : m <= len + HOLD ? len : Math.max(0, len - (m - len - HOLD) * ERASE_STEP);
  }

  return (
    <span ref={ref}>
      <span className="sr-only">{messages[0]}</span>
      <span aria-hidden>{text.slice(0, n)}</span>
      <span className="caret" aria-hidden />
    </span>
  );
}
