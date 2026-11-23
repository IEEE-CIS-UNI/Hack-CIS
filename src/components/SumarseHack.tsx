"use client";

/**
 * «Súmate a la hackathon», para quien ya tiene cuenta pero no está en la hack
 * (por ejemplo, se inscribió solo al bootcamp).
 *
 *   correo institucional  → pide DNI, carrera y ciclo, y lo inscribe en un paso.
 *   otro correo           → no puede por su cuenta: se le dice cómo escribirnos
 *                            para que le cambiemos el correo a mano.
 */

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import SelectorCarrera from "@/components/SelectorCarrera";
import { CICLOS, SLUG_OTRA, type Carrera } from "@/lib/carreras";
import { CORREO_CIS } from "@/lib/config";
import { api, type Persona, type Resumen } from "@/lib/resumen";

const NIVELES = ["Principiante", "Intermedio", "Avanzado", "Experto"] as const;

export default function SumarseHack({
  persona: p, token, carreras, alListo,
}: {
  persona: Persona;
  token: string;
  carreras: Carrera[];
  alListo: (r: Resumen) => void;
}) {
  const [dni, setDni] = useState("");
  const [carreraId, setCarreraId] = useState(p.career_id ? String(p.career_id) : "");
  const [carreraOtra, setCarreraOtra] = useState(p.career_other ?? "");
  const [ciclo, setCiclo] = useState(p.cycle ? String(p.cycle) : "");
  const [nivel, setNivel] = useState(p.level ?? "");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esOtra = carreras.find((c) => String(c.id) === carreraId)?.slug === SLUG_OTRA;

  // ── con otro correo: hay que escribirnos ──
  if (!p.institution) {
    const asunto = "Quiero ser parte de la hack – cambio de correo";
    const cuerpo =
      `Hola, me inscribí en HACK[CIS] UNI 2026 con este correo: ${p.email}\n` +
      `Quiero participar en la hackathon, así que quiero cambiar a mi correo institucional.\n\n` +
      `Mi correo institucional: \n\n` +
      `Mi DNI y el resto de mi perfil (carrera y ciclo) los completo después desde mi panel. ¡Gracias!`;
    const enlace = `mailto:${CORREO_CIS}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    return (
      <div className="box">
        <p className="box-h">¿Quieres participar en la hackathon?</p>
        <p className="rg-help" style={{ marginTop: 0 }}>
          La hackathon pide correo institucional (de tu universidad o instituto), y te inscribiste con <strong>{p.email}</strong>.
          Sin problema: escríbenos <strong>desde ese mismo correo</strong> a <strong>{CORREO_CIS}</strong> con el asunto
          «{asunto}», y cuéntanos cuál es tu correo institucional. Te cambiamos el correo y te avisamos; después entras con
          el correo nuevo y completas aquí en tu panel tu DNI, tu carrera y tu ciclo. No nos mandes tu DNI por correo.
        </p>
        <div className="rg-actions" style={{ marginTop: 16 }}>
          <a href={enlace} className="more solid"><Mail size={14} aria-hidden /> Escribir al equipo</a>
        </div>
      </div>
    );
  }

  // ── con correo institucional: completa y se inscribe ──
  const listo = dni.replace(/\D/g, "").length === 8 && carreraId !== "" && ciclo !== "" && (!esOtra || carreraOtra.trim().length >= 3) &&
    (p.phone || telefono.trim().length >= 7);

  async function enviar() {
    setEnviando(true);
    setError(null);
    const { datos } = await api("/api/sumarse", {
      metodo: "POST", token,
      cuerpo: { dni, carrera_id: Number(carreraId), carrera_otra: carreraOtra, ciclo: Number(ciclo), nivel, telefono },
    });
    setEnviando(false);
    if (datos.ok && datos.resumen) alListo(datos.resumen);
    else setError(datos.motivo ?? "No pudimos inscribirte. Inténtalo otra vez.");
  }

  return (
    <div className="box">
      <p className="box-h">Súmate a la hackathon</p>
      <p className="rg-help" style={{ marginTop: 0 }}>
        Tu correo institucional ya está verificado. Solo faltan unos datos para la hackathon.
      </p>

      <label className="rg-lbl" htmlFor="sh-dni" style={{ marginTop: 18 }}>DNI</label>
      <input id="sh-dni" value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
        inputMode="numeric" autoComplete="off" placeholder="8 dígitos" className="rg-input dni" />

      {!p.phone && (
        <>
          <label className="rg-lbl" htmlFor="sh-tel" style={{ marginTop: 22 }}>Celular</label>
          <input id="sh-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" inputMode="tel"
            autoComplete="tel" placeholder="999 888 777" className="rg-input" />
        </>
      )}

      <label className="rg-lbl" htmlFor="sh-carrera" style={{ marginTop: 22 }}>Carrera</label>
      <SelectorCarrera id="sh-carrera" carreras={carreras} valor={carreraId} alElegir={setCarreraId} />
      {esOtra && (
        <input value={carreraOtra} onChange={(e) => setCarreraOtra(e.target.value.slice(0, 60))} autoComplete="off"
          placeholder="¿Cuál es tu carrera?" className="rg-input" style={{ marginTop: 14 }} aria-label="Tu carrera" />
      )}

      <p className="rg-lbl" style={{ marginTop: 22 }}>¿En qué ciclo vas?</p>
      <div className="rg-chips">
        {CICLOS.map((c) => (
          <button key={c} type="button" className="rg-chip rg-year" onClick={() => setCiclo(String(c))} aria-pressed={ciclo === String(c)}>{c}</button>
        ))}
      </div>

      <p className="rg-lbl" style={{ marginTop: 22 }}>¿Cómo te ves hoy? (opcional)</p>
      <div className="rg-chips">
        {NIVELES.map((n) => (
          <button key={n} type="button" className="rg-chip" onClick={() => setNivel(nivel === n ? "" : n)} aria-pressed={nivel === n}>{n}</button>
        ))}
      </div>

      {error && <p className="rg-msg err" style={{ marginTop: 16 }}>{error}</p>}
      <div className="rg-actions" style={{ marginTop: 20 }}>
        <button className="more solid" disabled={!listo || enviando} onClick={enviar}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />} Sumarme a la hackathon
        </button>
      </div>
    </div>
  );
}
