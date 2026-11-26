type Tipo = "pitch" | "pausa" | "dinamica" | "normal";

const AGENDA: { hora: string; actividad: string; nota?: string; tipo: Tipo }[] = [
  { hora: "8:00 – 9:00", actividad: "Llegada de finalistas y jurados", nota: "Prueba técnica y armado de stands", tipo: "normal" },
  { hora: "9:00 – 9:30", actividad: "Registro e ingreso", nota: "Feria abierta · pasaporte de stands", tipo: "normal" },
  { hora: "9:30 – 9:50", actividad: "Inauguración", nota: "Bienvenida, agenda, mini-retos, sorteo y agradecimiento a los sponsors generales", tipo: "normal" },
  { hora: "9:50 – 10:40", actividad: "Track Energía", nota: "Reto del sponsor (5 min) + 5 pitches", tipo: "pitch" },
  { hora: "10:40 – 10:55", actividad: "Dinámica", nota: "Premios de los mini-retos · el jurado de Energía delibera", tipo: "dinamica" },
  { hora: "10:55 – 11:45", actividad: "Track Cloud", nota: "Reto del sponsor + 5 pitches", tipo: "pitch" },
  { hora: "11:45 – 12:15", actividad: "Coffee break en la feria de stands", nota: "Delibera el jurado del track anterior", tipo: "pausa" },
  { hora: "12:15 – 1:05", actividad: "Track Fintech (dorado)", nota: "Reto del sponsor · se anuncian, en el auditorio, los 5 equipos de Fintech que hacen pitch", tipo: "pitch" },
  { hora: "1:05 – 2:05", actividad: "Almuerzo libre", nota: "Fuera del campus o en los comedores de la UNI · no se ofrece almuerzo", tipo: "pausa" },
  { hora: "2:05 – 2:45", actividad: "Feria de stands y networking", nota: "Último plazo del pasaporte", tipo: "pausa" },
  { hora: "2:45 – 3:00", actividad: "Dinámica final", nota: "Premios de los mini-retos", tipo: "dinamica" },
  { hora: "3:00 – 3:45", actividad: "Premiación", nota: "Ganadores por track, becas de los partners, mención a sponsors generales y sorteo final · solo gana quien está en la sala", tipo: "normal" },
  { hora: "3:45 – 4:05", actividad: "Cierre y foto grupal", tipo: "normal" },
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
            Sábado 5 de diciembre, todo el día, en el Auditorio de la FIIS de la UNI. Habrá feria de stands, los 15 finalistas
            (5 por track) hacen pitch y demo, y hay mini-retos con premios para <b>todas las personas que asistan</b>, no solo
            para quienes participan en la hackathon.
          </p>

          <div className="gf-map">
            <iframe
              title="Mapa: FIIS UNI, Lima"
              src="https://www.google.com/maps?q=FIIS+UNI+Lima&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href="https://www.google.com/maps/search/?api=1&query=FIIS+UNI+Lima"
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
