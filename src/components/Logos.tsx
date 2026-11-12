import Image from "next/image";

export const LOGOS = [
  {
    src: "/logos/ieee-cis-uni.webp",
    width: 1400,
    height: 182,
    alt: "IEEE Student Branch UNI e IEEE Computational Intelligence Society",
    cls: "l-cis",
  },
  { src: "/logos/dsc-pucp.webp", width: 852, height: 410, alt: "Developer Student Club PUCP", cls: "l-pucp" },
  { src: "/logos/dsc-uni.webp", width: 848, height: 815, alt: "Developer Student Club UNI", cls: "l-dsc" },
];

export default function Logos({ size = "sm", align = "center" }: { size?: "sm" | "lg"; align?: "center" | "left" }) {
  return (
    <div className={`logos ${size} ${align}`}>
      {LOGOS.map((l) => (
        <Image key={l.src} src={l.src} width={l.width} height={l.height} alt={l.alt} className={l.cls} unoptimized />
      ))}
    </div>
  );
}
