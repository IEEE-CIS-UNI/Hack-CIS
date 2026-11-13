type Tipo = "pitch" | "pausa" | "dinamica" | "normal";

const AGENDA: { hora: string; actividad: string; nota?: string; tipo: Tipo }[] = [
  { hora: "9:00 – 9:30", actividad: "Registro e ingreso", tipo: "normal" },
  { hora: "9:30 – 10:00", actividad: "Presentación de la Gran Final", nota: "Mini-retos", tipo: "normal" },
  { hora: "10:00 – 10:30", actividad: "Presentación de sponsors", tipo: "normal" },
  { hora: "10:30 – 11:15", actividad: "Pitch · 1.er track", tipo: "pitch" },
  { hora: "11:15 – 11:30", actividad: "Dinámica", nota: "Premios de los mini-retos", tipo: "dinamica" },
  { hora: "11:30 – 12:15", actividad: "Pitch · 2.º track", tipo: "pitch" },
  { hora: "12:15 – 12:30", actividad: "Dinámica", nota: "Premios de los mini-retos", tipo: "dinamica" },
  { hora: "12:30 – 1:15", actividad: "Pitch · 3.er track", tipo: "pitch" },
  { hora: "1:15 – 2:30", actividad: "Almuerzo", tipo: "pausa" },
  { hora: "2:30 – 3:15", actividad: "Feria de stands y networking", tipo: "pausa" },
  { hora: "3:15 – 3:30", actividad: "Dinámica", nota: "Premios de los mini-retos", tipo: "dinamica" },
  { hora: "3:30 – 4:30", actividad: "Deliberación y anuncio de ganadores", tipo: "normal" },
  { hora: "4:30 – 5:00", actividad: "Cierre", tipo: "normal" },
];

export default function GranFinal() {
  return (
    <section id="granfinal" className="pad">
      <div className="wrap gf">
        <div className="gf-head">
          <span className="label">Gran Final</span>
          <h2 className="h2">
            Un día,
            <br />
            tres <span className="lav">ganadores</span>
          </h2>
          <p className="lead">
            Sábado 5 de diciembre, todo el día, en el Auditorio CTIC de la UNI. Habrá feria de stands, los 15 equipos
            finalistas hacen pitch y demo, y hay mini-retos con premios.
          </p>

          <div className="gf-map">
            <iframe
              title="Mapa: CTIC UNI, Lima"
              src="https://www.google.com/maps?q=CTIC+UNI+Lima&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href="https://www.google.com/maps/search/?api=1&query=CTIC+UNI+Lima"
              target="_blank"
              rel="noopener noreferrer"
              className="gf-route"
            >
              Abrir en Google Maps ↗
            </a>
          </div>
        </div>

        <ol className="gf-list">
          {AGENDA.map((a) => (
            <li key={a.hora} className={`gf-row ${a.tipo}`}>
              <time>{a.hora}</time>
              <span className="gf-act">{a.actividad}</span>
              {a.nota && <span className="gf-nota">{a.nota}</span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
