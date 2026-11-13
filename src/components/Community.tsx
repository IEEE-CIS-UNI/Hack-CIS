import { LINKS } from "@/lib/config";

const CHANNELS = [
  {
    name: "WhatsApp",
    text: "Avisos oficiales, fechas y links de las sesiones. Solo lectura, sin ruido.",
    href: LINKS.whatsapp,
  },
  {
    name: "Discord",
    text: "Material gratuito del Bootcamp para todos. Los canales de hackers se abren con tu código al inscribirte.",
    href: LINKS.discord,
  },
];

export default function Community() {
  return (
    <section id="comunidad" className="pad" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <span className="label">Comunidad</span>
        <h2 className="h2">
          Entra antes
          <br />
          que <span className="lav">nadie</span>
        </h2>
        <div style={{ marginTop: 50 }}>
          {CHANNELS.map((c) => (
            <a key={c.name} className="chan" href={c.href} target="_blank" rel="noopener noreferrer">
              <div className="row">
                <h3>{c.name}</h3>
                <p>{c.text}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
