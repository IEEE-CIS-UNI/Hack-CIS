import { LINKS } from "@/lib/config";
import Logos from "./Logos";

export default function Footer() {
  return (
    <footer id="contacto">
      <div className="wrap">
        <div className="row">
          <p>Organizado por IEEE CIS UNI, en alianza con DSC PUCP y DSC UNI.</p>
          <div className="links">
            {/* Salen del sitio: pestaña nueva, y noreferrer para no filtrarles
                desde dónde llegó la visita. */}
            <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
          </div>
        </div>
        <div style={{ marginTop: 34 }}>
          <Logos align="left" />
        </div>
        <div className="mark" aria-hidden>
          HACK[CIS]
        </div>
      </div>
    </footer>
  );
}
