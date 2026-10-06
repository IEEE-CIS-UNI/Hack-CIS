import type { ReactNode } from "react";

export type PersonKind = "man" | "woman" | "womanBun" | "manBeard" | "womanCurly" | "manSwept";
export type PrizeKind = "trophy" | "gift" | "medal";

const SHOULDERS = "M6 200 C6 160 34 142 66 136 L94 136 C126 142 154 160 154 200 Z";

function Head({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <rect x="66" y="98" width="28" height="46" rx="10" />
      <ellipse cx="80" cy="68" rx="29" ry="35" />
      <path d={SHOULDERS} />
    </>
  );
}

function PersonShape({ kind }: { kind: PersonKind }) {
  switch (kind) {
    case "man":
      return (
        <Head>
          <ellipse cx="80" cy="50" rx="32" ry="24" />
          <ellipse cx="51" cy="74" rx="5" ry="9" />
          <ellipse cx="109" cy="74" rx="5" ry="9" />
        </Head>
      );
    case "woman":
      return (
        <Head>
          <path d="M40 72 C38 28 60 14 80 14 C100 14 122 28 120 72 C120 104 126 136 140 164 L20 164 C34 136 40 104 40 72 Z" />
        </Head>
      );
    case "womanBun":
      return (
        <Head>
          <circle cx="80" cy="22" r="16" />
          <ellipse cx="80" cy="48" rx="33" ry="26" />
        </Head>
      );
    case "manBeard":
      return (
        <Head>
          <ellipse cx="80" cy="50" rx="32" ry="24" />
          <path d="M50 68 C50 116 64 126 80 126 C96 126 110 116 110 68 Z" />
        </Head>
      );
    case "womanCurly":
      return (
        <Head>
          <circle cx="80" cy="62" r="48" />
        </Head>
      );
    case "manSwept":
      return (
        <Head>
          <ellipse cx="86" cy="49" rx="35" ry="24" />
          <circle cx="106" cy="38" r="15" />
          <ellipse cx="51" cy="74" rx="5" ry="9" />
        </Head>
      );
  }
}

export function PersonSilhouette({ kind, className }: { kind: PersonKind; className?: string }) {
  return (
    <svg viewBox="0 0 160 200" className={className} fill="currentColor" aria-hidden>
      <PersonShape kind={kind} />
    </svg>
  );
}

export function PrizeSilhouette({ kind, className }: { kind: PrizeKind; className?: string }) {
  return (
    <svg viewBox="0 0 160 200" className={className} fill="currentColor" aria-hidden>
      {kind === "trophy" && (
        <>
          <path d="M42 22 H118 V66 C118 98 100 116 80 116 C60 116 42 98 42 66 Z" />
          <path d="M42 34 H22 C22 66 32 80 48 82 M118 34 H138 C138 66 128 80 112 82" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
          <rect x="72" y="116" width="16" height="32" />
          <rect x="48" y="148" width="64" height="16" rx="5" />
          <rect x="38" y="164" width="84" height="12" rx="4" />
        </>
      )}
      {kind === "gift" && (
        <>
          <rect x="26" y="92" width="108" height="92" rx="6" />
          <rect x="16" y="68" width="128" height="30" rx="6" />
          <path d="M80 68 C52 22 20 44 62 68 M80 68 C108 22 140 44 98 68" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        </>
      )}
      {kind === "medal" && (
        <>
          <path d="M44 12 L80 82 L116 12 L98 12 L80 48 L62 12 Z" />
          <circle cx="80" cy="130" r="50" />
        </>
      )}
    </svg>
  );
}

export function BuildingSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} fill="currentColor" aria-hidden>
      <rect x="6" y="64" width="34" height="56" />
      <rect x="44" y="26" width="44" height="94" />
      <rect x="92" y="8" width="38" height="112" />
      <rect x="134" y="48" width="30" height="72" />
      <rect x="168" y="76" width="26" height="44" />
      <rect x="108" y="0" width="6" height="10" />
    </svg>
  );
}

export function RobotSilhouette({ className, eyes = false }: { className?: string; eyes?: boolean }) {
  return (
    <svg viewBox="0 0 160 200" className={className} fill="currentColor" aria-hidden>
      <rect x="77" y="6" width="6" height="24" />
      <circle cx="80" cy="8" r="8" />
      <circle cx="80" cy="78" r="48" />
      <circle cx="26" cy="82" r="12" />
      <circle cx="134" cy="82" r="12" />
      <rect x="52" y="124" width="56" height="30" rx="14" />
      <path d={SHOULDERS} transform="translate(0 6)" />
      {eyes && (
        <>
          <rect x="52" y="64" width="56" height="30" rx="15" fill="#05000d" />
          <rect x="62" y="74" width="12" height="12" rx="6" fill="#4de3ff" />
          <rect x="86" y="74" width="12" height="12" rx="6" fill="#4de3ff" />
        </>
      )}
    </svg>
  );
}
