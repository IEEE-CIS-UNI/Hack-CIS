type ExtendedNavigator = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function isLowPower(): boolean {
  if (typeof window === "undefined") return true;
  const nav = navigator as ExtendedNavigator;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    nav.connection?.saveData === true ||
    (nav.deviceMemory ?? 8) <= 4 ||
    (navigator.hardwareConcurrency ?? 8) <= 4
  );
}
