export type SilKind =
  | "man"
  | "woman"
  | "womanBun"
  | "manBeard"
  | "womanCurly"
  | "manSwept"
  | "trophy"
  | "gift"
  | "medal"
  | "building";

const BODY = '<path d="M10 200C10 170 28 154 56 148L68 140H92L104 148C132 154 150 170 150 200Z"/>';
const NECK = '<path d="M69 106H91C91 124 93 134 97 143H63C67 134 69 124 69 106Z"/>';
const FACE = '<path d="M80 34C99 34 109 49 109 69C109 91 97 106 80 106C63 106 51 91 51 69C51 49 61 34 80 34Z"/>';
const EARS = '<ellipse cx="50" cy="72" rx="4.5" ry="8"/><ellipse cx="110" cy="72" rx="4.5" ry="8"/>';
const VNECK = '<path d="M62 144L80 174L98 144Z" fill="rgba(0,0,0,.3)"/>';
const RIM = '<path d="M14 197C16 173 32 159 56 152L58 200H14Z" fill="rgba(255,255,255,.14)"/>';
const CAP = '<path d="M50 68C44 40 62 24 82 25C102 26 116 42 110 68C106 56 98 50 80 50C64 50 55 56 50 68Z"/>';

const person = (back: string, hair: string) => back + BODY + NECK + FACE + EARS + hair + VNECK + RIM;

function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<path d="M${pts.join("L")}Z" fill="rgba(0,0,0,.28)"/>`;
}

const SIL: Record<Exclude<SilKind, "building">, string> = {
  man: person("", CAP),
  manSwept: person(
    "",
    '<path d="M48 70C40 42 60 22 86 24C108 26 118 46 111 70C108 58 100 50 84 48C72 52 58 56 48 70Z"/><path d="M84 24C96 12 116 18 112 34C104 26 96 26 84 24Z"/>',
  ),
  manBeard: person(
    "",
    CAP + '<path d="M52 76C52 108 64 120 80 120C96 120 108 108 108 76C102 92 94 96 80 96C66 96 58 92 52 76Z"/>',
  ),
  woman: person(
    '<path d="M46 72C42 34 62 17 80 17C100 17 120 34 114 72C114 104 120 134 130 158C112 164 98 156 94 144H66C62 156 48 164 30 158C40 134 46 104 46 72Z"/>',
    '<path d="M52 62C54 42 68 32 82 33C98 34 108 46 108 62C98 52 90 46 80 46C68 46 58 52 52 62Z"/>',
  ),
  womanBun: person(
    '<circle cx="80" cy="20" r="15"/>',
    '<path d="M50 68C46 40 62 28 80 28C98 28 114 40 110 68C104 54 94 48 80 48C66 48 56 54 50 68Z"/>',
  ),
  womanCurly: person(
    '<circle cx="80" cy="60" r="46"/>',
    '<path d="M54 60C56 44 68 36 80 36C94 36 106 44 106 60C98 52 90 48 80 48C70 48 62 52 54 60Z"/>',
  ),
  trophy:
    '<path d="M42 22H118V64C118 96 100 114 80 114C60 114 42 96 42 64Z"/><path d="M42 34H22C22 66 32 80 48 82M118 34H138C138 66 128 80 112 82" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path d="M72 112H88V148H72Z"/><path d="M46 148H114L120 166H40Z"/><rect x="36" y="166" width="88" height="14" rx="4"/>' +
    star(80, 62, 24) +
    '<path d="M50 30H62V76C54 70 50 60 50 50Z" fill="rgba(255,255,255,.16)"/>',
  gift: '<rect x="26" y="90" width="108" height="94" rx="6"/><rect x="14" y="66" width="132" height="30" rx="6"/><rect x="71" y="66" width="18" height="118" fill="rgba(0,0,0,.28)"/><path d="M80 66C54 20 20 40 62 66M80 66C106 20 140 40 98 66" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><rect x="30" y="94" width="12" height="86" fill="rgba(255,255,255,.14)"/>',
  medal:
    '<path d="M42 10L80 84L118 10H98L80 46L62 10Z"/><path d="M62 10H98L90 26H70Z" fill="rgba(255,255,255,.16)"/><circle cx="80" cy="132" r="50"/><circle cx="80" cy="132" r="40" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="3"/>' +
    star(80, 132, 26),
};

const BUILD =
  '<rect x="6" y="64" width="34" height="56"/><rect x="44" y="26" width="44" height="94"/><rect x="92" y="8" width="38" height="112"/><rect x="134" y="48" width="30" height="72"/><rect x="168" y="76" width="26" height="44"/><rect x="108" y="0" width="6" height="10"/><g fill="rgba(0,0,0,.28)"><rect x="52" y="38" width="8" height="8"/><rect x="72" y="38" width="8" height="8"/><rect x="52" y="58" width="8" height="8"/><rect x="72" y="58" width="8" height="8"/><rect x="100" y="22" width="8" height="8"/><rect x="116" y="22" width="8" height="8"/><rect x="100" y="42" width="8" height="8"/><rect x="116" y="42" width="8" height="8"/></g>';

export default function Sil({ kind, className }: { kind: SilKind; className?: string }) {
  return (
    <svg
      viewBox={kind === "building" ? "0 0 200 120" : "0 0 160 200"}
      fill="currentColor"
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: kind === "building" ? BUILD : SIL[kind] }}
    />
  );
}
