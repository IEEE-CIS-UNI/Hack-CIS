import type { CSSProperties } from "react";
import { HeartHandshake, Landmark, Lock, RadioTower } from "lucide-react";
import Sil from "./silhouettes";

const TRACKS = [
  {
    icon: Landmark,
    title: <>Finanzas</>,
    sub: "IA & Finanzas",
    desc: "Personalización comercial inteligente, evaluación de riesgos o asistentes de educación financiera.",
    community: "CIS UP",
    tone: "#8b5cf6",
    tone2: "#4d17c2",
  },
  {
    icon: RadioTower,
    title: <>Telco</>,
    sub: "IA & Telco y Operaciones",
    desc: "Automatización de procesos, atención al cliente o predicción de fallas.",
    community: "UNI",
    tone: "#22c7ee",
    tone2: "#0b7a96",
  },
  {
    icon: HeartHandshake,
    title: (
      <>
        Impacto
        <br />
        Social
      </>
    ),
    sub: "IA & Impacto Social",
    desc: "Ciberseguridad, IoT para sostenibilidad o educación.",
    community: "DSC PUCP",
    tone: "#d946ef",
    tone2: "#8d1ba3",
  },
];

export default function Tracks() {
  return (
    <section id="tracks" className="pad">
      <div className="wrap">
        <span className="label">Tracks</span>
        <h2 className="h2">
          Elige tu <span className="lav">batalla</span>
        </h2>
        <p className="lead">
          Tres sponsors, tres retos reales. Los presentan en vivo en el kickoff y tú decides en cuál competir.
        </p>

        <div className="tk-list">
          {TRACKS.map((t) => {
            const Icon = t.icon;
            return (
              <article key={t.sub} className="tk" style={{ "--tone": t.tone, "--tone2": t.tone2 } as CSSProperties}>
                <div className="tk-ic">
                  <Icon aria-hidden strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="tk-title">{t.title}</h3>
                  <p className="tk-sub">{t.sub}</p>
                  <p className="tk-desc">{t.desc}</p>
                </div>
                <div className="tk-meta">
                  <span style={{ width: 84, color: t.tone, opacity: 0.55 }}>
                    <Sil kind="building" />
                  </span>
                  <span>
                    Comunidad: <em>{t.community}</em>
                  </span>
                  <span>
                    <Lock size={12} aria-hidden style={{ verticalAlign: -1, marginRight: 4 }} />
                    Sponsor por revelar
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
